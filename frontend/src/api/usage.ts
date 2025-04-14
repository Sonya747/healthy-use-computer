import { Moment } from 'moment';
import { apiClient } from '.';
import { formatISO, subDays } from 'date-fns'; // Ensure you have date-fns installed
import { AlertCorrelation, PostureMetric, ScreenSessionData } from '../pages/Report/types';
import dayjs from 'dayjs';
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
 

export const getScreenSessions = async () => {
  const endDate = new Date();
  const startDate = subDays(endDate, 7);

  const response = await apiClient.get('/report/screen-sessions', {
    params: {
      start_date: formatISO(startDate, { representation: 'date' }),
      end_date: formatISO(endDate, { representation: 'date' }),
    },
  });

  return response.data;
};

export const fetchScreenSessions = async (
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs
): Promise<ScreenSessionData[]> => {
  const response = await apiClient.get('/report/screen-sessions', {
    params: {
      start_date: startDate.format('YYYY-MM-DD'),
      end_date: endDate.format('YYYY-MM-DD')
    }
  });
  return response.data;
};

export const fetchPostureMetrics = async (
  threshold = 25,
  timeBucket = '5min'
): Promise<PostureMetric[]> => {
  const response = await apiClient.get('/posture-metrics', {
    params: { threshold, time_bucket: timeBucket }
  });
  return response.data;
};

export const fetchAlertCorrelation = async (): Promise<AlertCorrelation[]> => {
  const response = await apiClient.get('/alert-correlation');
  return response.data;
};