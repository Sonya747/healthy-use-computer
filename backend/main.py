import asyncio
from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from dataStorage.crud.usage import AlertCorrelationResponse, DataAccess, DataUpdate, PostureMetricResponse, ScreenSessionResponse
from cvmodals.eye_predict import predict_eye
from database import Base
from dataStorage.modals import AlertEvent, ScreenSession, UserSetting
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


@app.get("/data")
def get_data():
    return {"message": "Hello, World!"}



@app.post("/video/analyze")
async def analyze_video_frame(frame_data: bytes = Body(...)):
    """
    HTTP视频分析接口
    接收视频帧并返回分析结果
    """
    try:
        # 使用模型处理图像
        analysis_result = process_image( frame_data)
    #     return {
    #     'yaw': float(pred_ypr[0]),
    #     'pitch': float(pred_ypr[1]),
    #     'roll': float(pred_ypr[2])
    # }
        # analysis_result = predict_eye(frame_data) #TODO 
        return {
            'detections':[],
            'position':analysis_result
        }
    except Exception as e:
        print(f"分析失败: {str(e)}")
        return {"error": str(e)}

# 开始使用记录
@app.post("/session/start")
def start_session():
    db = SessionLocal()
    try:
        # 创建新会话
        new_session = ScreenSession(start_time=datetime.now())
        db.add(new_session)

        setting = db.query(UserSetting).first()
        if not setting:
            # 创建默认设置
            default_setting = UserSetting(
                alter_method=1,  # 对应'music'
                yall= 20,
                roll=20,
                pitch = 20,
                eyeWidth = 10
            )
            db.add(default_setting)
        
        db.commit()  # 统一提交
        
        # 重新获取设置数据（如果新建了默认设置）
        current_setting = setting or default_setting

        return {
            "session_id": new_session.id,
            "settings": {
                "alter_method": "music" if current_setting.alter_method == 1 else "silence",
                "yall": current_setting.yall,
                "roll": current_setting.roll,
                "pitch":current_setting.pitch,
                "eyeWidth":current_setting.eyeWidth
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        db.close()
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


@app.get("/report/daily")
def daily_report():
    db = SessionLocal()
    today = datetime.now().date()
    seven_days_ago = today - timedelta(days=7)
    
    # 使用时长统计
    usage = db.query(
        func.sum(ScreenSession.total_duration).label('total_duration'),
        func.count().label('sessions')
    ).filter(
        ScreenSession.start_time >= seven_days_ago,
        ScreenSession.start_time < today + timedelta(days=1)
    ).first()
    
    # 提醒统计
    alerts = db.query(
        AlertEvent.alert_type,
        func.count().label('count')
    ).filter(
        AlertEvent.trigger_time >= seven_days_ago,
        AlertEvent.trigger_time < today + timedelta(days=1)
    ).group_by(AlertEvent.alert_type).all()
    return {
        "date": today.isoformat(),
        "total_usage_seconds": usage.total_duration or 0,
        "sessions": usage.sessions or 0,
        "alerts": {alert_type: count for alert_type, count in alerts}
    }


@app.get("/report/screen-sessions")
async def read_screen_sessions(
    start_date: date,
    end_date: date,
):
    db = SessionLocal()
    try:
        raw_data = DataAccess.get_screen_sessions(db, start_date, end_date)
        processed = {}
        for item in raw_data:
            date_str = item["date"]
            if date_str not in processed:
                processed[date_str] = {"date": item["date"], "hourly_usage": {}}
            processed[date_str]["hourly_usage"][f"{int(item['hour']):02d}"] = round(item["duration_hours"]*24, 2)
        return list(processed.values())
    except Exception as e:
        raise HTTPException(500, detail=f"查询失败: {str(e)}")

@app.get("/posture-metrics", response_model=List[PostureMetricResponse])
async def read_posture_metrics(
    time_bucket: Optional[str] = "H",
):
    db = SessionLocal()
    try:
        valid_buckets = ['H','D','W','M']
        if time_bucket not in valid_buckets:
            raise ValueError("无效的时间分桶参数")
        
        data = DataAccess.get_posture_metrics(db, time_bucket)
        return [{
            "timestamp": item["timestamp"].to_pydatetime(),
            "pitch": round(item["pitch"], 1),
            "yaw": round(item["yall"], 1),
            "roll":round(item["roll"],1)
        } for item in data]
    except Exception as e:
        raise HTTPException(400, detail=str(e))

@app.get("/alert-correlation", response_model=List[AlertCorrelationResponse])
async def read_alert_correlation():
    db = SessionLocal()
    try:
        data = DataAccess.get_alert_correlation(db)
        return [{
            "date": item["date"],
            "total_duration_hours": round(item["total_duration_hours"], 2),
            "alert_count": item["alert_count"]
        } for item in data]
    except Exception as e:
        raise HTTPException(500, detail=f"数据获取失败: {str(e)}")


@app.post("/alert")
async def add_alert_event(
    alert_type: str = Body(..., embed=True)  # 从请求体获取参数
):
    db = SessionLocal()
    event = AlertEvent(alert_type=alert_type, trigger_time=datetime.now())
    db.add(event)
    db.commit()
    db.refresh(event)
    if event.id is None:
        raise HTTPException(status_code=500, detail="事件添加失败")
    return event.id

@app.post("/user-setting")
async def post_user_settings(data:dict):
    db = SessionLocal()
    try:
        new_setting = DataUpdate.updateSettings(db=db,data=data)
        return new_setting
    except HTTPException as e:
        raise e;

@app.get("/user-setting")
async def get_user_settings():
    db = SessionLocal()
    try:
        settings = db.query(UserSetting).first()
        if(settings):
            return settings

        else:
            return{}
            
    except Exception as e:
        raise e
    
