import { useEffect, useRef, useState } from "react";
import { VideoCameraOutlined } from "@ant-design/icons";
import './index.css';
import { message } from "antd";
import useSound from "use-sound";
import sound from '@/assets/audio/notification.wav';
import { createEyeAnalysisWebSocket } from '../../api/video';
import { EyeState } from '../../api/types';
import { endSession, startSession } from '../../api/usage';

const Camera = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const [playSound] = useSound(sound, { volume: 0.5 });

  useEffect(() => {
    if (!isCameraOn) {
      closeWebSocket();
      stopCamera();
      return;
    }

    const ws = createEyeAnalysisWebSocket({
      onOpen: handleWebSocketOpen,
      onMessage: handleWebSocketMessage,
      onError: handleWebSocketError
    });

    socketRef.current = ws;

    return () => {
      closeWebSocket();
    };
  }, [isCameraOn]);

  const handleWebSocketOpen = () => {
    console.log('WebSocket已连接');
    sendVideoStream();
  };

  const handleWebSocketMessage = (data: EyeState) => {
    console.log('分析结果:', data);
    if (!data.isEyeOpen) {
      playSound();
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

  const stopCamera = async () => {
    if (stream && isCameraOn) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraOn(false);
      message.info("监测模式结束");
      const res = await endSession();
      console.log("endSession",res); //TODO 获取session_id 后续删掉
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
      const res = await startSession();
      console.log("startSession",res); //TODO 获取session_id 后续删掉
      message.success("检测模式开启");
    } catch (err) {
      console.error("video stream error", err);
    }
    setTimeout(() => {
      message.info("歪头");
    }, 10000);
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
    // setIsConnected(true);
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error('视频自动播放失败:', error);
      });
    }
  };

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
            // ':hover': {
            //   opacity: 1,
            //   transform: 'translate(-50%, -50%) scale(1.1)'
            // }
          }}
        // onClick={isCameraOn ? stopCamera : startCamera}
        >

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
            cursor: "pointer"
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