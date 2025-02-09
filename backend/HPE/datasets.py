 #%%
import os
import numpy as np
import torch
from torch.utils.data import Dataset
import cv2
import utils


def get_list_from_filenames(file_path):
    # input:    relative path to .txt file with file names
    # output:   list of relative path names
    with open(file_path) as f:
        lines = f.read().splitlines()
    return lines

def transform(image):
    image = (image.transpose((2, 0, 1)) - 127.5) * 0.0078125 # 转成(C,H,W)，归一化
    image = torch.from_numpy(image.astype(np.float32))
    return image

#%%
'''
两个数据集图片都是.jpg, 450*450*3
两个数据集头部姿态标签形式相同，面部关键点标签有所不同。标签都在.mat文件中
目前标签提取到了头部姿态
下面两个类方法其实是一样的
'''

class Pose_300WLP(Dataset):

    def __init__(self, data_dir, filename_path, img_ext='.jpg', annot_ext='.mat', trans=True):
        self.data_dir = data_dir
        self.img_ext = img_ext
        self.annot_ext = annot_ext
        self.transform = trans

        filename_list = get_list_from_filenames(filename_path)

        self.X_train = filename_list
        self.y_train = filename_list
        self.length = len(filename_list)

    def __getitem__(self, index):
        # 图片路径
        link_img = os.path.join(self.data_dir, self.X_train[index] + self.img_ext)
        assert os.path.isfile(link_img) == True
        # 标签路径
        mat_path = os.path.join(self.data_dir, os.path.basename(self.y_train[index]) + self.annot_ext)

        # 获取姿态
        pose = utils.get_ypr_from_mat(mat_path)
        # 转换为度
        pitch = pose[0] * 180 / np.pi
        yaw = pose[1] * 180 / np.pi
        roll = pose[2] * 180 / np.pi
        
        img = cv2.imread(link_img)

        # 数据增强
        # if random.random() > 0.5:
        #     img = cv2.flip(img, 1)
        #     yaw = -yaw
        #     roll = -roll
    
        if self.transform == True:
            img = transform(img)
        
        # 分类标签
        bins = np.array(range(-90, 90, 3))
        labels = np.digitize([yaw, pitch, roll], bins) - 1
        # 连续标签
        cont_labels = torch.FloatTensor([yaw, pitch, roll])

        return img, labels, cont_labels, self.X_train[index]

    def __len__(self):
        # 122,450
        return self.length


class Pose_AFLW2000(Dataset):
    def __init__(self, data_dir, filename_path, img_ext='.jpg', annot_ext='.mat', trans=True):
        self.data_dir = data_dir
        self.img_ext = img_ext
        self.annot_ext = annot_ext
        self.transform = trans

        filename_list = get_list_from_filenames(filename_path)

        self.X_train = filename_list
        self.y_train = filename_list
        self.length = len(filename_list)

    def __getitem__(self, index):
        # 图片路径
        link_img = os.path.join(self.data_dir, self.X_train[index] + self.img_ext)
        assert os.path.isfile(link_img) == True
        
        # 标签路径
        mat_path = os.path.join(self.data_dir, os.path.basename(self.y_train[index]) + self.annot_ext)

        # 获取姿态
        pose = utils.get_ypr_from_mat(mat_path)
        # 转换为度
        pitch = pose[0] * 180 / np.pi
        yaw = pose[1] * 180 / np.pi
        roll = pose[2] * 180 / np.pi
        
        # 分类标签
        bins = np.array(range(-90, 90, 3))
        labels = torch.LongTensor(np.digitize([yaw, pitch, roll], bins) - 1)
        # 连续标签
        cont_labels = torch.FloatTensor([yaw, pitch, roll])

        # 读取图片
        image = cv2.imread(link_img)
        # 数据增强
        if self.transform == True:
            image = transform(image)

        return image, labels, cont_labels, self.X_train[index]

    def __len__(self):
        return self.length
    