import { useEffect, useRef, useState } from "react";
import { PlayCircleOutlined, StopOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { wsUrl } from "../../constants/api";
import './index.css';
import { message } from "antd";

const Camera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isCameraOn) {
      closeWebSocket();
      stopCamera();
      return;
    }

    const ws = new WebSocket(wsUrl);
    ws.onopen = handleWebSocketOpen;
    ws.onmessage = handleWebSocketMessage;
    ws.onerror = handleWebSocketError;

    socketRef.current = ws;

    return () => {
      closeWebSocket();
    };
  }, [isCameraOn]);

  const handleWebSocketOpen = () => {
    console.log('WebSocket已连接');
    sendVideoStream();
  };

  const handleWebSocketMessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    console.log('分析结果:', data);
  };

  const handleWebSocketError = (error: Event) => {
    console.error('WebSocket错误:', error);
  };

  const closeWebSocket = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraOn(false);
      message.info("监测模式结束");
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
      message.success("检测模式开启");
    } catch (err) {
      console.error("video stream error", err);
    }
  };

  const sendVideoStream = () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const sendFrame = () => {
      if (videoRef.current && isCameraOn && socketRef.current?.readyState === WebSocket.OPEN) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(blob => {
          if (blob) {
            socketRef.current.send(blob);
          }
        }, 'image/jpeg', 0.7);

        requestAnimationFrame(sendFrame);
      }
    };
    sendFrame();
  };

  const handleVideoConnect = () => {
    setIsConnected(true);
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('视频自动播放失败:', error);
      });
    }
  };

  return (
    <div className="camera-container">
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          className={`video-element ${isCameraOn ? 'connected' : 'disconnected'}`}
          onCanPlay={handleVideoConnect}
          onClick={isCameraOn ? stopCamera : startCamera}
        >
          {!isConnected && <VideoCameraOutlined className="disconnected-icon" />}
        </video>
        <div className="icon-overlay">
          <div className="center-icon">
            {isCameraOn ? <StopOutlined /> : <PlayCircleOutlined />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Camera;