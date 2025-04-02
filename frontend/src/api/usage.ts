import { apiClient } from '.';
import { DailyReport } from './types';



// Session management
export const startSession = async () => {
  const response = await apiClient.post<{ session_id: number }>('/session/start');
  return response.data;
};

export const endSession = async () => {
  const response = await apiClient.post<{ status: string }>('/session/end');
  return response.data;
};

// Reports
export const getDailyReport = async () => {
  const response = await apiClient.get<DailyReport>('/report/daily');
  return response.data;
};

export default apiClient;