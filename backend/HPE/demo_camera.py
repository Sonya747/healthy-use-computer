import cv2
import torch
from models import ResNet34
import utils
import numpy as np
import os

# def data_file( filename ):
#     """Prepend the path to the data subdirectory to filename"""
#     return os.path.join( os.path.dirname(__file__), 'data', filename )

# 加载模型
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = ResNet34()
model.load_state_dict(torch.load('backend/HPE/output/snapshots/cont_best3.pkl'))
model.to(device)
model.eval()


# 打开摄像头
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # 预处理
    frame = cv2.resize(frame, (450, 450))
    img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    img = (img.transpose((2, 0, 1)) - 127.5) * 0.0078125 # 转成(C,H,W)，归一化
    img = torch.from_numpy(img.astype(np.float32))
    input_tensor = img.unsqueeze(0)  # 增加批次维度


    with torch.no_grad():
        pred = model(input_tensor.to(device))

    # 处理模型输出
    
    yaw_pitch_roll = []
     
    for i in range(3):
        predicted = utils.softmax_temperature(pred[i].data, 1)
        idx_tensor = torch.tensor([idx for idx in range(62)], device=device)
        predicted = torch.sum(predicted * idx_tensor, 1).to(device) * 3 - 90
        yaw_pitch_roll.append(predicted.cpu().numpy())

    # 在原图上绘制
    utils.draw_axis(frame, yaw_pitch_roll[0], yaw_pitch_roll[1], yaw_pitch_roll[2])
    
    # 显示视频流
    cv2.imshow('Video', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
