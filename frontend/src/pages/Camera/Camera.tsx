import { useEffect, useRef, useState } from "react";
import { PlayCircleOutlined, StopOutlined, VideoCameraOutlined } from "@ant-design/icons";
import { wsUrl } from "../../constants/api";
import './index.css';
import { message } from "antd";
import useSound from "use-sound";
import sound from '@/assets/audio/notification.wav'

const Camera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const [playSound] =useSound(sound,{volume:0.5})

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
    // {eye_state: 'open', confidence: 0.95, timestamp: '2025-02-23T17:10:20.405124'}
    //TODO 信息反馈，提示方式
    if(data.eye_state === 'close') {
      playSound()
    }
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

  // return (
  //   <div className="camera-container">
  //     <div className="video-container">
  //       <video
  //         ref={videoRef}
  //         autoPlay
  //         className={`video-element ${isCameraOn ? 'connected' : 'disconnected'}`}
  //         onCanPlay={handleVideoConnect}
  //         onClick={isCameraOn ? stopCamera : startCamera}
  //       >
  //         {<VideoCameraOutlined className="disconnected-icon" />}
  //       </video>
  //       {/* <div className="icon-overlay">
  //         <div className="center-icon">
  //           {isCameraOn ? <StopOutlined /> : <PlayCircleOutlined />}
  //         </div>
  //       </div> */}
  //     </div>
  //   </div>
  // );

  return (
    <div className="camera-container" style={{ padding: 24, background: '#f0f2f5' }}>
      <div 
        className="video-container"
        style={{
          position: 'relative',
          maxWidth: 800,
          margin: '0 auto',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
          background: '#1a1a1a',
          aspectRatio: '16/9'
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          className={`video-element ${isCameraOn ? 'connected' : 'disconnected'}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease',
            cursor: 'pointer',
            transform: isCameraOn ? 'scale(1)' : 'scale(0.95)'
          }}
          onCanPlay={handleVideoConnect}
          onClick={isCameraOn ? stopCamera : startCamera}
        />
  
        {/* 状态指示层 */}
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: isCameraOn ? '#52c41a' : '#ff4d4f',
            boxShadow: `0 0 8px ${isCameraOn ? 'rgba(82, 196, 26, 0.4)' : 'rgba(255, 77, 79, 0.4)'}`,
            animation: 'breathing 1.5s infinite'
          }} />
          <span style={{ 
            color: 'white', 
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            fontSize: 14
          }}>
            {isCameraOn ? '监测中' : '已暂停'}
          </span>
        </div>
  
        {/* 中心控制按钮 */}
        <div 
        className="control"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer',
            transition: 'all 0.3s',
            opacity: 0.8,
            ':hover': {
              opacity: 1,
              transform: 'translate(-50%, -50%) scale(1.1)'
            }
          }}
          // onClick={isCameraOn ? stopCamera : startCamera}
        >
          {isCameraOn ? (
            <StopOutlined style={{
              fontSize: 48,
              color: '#ff4d4f',
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '50%',
              padding: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }} />
          ) : (
            // <PlayCircleOutlined style={{
            //   fontSize: 48,
            //   color: '#52c41a',
            //   background: 'rgba(255, 255, 255, 0.9)',
            //   borderRadius: '50%',
            //   padding: 16,
            //   boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            // }} />
            <></>
          )}
        </div>
  
        {/* 未连接时的占位符 */}
        {!isCameraOn && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle, #434343 0%, #262626 100%)',
            cursor:"pointer"
          }}
          onClick={isCameraOn ? stopCamera : startCamera}

          >
            <VideoCameraOutlined style={{
              fontSize: 64,
              color: 'rgba(255, 255, 255, 0.2)',
              animation: 'pulse 2s infinite'
            }} />
          </div>
        )}
      </div>
  
      {/* 全局动画定义 */}
      <style>
        {`
          @keyframes breathing {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.6; }
            50% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.6; }
          }
        `}
      </style>
    </div>
  );
};

export default Camera;