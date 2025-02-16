//视频帧传输协议
declare namespace API {
  interface VideoFrame {
    frame_id: string; // UUIDv4
    timestamp: number; // Unix毫秒时间戳
    data: string; // Base64编码的JPEG图像
  }
}
