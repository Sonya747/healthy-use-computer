import os
import torch
import torch.nn as nn
import torch.utils.model_zoo as model_zoo
import datasets
import utils
import argparse
import shutil
import logging as logger
from models import ResNet34
from torch.utils.tensorboard import SummaryWriter

model_urls = {
    'resnet18': 'https://download.pytorch.org/models/resnet18-5c106cde.pth',
    'resnet34': 'https://download.pytorch.org/models/resnet34-333f7ec4.pth',
    'resnet50': 'https://download.pytorch.org/models/resnet50-19c8e357.pth',
    'resnet101': 'https://download.pytorch.org/models/resnet101-5d3b4d8f.pth',
    'resnet152': 'https://download.pytorch.org/models/resnet152-b121ed2d.pth',
}
def load_filtered_state_dict(model, snapshot):
    # By user apaszke from discuss.pytorch.org
    model_dict = model.state_dict()
    snapshot = {k: v for k, v in snapshot.items() if k in model_dict}
    model_dict.update(snapshot)
    model.load_state_dict(model_dict)

def compute_loss(pose, pred, labels, cont_labels, criterion, softmax, alpha, reg_criterion, device=torch.device('cuda:0')):
    '''计算损失，这里用了分类损失和回归损失的加权和'''
    if pose == 'yaw':
        dim = 0
    elif pose == 'pitch':
        dim = 1
    elif pose == 'roll':
        dim = 2
    else:
        raise IndexError("{} is not in ['yaw','pitch','roll']".format(pose))

    # 分类标签
    label = labels[:, dim]
    # 连续标签
    label_cont = cont_labels[:, dim]
    # 分类损失
    loss_cls = criterion(pred, label)
    # 回归损失
    predicted = softmax(pred)
    idx_tensor = torch.tensor([idx for idx in range(62)], device=device)  # 神经网络输出62类
    predicted = torch.sum(predicted * idx_tensor, 1) * 3 - 90
    print("label_cont:", label_cont)
    print("predicted:", predicted)
    loss_reg = reg_criterion(predicted, label_cont)

    # 加权损失
    loss = loss_cls + alpha * loss_reg
    return loss

def compute_error(axis, cont_labels, pred, device=torch.device('cuda:0')):
    '''计算误差'''
    if axis == 'yaw':
        dim = 0
    elif axis == 'pitch':
        dim = 1
    elif axis == 'roll':
        dim = 2
    else:
        raise IndexError("{} not in ['yaw', 'pitch', 'roll']".format(axis))

    # 连续标签
    label_cont = cont_labels[:, dim].to(device)

    predicted = utils.softmax_temperature(pred.data, 1)
    idx_tensor = torch.tensor([idx for idx in range(62)], device=device)
    predicted = torch.sum(predicted * idx_tensor, 1).to(device) * 3 - 90

    # Mean absolute error
    error = torch.sum(torch.abs(predicted - label_cont))
    return error

# 设置日志
logger.basicConfig(level=logger.INFO,
                   format='%(levelname)s %(asctime)s] %(message)s',
                   datefmt='%Y-%m-%d %H:%M:%S')


def parse_args():
    """解析输入参数"""
    parser = argparse.ArgumentParser()
    parser.add_argument('--device', help='GPU device id to use [0]', default='cuda:0', type=str)
    parser.add_argument('--num_epochs', default=10, type=int)
    parser.add_argument('--batch_size',   default=16, type=int)
    parser.add_argument('--lr', default=0.001, type=float)
    parser.add_argument('--test_data_dir',  help='训练数据集路径', default='my_300WLP', type=str)
    parser.add_argument('--train_data_dir', help='测试数据集路径', default='my_AFLW2000', type=str)
    parser.add_argument('--test_filename_list', help='训练数据集清单', default='my_300WLP.txt', type=str)

    parser.add_argument('--train_filename_list', help='测试数据集清单', default='my_AFLW2000.txt', type=str)
    parser.add_argument('--output_string', help='String appended to output snapshots.', default = 'cont', type=str)
    parser.add_argument('--alpha',  help='Regression loss coefficient.',  default=1, type=float) # compute_loss的参数，用于平衡分类损失和回归损失，alpha=1时只有回归损失
    parser.add_argument('--log_dir', type=str, default='log', help='log file direction')
    args = parser.parse_args()

    return args


def train(train_loader, criterion, softmax, alpha, reg_criterion, optimizer, epoch, num_epochs, lr_scheduler):
    model.train()
    loss_yaw_meter = utils.AverageMeter()
    loss_pitch_meter = utils.AverageMeter()
    loss_roll_meter = utils.AverageMeter()

    for i, (images, labels, cont_labels, name) in enumerate(train_loader):
        if epoch == 0:
            optimizer.param_groups[0]['lr'] = (i * 1.0 / len(train_loader) * args.lr)

        images = images.to(device)
        labels = labels.to(device)
        cont_labels = cont_labels.to(device)

        yaw, pitch, roll = model(images)

        loss_yaw = compute_loss('yaw', yaw, labels, cont_labels, criterion, softmax, alpha, reg_criterion)
        loss_pitch = compute_loss('pitch', pitch, labels, cont_labels, criterion, softmax, alpha, reg_criterion)
        loss_roll = compute_loss('roll', roll, labels, cont_labels, criterion, softmax, alpha, reg_criterion)

        loss_seq = loss_yaw + loss_pitch + loss_roll
        optimizer.zero_grad()
        loss_seq.backward()
        nn.utils.clip_grad_value_(model.parameters(), clip_value=0.5) # 梯度裁剪
        optimizer.step()
        if (epoch != 0):
            lr_scheduler.step()
        loss_yaw_meter.update(loss_yaw.data.item())
        loss_pitch_meter.update(loss_pitch.data.item())
        loss_roll_meter.update(loss_roll.data.item())
        loss_val = (loss_yaw_meter.val + loss_pitch_meter.val + loss_roll_meter.val) / 3
        loss_avg = (loss_yaw_meter.avg + loss_pitch_meter.avg + loss_roll_meter.avg) / 3

        # loss写入tensorboard
        writer.add_scalar('loss/loss_yaw', loss_yaw_meter.val, epoch * len(train_loader) + i)
        writer.add_scalar('loss/loss_pitch', loss_pitch_meter.val, epoch * len(train_loader) + i)
        writer.add_scalar('loss/loss_roll', loss_roll_meter.val, epoch * len(train_loader) + i)
        writer.add_scalar('loss/loss_val', loss_val, epoch * len(train_loader) + i)


        if i % int(len(train_loader) / 3) == 0:
            logger.info('Epoch [%d/%d], Iter [%d/%d], Losses: Yaw %.4f, Pitch %.4f, Roll %.4f, Total %.4f, Lr %.7f'
                        % (epoch + 1, num_epochs, i, len(train_loader), loss_yaw_meter.val, loss_pitch_meter.val,
                           loss_roll_meter.val, loss_val, optimizer.param_groups[0]['lr']))

        if i + 1 == len(train_loader):
            logger.info('Epoch [%d/%d], Iter [%d/%d], Losses_avg: Yaw %.4f, Pitch %.4f, Roll %.4f, Total %.4f, Lr %.7f'
                        % (epoch + 1, num_epochs, i, len(train_loader), loss_yaw_meter.avg, loss_pitch_meter.avg,
                           loss_roll_meter.avg, loss_avg, optimizer.param_groups[0]['lr']))
            writer.add_scalar('loss/loss_yaw_avg', loss_yaw_meter.avg, epoch)
            writer.add_scalar('loss/loss_pitch_avg', loss_pitch_meter.avg, epoch)
            writer.add_scalar('loss/loss_roll_avg', loss_roll_meter.avg, epoch)

    return loss_yaw_meter.avg


def validate(val_loader, model, epoch):
    model.eval()
    total, yaw_error, pitch_error, roll_error = 0., 0., 0., 0.

    for i, (images, labels, cont_labels, name) in enumerate(val_loader):
        with torch.no_grad():
            images = images.to(device)
            cont_labels = cont_labels.to(device)
            total += cont_labels.shape[0]

            # Forward pass
            yaw, pitch, roll = model(images)
            yaw_error += compute_error('yaw', cont_labels, yaw, device)
            pitch_error += compute_error('pitch', cont_labels, pitch, device)
            roll_error += compute_error('roll', cont_labels, roll, device)
            total_error = (yaw_error + pitch_error + roll_error) / 3

    # error写入tensorboard
    writer.add_scalar('val_error/yaw_error', yaw_error / total, epoch)
    writer.add_scalar('val_error/pitch_error', pitch_error / total, epoch)
    writer.add_scalar('val_error/roll_error', roll_error / total, epoch)
    writer.add_scalar('val_error/total_error', total_error/total, epoch)

    logger.info('Valid error in degrees ' + str(total) + ' valid images:\n'
                + 'Yaw: {:.4f}, Pitch {:.4f}, Roll {:.4f}, Total {:.4f}'.format(yaw_error / total, pitch_error / total,
                                                                                roll_error / total,
                                                                                total_error / total))

    return total_error / total


def test(val_loader, model, epoch):
    model.eval()
    total, yaw_error, pitch_error, roll_error = 0., 0., 0., 0.

    for i, (images, labels, cont_labels, name) in enumerate(val_loader):
        with torch.no_grad():
            images = images.to(device)
            cont_labels = cont_labels.to(device)
            total += cont_labels.shape[0]

            # Forward pass
            yaw, pitch, roll = model(images)
            yaw_error += compute_error('yaw', cont_labels, yaw, device)
            pitch_error += compute_error('pitch', cont_labels, pitch, device)
            roll_error += compute_error('roll', cont_labels, roll, device)
            total_error = (yaw_error + pitch_error + roll_error) / 3

    # error写入tensorboard
    writer.add_scalar('test_error/yaw_error', yaw_error / total, epoch)
    writer.add_scalar('test_error/pitch_error', pitch_error / total, epoch)
    writer.add_scalar('test_error/roll_error', roll_error / total, epoch)
    writer.add_scalar('test_error/total_error', total_error/total, epoch)

    logger.info('Test error in degrees ' + str(total) + ' valid images:\n'
                + 'Yaw: {:.4f}, Pitch {:.4f}, Roll {:.4f}, Total {:.4f}'.format(yaw_error / total, pitch_error / total,
                                                                                roll_error / total,
                                                                                total_error / total))

    return total_error / total


if __name__ == '__main__':
    # 设置参数
    args = parse_args()
    device = args.device
    num_epochs = args.num_epochs
    batch_size = args.batch_size

    # 初始化SummaryWriter
    tensorboardx_logdir = os.path.join(args.log_dir, '2')
    if os.path.exists(tensorboardx_logdir):
        shutil.rmtree(tensorboardx_logdir)
    writer = SummaryWriter(tensorboardx_logdir)

    # 模型保存路径
    if not os.path.exists('output/snapshots'):
        os.makedirs('output/snapshots')

    # 加载模型
    model = ResNet34().to(device)
    # 加载预训练参数
    # load_filtered_state_dict(model, model_zoo.load_url(model_urls['resnet18']))
    model.load_state_dict(torch.load('output/snapshots/' + args.output_string + '_best.pkl'))

    # 加载数据
    print('Loading data.')

    pose_dataset = datasets.Pose_300WLP(args.train_data_dir, args.train_filename_list)  # 训练数据集

    aflw2000_dataset = datasets.Pose_AFLW2000(args.test_data_dir, args.test_filename_list)  # 测试数据集

    train_size = int(0.8 * len(pose_dataset))
    val_size = len(pose_dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(pose_dataset, [train_size, val_size])

    train_loader = torch.utils.data.DataLoader(dataset=train_dataset,
                                               batch_size=batch_size,
                                               shuffle=True,
                                               num_workers=4)
    val_loader = torch.utils.data.DataLoader(dataset=val_dataset,
                                             batch_size=batch_size,
                                             shuffle=False,
                                             num_workers=2)

    test_loader = torch.utils.data.DataLoader(dataset=aflw2000_dataset, batch_size=batch_size, shuffle=False,
                                              num_workers=2)

    print('train_size:', train_size, 'val_size:', val_size, 'test_size:', len(aflw2000_dataset),\
          'len(train_loader):', len(train_loader))

    # 设置模型参数
    criterion = nn.CrossEntropyLoss().to(device)
    reg_criterion = nn.MSELoss().to(device)
    softmax = nn.Softmax(dim=1).to(device)
    alpha = torch.tensor(args.alpha).to(device)

    optimizer = torch.optim.Adam([{'params': model.parameters()}], lr=args.lr)
    lr_scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer,
                                                              T_max=args.num_epochs * len(train_loader),
                                                              eta_min=args.lr / 1000)
    logger.info('Ready to train network.')

    best_err = 100
    # best_test_err = 250.
    # epoch_since_last_best_ValError = 0

    for epoch in range(num_epochs):
        loss_train = train(train_loader, criterion, softmax, alpha, reg_criterion, optimizer, epoch, num_epochs, lr_scheduler)
        print('Validating..')
        error = validate(val_loader, model, epoch)
        print('Testing..')
        test_error = test(test_loader, model, epoch)

        # 保存最好的模型
        if error < best_err:
            best_err = error
            print('Taking snapshot as Best_' + args.output_string + '.pkl\n')  # + '_epoch_'+ str(epoch+1)
            torch.save(model.state_dict(),
                       'output/snapshots/' + args.output_string + '_best0.pkl')  # + '_epoch_'+ str(epoch+1)
        # 保存最终模型
        torch.save(model.state_dict(), 'output/snapshots/' + args.output_string + '_final0.pkl')
