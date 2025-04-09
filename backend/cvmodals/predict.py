import torch
import torch.nn as nn
from .hpe import ResNet34
import numpy as np
from PIL import Image
import io

# 加载模型
def load_model(model_path: str) -> ResNet34:
    """
    加载预训练的ResNet34模型
    
    Args:
        model_path: .pth模型文件的路径
    
    Returns:
        加载好的ResNet34模型
    """
    model = ResNet34()
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    model.eval()  # 设置为评估模式
    return model

# 预处理图像
def preprocess_image(image_data: bytes) -> torch.Tensor:
    """
    预处理图像数据
    
    Args:
        image_data: 二进制图像数据
    
    Returns:
        预处理后的图像张量
    """
    # 将二进制数据转换为PIL图像
    image = Image.open(io.BytesIO(image_data))
    
    # 调整图像大小
    image = image.resize((224, 224))
    
    # 转换为numpy数组并归一化
    image_array = np.array(image) / 255.0
    
    # 转换为张量并添加批次维度
    image_tensor = torch.from_numpy(image_array).float()
    image_tensor = image_tensor.permute(2, 0, 1)  # 从HWC转换为CHW
    image_tensor = image_tensor.unsqueeze(0)  # 添加批次维度
    
    return image_tensor

# 预测姿态
def predict_pose(model: ResNet34, image_tensor: torch.Tensor) -> dict:
    """
    使用模型预测姿态
    
    Args:
        model: 加载好的ResNet34模型
        image_tensor: 预处理后的图像张量
    
    Returns:
        包含预测结果的字典
    """
    with torch.no_grad():
        outputs = model(image_tensor)
        
    # 将输出转换为可读的格式
    predictions = {
        'head_pitch': float(outputs[0][0]),
        'head_yaw': float(outputs[0][1]),
        'eye_state': 'open' if float(outputs[0][2]) > 0.5 else 'closed'
    }
    
    return predictions

# 组合函数
def process_image(model_path: str, image_data: bytes) -> dict:
    """
    完整的图像处理流程
    
    Args:
        model_path: .pth模型文件的路径
        image_data: 二进制图像数据
    
    Returns:
        包含预测结果的字典
    """
    # 加载模型
    model = load_model(model_path)
    
    # 预处理图像
    image_tensor = preprocess_image(image_data)
    
    # 预测姿态
    predictions = predict_pose(model, image_tensor)
    
    return predictions 