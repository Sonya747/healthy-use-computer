import { useEffect, useRef, useState } from "react";

/* 摄像头组件
调用摄像头，显示画面，生成Base64数据
 */
const CameraCapture = () => {
  const videoRef = useRef(null);

  //初次挂载，启动摄像头
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("video stream error", err);
      }
    })();
  }, []);

  return (
    <>
      <div id="camra-capture" className="camera-wraper">
        {/* TODO width and height of video element  */}
        <video ref={videoRef} autoPlay style={{transform:'scaleX(-1)'}}/>
      </div>
    </>
  );
};

export default CameraCapture;
