import { apiClient } from ".";
import { AxiosResponse } from "axios";
import { analyzeResult } from "./types";

export const postPicture = (
  blob: Blob
): Promise<AxiosResponse<analyzeResult>> =>
  apiClient.post<analyzeResult>("/video/analyze", blob, {
    headers: {
      "Content-Type": "application/octet-stream",
    },
  });

//提醒
export const postAlert = async (
  alertType: "eye" | "posture"
): Promise<number> => {
  const response = await apiClient.post<number>("/alert", {
    alert_type: alertType  // 直接传对象，axios 会自动序列化为 JSON
  });
  return response.data;
};