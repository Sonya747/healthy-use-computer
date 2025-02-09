###################### 以下待完成：

import cv2
import torch
from models import ResNet34
import utils

# 加载模型
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = ResNet34()
model.load_state_dict(torch.load('output/snapshots/cont_best.pkl'))
model.to(device)
model.eval()

# 打开摄像头
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # 预处理图像
    # 这里需要添加图像预处理代码，例如调整大小、归一化等。需要(3,450,450)的输入
    # 假设处理后的图像为input_tensor

    with torch.no_grad():
        pred = model(input_tensor.to(device))

    # 处理模型输出
    predicted = utils.softmax_temperature(pred.data, 1)
    idx_tensor = torch.tensor([idx for idx in range(62)], device=device)
    predicted = torch.sum(predicted * idx_tensor, 1).to(device) * 3 - 90

    # 打印预测值
    print(predicted.cpu().numpy())

    # 显示视频流
    cv2.imshow('Video', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
