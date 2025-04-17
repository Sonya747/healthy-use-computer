import { apiClient } from ".";
import { SettingData } from "../pages/Setting/Setting";

export const postSetting = async (settings: SettingData) => {
  const response = await apiClient.post<SettingData>("/user-setting",settings);
  return response.data;
};

export const getSetting = async () => {
  const response = await apiClient.get<SettingData>("user-setting");
  return  response.data
};
