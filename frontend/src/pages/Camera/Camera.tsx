import { useEffect, useRef, useState } from "react";
import { VideoCameraOutlined } from "@ant-design/icons";
import { wsUrl } from "../../constants/api";
import './index.css'
//TODO less cssmodule

/* 摄像头组件
调用摄像头，显示画面，生成Base64数据
 */
const Camera = () => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const socketRef = useRef(null);

  // 建立websocket连接
  useEffect(() => {
    if (!isCameraOn) {
      if (socketRef.current) {
        socketRef.current.close(); // 正确关闭方法
      }
      stopCamera();
      return;
    }

    // 创建原生WebSocket连接
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket已连接');
      sendVideoStream(); // 开始发送视频帧
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('分析结果:', data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };

    socketRef.current = ws;

    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [isCameraOn]);



  // 停止摄像头stream
  useEffect(() => {
    if (!isCameraOn && stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [isCameraOn, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraOn(false);
    }
  };

  // 开启摄像头stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
      sendVideoStream();
    } catch (err) {
      console.error("video stream error", err);
    }
  };

  // 发送视频帧
  //TODO
  const sendVideoStream = () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // 优化为二进制传输
    const sendFrame = () => {
      if (videoRef.current && isCameraOn && socketRef.current?.readyState === WebSocket.OPEN) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // 转换为Blob发送二进制数据
        canvas.toBlob(blob => {
          if (blob) {
            socketRef.current.send(blob); // 正确发送方法
          }
        }, 'image/jpeg', 0.7);

        requestAnimationFrame(sendFrame);
      }
    };
    sendFrame();
  };

  return (
    <div className="wrapper">
      <div className="videoWrapper">
        <video ref={videoRef} autoPlay >
          <VideoCameraOutlined />
        </video>
      </div>
      {!isCameraOn ? (
        <button onClick={startCamera}>开启监测</button>
      ) : (
        <button onClick={stopCamera}>结束监测</button>
      )}
    </div>
  );
};

export default Camera;