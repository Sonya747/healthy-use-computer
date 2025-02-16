import CameraCapture from "../../components/CameraCapture";
import { wsUrl } from "../../constants/api";

const Camera = () => {
  const setWs = () => {
    const ws = new WebSocket(wsUrl)
    ws.onopen = () => {
      console.log("websocket建立连接")
    }
  }
  return (<>
    <CameraCapture /></>)
}
export default Camera;