import os
import cv2
import numpy as np
import onnxruntime as ort
from fastapi import  HTTPException
from typing import List, Dict, Any

# 加载ONNX模型
def load_onnx_model(model_path: str):
    try:
        session = ort.InferenceSession(model_path)
        print("模型加载成功")
        return session
    except Exception as e:
        print(f"模型加载失败: {str(e)}")
        raise

# 等比例缩放函数（保持与训练时相同）
def resize_image_aspect_ratio(image: np.ndarray,target_size = (800, 800) ): # 根据模型输入要求修改) -> np.ndarray:
    h, w = image.shape[:2]
    target_h, target_w = target_size

    scale = min(target_h / h, target_w / w)
    new_w = int(w * scale)
    new_h = int(h * scale)

    resized_image = cv2.resize(image, (new_w, new_h))
    
    top = (target_h - new_h) // 2
    bottom = target_h - new_h - top
    left = (target_w - new_w) // 2
    right = target_w - new_w - left

    padded_image = cv2.copyMakeBorder(
        resized_image, top, bottom, left, right, 
        cv2.BORDER_CONSTANT, value=(0, 0, 0)
    )
    return padded_image

# 预处理函数
def preprocess(image: np.ndarray) -> np.ndarray:
    print(f"原始图像形状: {image.shape}")
    # 转换颜色空间 BGR -> RGB
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # 缩放和填充
    processed = resize_image_aspect_ratio(image)
    
    # 归一化 (根据模型需要调整)
    processed = processed.astype(np.float32) / 255.0
    
    # 转换为CHW格式并添加batch维度
    processed = np.transpose(processed, (2, 0, 1))
    processed = np.expand_dims(processed, axis=0)
    print(f"预处理后图像形状: {processed.shape}")
    return processed

def parse_onnx_output(outputs, score_threshold=0.5):
    """解析动态维度输出的ONNX检测结果"""
    # 获取实际输出张量
    dets_tensor = outputs[0]  # 形状 (1, N, 5)
    labels_tensor = outputs[1]  # 形状 (1, N)

    # print(f"检测结果形状: {dets_tensor.shape}, 标签形状: {labels_tensor.shape}")

    # 动态获取实际检测数N
    N = dets_tensor.shape[1]  # 运行时实际维度值
    
    # 验证输出一致性
    assert N == labels_tensor.shape[1], f"检测数不一致 dets:{N} vs labels:{labels_tensor.shape[1]}"
    print(f"检测数: {N}")
    # 转换为numpy数组
    dets = dets_tensor[0]  # 形状 (N, 5) → [x1, y1, x2, y2, score]
    labels = labels_tensor[0]  # 形状 (N,)

    # 过滤低置信度检测
    valid_mask = dets[:, 4] >= score_threshold
    valid_dets = dets[valid_mask]
    valid_labels = labels[valid_mask]

    # 组织输出格式
    results = []
    for det, label in zip(valid_dets, valid_labels):
        results.append({
            'bbox': det[:4].tolist(),    # 坐标
            'score': float(det[4]),      # 置信度
            'label': int(label)          # 类别
        })
    
    # 调试信息
    print(f"原始检测数: {N} → 有效检测数: {len(results)}")
    return results


def pos_process(outputs, 
                  original_shape, 
                  resized_shape,
                  class_names=['eyes'],
                  score_threshold=0.3): 
    """
    参数：
        outputs: ONNX模型输出
        original_shape: 原始图像尺寸 (height, width)
        resized_shape: 预处理后尺寸 (height, width)
        class_names: 类别名称映射表
        score_threshold: 置信度阈值
    返回：
        JSON格式的检测结果列表
    """
    # 解析模型输出
    detections = []
    
    # 获取输出张量
    dets = outputs[0][0]  # [N,5]
    labels = outputs[1][0]  # [N,]
    
    # 计算尺寸缩放比例
    orig_h, orig_w = original_shape
    resize_h, resize_w = resized_shape
    scale_x = orig_w / resize_w
    scale_y = orig_h / resize_h
    
    for i in range(dets.shape[0]):
        # 提取基础数据
        x1, y1, x2, y2, score = dets[i]
        print("dets:" + str(dets))
        
        # 过滤低置信度
        if score < score_threshold:
            continue
        
        # 坐标映射到原始图像
        x1 = int(round(x1 * scale_x))
        y1 = int(round(y1 * scale_y))
        x2 = int(round(x2 * scale_x))
        y2 = int(round(y2 * scale_y))
        
        # 边界保护
        x1 = max(0, min(x1, orig_w-1))
        y1 = max(0, min(y1, orig_h-1))
        x2 = max(x1+1, min(x2, orig_w))
        y2 = max(y1+1, min(y2, orig_h))
        
        # 处理标签
        label = int(labels[i])
        label_text = class_names[label] if label < len(class_names) else f'unknown_{label}'
        # print("label:" + str(labels))
        # print("label_text:" + str(class_names))
        # 构建检测项
        detection = {
            "x1": x1,
            "y1": y1,
            "x2": x2,
            "y2": y2,
            "score": round(float(score), 4),  # 保留4位小数
            "label": label,
            "label_text": label_text
        }
        detections.append(detection)
    
    return detections

# 计算原始图像尺寸
def get_image_size_with_opencv(image_bytes):
    """通过OpenCV获取图像尺寸"""
    try:
        # 将字节数据转为numpy数组
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # 解码图像（不实际处理像素数据）
        img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
        
        if img is None:
            raise ValueError("无法解码图像数据")
            
        # OpenCV返回的形状为 (height, width, channels)
        return img.shape[0], img.shape[1]
    
    except Exception as e:
        raise RuntimeError(f"尺寸获取失败: {str(e)}")


def predict_eye(image_data: bytes) -> Dict[str, Any]:
    
    eye_Path = os.path.join(os.path.dirname(__file__),  'eye.onnx')
    model_session = load_onnx_model(eye_Path)

    try:
        # 将字节数据转换为numpy数组
        nparr = np.frombuffer(image_data, np.uint8)
        
        # 解码图片（自动识别格式）
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("无法解码图片数据")

        # 预处理（
        input_tensor = preprocess(image) 
        # 模型推理
        input_name = model_session.get_inputs()[0].name
        # input_shape = model_session.get_inputs()[0].shape
        # input_type = model_session.get_inputs()[0].type
        # print(f"模型输入名称: {input_name}")
        # print(f"模型输入形状: {input_shape}")
        # print(f"模型输入类型: {input_type}")

        print(input_tensor.shape)
        # 运行推理
        output_names = [o.name for o in model_session.get_outputs()]
        print(f"模型输出名称: {output_names}")
        print(f"模型输出形状: {[o.shape for o in model_session.get_outputs()]}")
        print(f"模型输出类型: {[o.type for o in model_session.get_outputs()]}")
        outputs = model_session.run(output_names, {input_name: input_tensor})
        original_h, original_w = get_image_size_with_opencv(image_data)
        resized_h, resized_w = [800, 800]  # 预处理后的图像尺寸
        # 生成结果
        detection_results = pos_process(
            outputs=outputs,
            original_shape=(original_h, original_w),
            resized_shape=(resized_h, resized_w)
        )

        # 生成JSON数据
        return {
            "image_size": {"width": original_w, "height": original_h},
            "detections": detection_results
        }

    except ValueError as ve:
        raise HTTPException(400, f"无效的图片数据: {str(ve)}")
    except Exception as e:
        raise HTTPException(500, f"处理错误: {str(e)}")

