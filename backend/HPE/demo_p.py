import cv2
import torch
from models import ResNet34
import utils
import os

# def data_file( filename ):
#     """Prepend the path to the data subdirectory to filename"""
#     return os.path.join( os.path.dirname(__file__), 'data', filename )

# 加载模型
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = ResNet34()
model.load_state_dict(torch.load('backend/HPE/output/snapshots/cont_best0.pkl'))
model.to(device)
model.eval()

# 对backend\HPE\my_300WLP中的文件，如果是jpg文件，则读取
i = 0
for file in os.listdir('backend/HPE/my_300WLP'):
    i += 1
    if i > 300 and file.endswith('.jpg'):
        image = cv2.imread('backend/HPE/my_300WLP/' + file)
        # 展示图片
        cv2.imshow('Image', image)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        break



# 预处理图片
image = image.transpose(2, 0, 1)
image = torch.from_numpy(image).unsqueeze(0).float()


# 使用模型进行预测
with torch.no_grad():
    pred = model(image.to(device))

# 处理模型输出

yaw_pitch_roll = []

for i in range(3):
    predicted = utils.softmax_temperature(pred[i].data, 1)
    idx_tensor = torch.tensor([idx for idx in range(62)], device=device)
    predicted = torch.sum(predicted * idx_tensor, 1).to(device) * 3 - 90
    yaw_pitch_roll.append(predicted.cpu().numpy())

print(yaw_pitch_roll)

