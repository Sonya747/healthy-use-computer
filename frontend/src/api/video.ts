import { EyeState } from "./types";

export interface WebSocketHandlers {
  onOpen?: () => void;
  onMessage?: (data: EyeState) => void;
  onError?: (error: Event) => void;
}

// WebSocket connection for eye analysis
export const createEyeAnalysisWebSocket = (handlers: WebSocketHandlers) => {
  const ws = new WebSocket(`ws://localhost:8000/ws/video`);
  
  ws.onopen = () => {
    console.log('WebSocket已连接');
    handlers.onOpen?.();
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data) as EyeState;
    handlers.onMessage?.(data);
  };

  ws.onerror = (error) => {
    console.error('WebSocket错误:', error);
    handlers.onError?.(error);
  };
  
  return ws;
};