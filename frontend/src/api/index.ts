import axios from "axios";

// API base URL
export const API_BASE_URL = 'http://localhost:8000';


// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
