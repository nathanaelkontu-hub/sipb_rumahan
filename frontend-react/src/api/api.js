import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

API.interceptors.request.use((config) => {
  let token = null;
  if (window.location.pathname.startsWith("/admin")) {
    token = localStorage.getItem("sipb_admin_token") || sessionStorage.getItem("sipb_admin_token");
  } else if (window.location.pathname.startsWith("/pelanggan")) {
    token = localStorage.getItem("sipb_pelanggan_token") || sessionStorage.getItem("sipb_pelanggan_token");
  }

  if (!token) {
    token = localStorage.getItem("sipb_token") || sessionStorage.getItem("sipb_token");
  }

  if (token) {
    if (config.headers && config.headers.set) {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default API;