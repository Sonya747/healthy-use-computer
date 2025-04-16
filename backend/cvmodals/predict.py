import os
import numpy as np
from PIL import Image
import io
import onnxruntime as ort
import torch
import torch.nn as nn

# 加载模型
def load_model(model_path: str) -> ort.InferenceSession:
    """
    加载ONNX模型
    
    Args:
        model_path: .onnx模型文件的路径
    
    Returns:
        ONNX推理会话
    """
    try:
        # 创建ONNX运行时会话
        session = ort.InferenceSession(model_path)
        print("ONNX模型加载成功")
        return session
    except Exception as e:
        print(f"加载模型失败: {str(e)}")
        raise

# 预处理图像
def preprocess_image(image_data: bytes) -> np.ndarray:
    """
    预处理图像数据
    
    Args:
        image_data: 二进制图像数据
    
    Returns:
        预处理后的图像数组
    """
    # 将二进制数据转换为PIL图像
    image = Image.open(io.BytesIO(image_data))
    
    # 调整图像大小到320x320
    image = image.resize((320, 320))
    
    # 转换为numpy数组并归一化
    image_array = np.array(image) / 255.0
    
    # 转换为CHW格式并添加批次维度
    image_array = np.transpose(image_array, (2, 0, 1))  # HWC -> CHW
    image_array = np.expand_dims(image_array, axis=0)   # 添加批次维度
    
    # 确保数据类型和形状正确
    image_array = image_array.astype(np.float32)
    
    # 打印调试信息
    print(f"预处理后的图像形状: {image_array.shape}")
    print(f"预处理后的图像类型: {image_array.dtype}")
    
    return image_array

# 预测姿态
def predict_pose(session: ort.InferenceSession, image_array: np.ndarray) -> dict:
    """
    Args:
        session: ONNX推理会话
        image_array: 预处理后的图像数组
    
    Returns:
        包含预测结果的字典
    """
    # 获取输入名称
    input_name = session.get_inputs()[0].name
    input_shape = session.get_inputs()[0].shape
    input_type = session.get_inputs()[0].type
    print(f"模型输入名称: {input_name}")
    print(f"模型输入形状: {input_shape}")
    print(f"模型输入类型: {input_type}")
    
    # 运行推理
    predictions = session.run(None, {input_name: image_array})
    
    # 处理预测结果
    pred_ypr = []
    class_info = {
        'yaw': {'num_classes': 19, 'step': 10, 'offset': -93},
        'pitch': {'num_classes': 38, 'step': 5, 'offset': -93},
        'roll': {'num_classes': 38, 'step': 5, 'offset': -93}
    }
    axes = ['yaw', 'pitch', 'roll']
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    for axis in axes:
        # 将numpy数组转换为PyTorch张量
        pred_axis = torch.from_numpy(predictions[axes.index(axis)]).to(device)
        print(f"{axis}预测形状: {pred_axis.shape}")
        
        # 应用softmax
        predicted = nn.Softmax(dim=1)(pred_axis)
        
        # 计算角度
        idx_tensor = torch.tensor([idx for idx in range(class_info[axis]['num_classes'])], device=device)
        step = class_info[axis]['step']
        offset = class_info[axis]['offset']
        degrees = torch.sum(predicted * idx_tensor, 1).to(device) * step + offset
        pred_ypr.append(degrees.cpu().numpy()[0])
    
    print(f"预测角度: {pred_ypr}")
    
    # 返回结果
    return {
        'yaw': float(pred_ypr[0]),
        'pitch': float(pred_ypr[1]),
        'roll': float(pred_ypr[2])
    }

# 组合函数
def process_image(image_data: bytes) -> dict:
    """
    完整的图像处理流程
    
    Args:
        model_path: .onnx模型文件的路径
        image_data: 二进制图像数据
    
    Returns:
        包含预测结果的字典
    """
    position_Path = os.path.join(os.path.dirname(__file__),  'resnet34.onnx')
    # 加载模型
    print("loading ONNX model")
    positionSession = load_model(position_Path)
    
    # 预处理图像
    image_array = preprocess_image(image_data)
    
    # 预测姿态
    posePredictions = predict_pose(positionSession, image_array)
    # return {
    #     'yaw': float(pred_ypr[0]),
    #     'pitch': float(pred_ypr[1]),
    #     'roll': float(pred_ypr[2])
    # }

    # yaw_bin = predictions['head_yaw'] - torch.max(predictions['head_yaw'], dim=1, keepdim=True).values
    # pitch_bin = predictions['head_pitch'] - torch.max(predictions['head_pitch'], dim=1, keepdim=True).values
    # roll_bin = predictions['head_roll'] - torch.max(predictions['head_roll'], dim=1, keepdim=True).values
    # print(predictions)
    
    return posePredictions