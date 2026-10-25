import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/libs/tts/store/auth.store";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Gắn Access Token vào header
api.interceptors.request.use(
  (config) => {
    if (typeof window === "undefined") {
      return config;
    }

    let token = null;

    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        token = parsed?.state?.accessToken;
      } catch (e) {
        // ignore
      }
    }

    if (!token) {
      token = localStorage.getItem("token");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Quản lý hàng đợi khi refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const handleLogout = () => {
  if (typeof window !== "undefined") {
    try {
      useAuthStore.getState().logout();
    } catch {
      // ignore
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    if (window.location.pathname !== "/login" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }
};

// Response Interceptor: Tự động làm mới access token khi gặp 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    // Nếu không có response hoặc status không phải 401
    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";

    // Bỏ qua không refresh cho các route auth đặc thù
    if (
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/forgot-password") ||
      requestUrl.includes("/auth/reset-password")
    ) {
      return Promise.reject(error);
    }

    // Nếu request này đã từng được retry một lần rồi mà vẫn 401 -> logout
    if (originalRequest._retry) {
      handleLogout();
      return Promise.reject(error);
    }

    // Nếu đang trong quá trình refresh token, xếp request vào hàng đợi
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    // Lấy refreshToken từ storage
    let currentRefreshToken: string | null = null;
    if (typeof window !== "undefined") {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          currentRefreshToken = parsed?.state?.refreshToken;
        } catch {
          // ignore
        }
      }
      if (!currentRefreshToken) {
        currentRefreshToken = localStorage.getItem("refreshToken");
      }
    }

    // Nếu không có refresh token -> đăng xuất và chuyển hướng về /login
    if (!currentRefreshToken) {
      isRefreshing = false;
      processQueue(new Error("No refresh token available"), null);
      handleLogout();
      return Promise.reject(error);
    }

    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      // Gọi API refresh bằng instance axios thuần để tránh interceptor lặp
      const refreshResponse = await axios.post(
        `${baseURL}/auth/refresh`,
        { refreshToken: currentRefreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const resData = refreshResponse.data?.data || refreshResponse.data;
      const newAccessToken = resData?.accessToken;
      const newRefreshToken = resData?.refreshToken;

      if (!newAccessToken) {
        throw new Error("Không nhận được access token mới từ hệ thống");
      }

      // Lưu access token và refresh token mới
      if (typeof window !== "undefined") {
        localStorage.setItem("token", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }
        try {
          useAuthStore.getState().setAccessToken(newAccessToken);
          if (newRefreshToken) {
            useAuthStore.getState().setRefreshToken(newRefreshToken);
          }
        } catch {
          // ignore
        }
      }

      // Giải phóng hàng đợi các request bị tạm dừng
      processQueue(null, newAccessToken);

      // Gắn token mới và thực hiện lại request ban đầu
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshErr) {
      // Nếu refresh token cũng hết hạn hoặc lỗi -> xóa session và chuyển về login
      processQueue(refreshErr, null);
      handleLogout();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
