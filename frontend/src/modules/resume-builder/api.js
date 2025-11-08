import axios from "axios";

const API_BASE = "http://localhost:5000/api/resume";

// Create axios instance with timeout
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 8000, // 8 second timeout
});

export const getResume = (userId) => 
  apiClient.get(`/${userId}`);

export const saveResume = (data) => 
  apiClient.post("/save", data);

export const createResume = (userId) => 
  apiClient.post("/new", { userId });

