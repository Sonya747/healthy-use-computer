//视频帧传输协议
export interface VideoFrame {
  frame_id: string; // UUIDv4
  timestamp: number; // Unix毫秒时间戳
  data: string; // Base64编码的JPEG图像
}


export interface PositionState {
  position: string; // 姿态类型
  confidence: number; // 置信度
}

// 提醒事件
export interface AlertEvent {
  type: string; // 事件类型
  timestamp: number; // Unix毫秒时间戳
}


// Types
export interface EyeState {
  isEyeOpen: boolean;
  confidence: number;
}

export interface DailyReport {
  date: string;
  total_usage_seconds: number;
  sessions: number;
  alerts: Record<string, number>;
}