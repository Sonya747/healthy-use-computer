import asyncio
from datetime import datetime
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from database import Base
from modals.modals import AlertEvent, ScreenSession
from cvmodals.predict import process_image
import os

app = FastAPI()
#数据库配置
engine = create_engine('sqlite:///./usage.db')
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # The frontend origin
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Allow specific methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],  # Expose all headers
    max_age=3600,  # Cache preflight requests for 1 hour
)

# 初始化数据库（首次运行时创建表）
@app.on_event("startup")
def init_db():
    Base.metadata.create_all(bind=engine)

# 获取模型路径
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'cvmodals', 'resnet34.onnx')

@app.websocket("/ws/video")
async def eye_analysis_websocket(websocket: WebSocket):
    """
    WebSocket视频分析接口
    协议流程:
    1. 客户端建立连接
    2. 持续发送视频帧（二进制数据）
    3. 服务端返回预测结果
    """
    await websocket.accept()
    try:
        while True:
            # 接收二进制视频帧
            frame_data = await websocket.receive_bytes()
            
            # 使用模型处理图像
            analysis_result = process_image(MODEL_PATH, frame_data)
            
            # 发送分析结果
            await websocket.send_json(analysis_result)
            
    except Exception as e:
        print(f"连接异常断开: {str(e)}")
    finally:
        await websocket.close()



# 开始使用记录
@app.post("/session/start")
def start_session():
    db = SessionLocal()
    session = ScreenSession(start_time=datetime.now())
    db.add(session)
    db.commit()
    return {"session_id": session.id}

# 结束使用记录
@app.post("/session/end")
def end_session():
    db = SessionLocal()
    session = db.query(ScreenSession).order_by(ScreenSession.id.desc()).first()
    if session:
        session.end_time = datetime.now()
        session.total_duration = int((session.end_time - session.start_time).total_seconds())
        db.commit()
    return {"status": "ok"}

@app.get("/data")
def get_data():
    return {"message": "Hello, World!"}

@app.get("/report/daily")
def daily_report():
    db = SessionLocal()
    today = datetime.now().date()
    
    # 使用时长统计
    usage = db.query(
        func.sum(ScreenSession.total_duration).label('total_duration'),
        func.count().label('sessions')
    ).filter(
        func.date(ScreenSession.start_time) == today
    ).first()
    
    # 提醒统计
    alerts = db.query(
        AlertEvent.alert_type,
        func.count().label('count')
    ).filter(
        func.date(AlertEvent.trigger_time) == today
    ).group_by(AlertEvent.alert_type).all()
    
    return {
        "date": today.isoformat(),
        "total_usage_seconds": usage.total_duration or 0,
        "sessions": usage.sessions or 0,
        "alerts": {alert_type: count for alert_type, count in alerts}
    }