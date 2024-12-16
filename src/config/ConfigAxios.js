import axios from "axios";
import apiConfig from "./apiConfig";

const axiosInstance = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: 5000, // Tiempo de espera para solicitudes
});

export default axiosInstance;
