import asyncio
from datetime import datetime
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from utils.webcam import mock_eye_detection

app = FastAPI()
# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # The frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)


@app.websocket("/ws/video")
async def eye_analysis_websocket(websocket: WebSocket):
    """
    WebSocket视频分析接口
    协议流程:
    1. 客户端建立连接
    2. 持续发送视频帧（二进制数据）
    3. 服务端返回EyeState JSON
    """
    print("111")
    await websocket.accept()
    print("222")
    try:
        while True:
            # 接收二进制视频帧
            frame_data = await websocket.receive_bytes()
            
            # 处理视频帧（此处需实现实际算法）
            analysis_result = await mock_eye_detection(frame_data)
            # print(analysis_result)
            # 发送分析结果
            await websocket.send_json(analysis_result)
            
    except Exception as e:
        print(f"连接异常断开: {str(e)}")
    finally:
        await websocket.close()


# ========================
# HTTP辅助接口
# ========================
@app.get("/health")
async def health_check() -> dict:
    """服务健康检查"""
    return {
        "status": "active",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/data")
def read_data():
    return {"message": "Hello from FastAPI"}