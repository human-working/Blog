import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api", 
});

// attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");
      const res = await axios.post("http://localhost:3000/api/auth/refresh", { refreshToken });
      localStorage.setItem("accessToken", res.data.accessToken);
      error.config.headers.Authorization = `Bearer ${res.data.accessToken}`;
      return api(error.config);
    }
    return Promise.reject(error);
  }
);

export default api;