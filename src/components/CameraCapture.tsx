import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { VideoCameraOutlined } from "@ant-design/icons";
/* 摄像头组件
调用摄像头，显示画面，生成Base64数据
 */
const CameraCapture = () => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    //TODO socket.io server url
    socketRef.current = io("http://websocket-server-url");
    // 监听后端消息
    socketRef.current.on("message-from-backend", (message) => {
      console.log("Message ", message);
    });
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

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

  const sendVideoStream = () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const sendFrame = () => {
      if (videoRef.current && isCameraOn) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const frame = canvas.toDataURL("image/jpeg");
        socketRef.current.emit("video-frame", frame);
        requestAnimationFrame(sendFrame);
      }
    };

    sendFrame();
  };

  return (
    <div>
      <video ref={videoRef} height={500} style={{padding:'8px'}} autoPlay >
        <VideoCameraOutlined />
        </video>
      {!isCameraOn ? (
        <button onClick={startCamera}>开启监测</button>
      ) : (
        <button onClick={stopCamera}>结束监测</button>
      )}
    </div>
  );
};

export default CameraCapture;
