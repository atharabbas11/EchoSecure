import axios from "axios";

// const localIP = "http://localhost:3000/api";

// export const axiosInstance = axios.create({
//   baseURL: import.meta.env.MODE === "development" ? `${localIP}` : "/api",
//   withCredentials: true,
// });


const localIP = import.meta.env.VITE_API_BASE_URL; // Replace with your actual local IP
// console.log("VITE_API_BASE_URL:", localIP); // Debugging line
  
export const axiosInstance = axios.create({
  // baseURL: import.meta.env.MODE === "development" ? `${localIP}` : "/api",
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});



axiosInstance.interceptors.request.use((config) => {
  console.log("All Cookies:", document.cookie); // Debugging: Log all cookies
  
  const csrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrfTokenHeader="))
    ?.split("=")[1];

  if (csrfToken) {
    config.headers["x-csrf-token"] = csrfToken; // Add CSRF token to headers
  } else {
    console.error("CSRF token not found in cookies");
  }
  console.log("Request Headers:", config.headers); // Log headers for debugging
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("refreshToken="))
        ?.split("=")[1];

      if (refreshToken) {
        try {
          const success = await useAuthStore.getState().refreshToken();
          if (success) {
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // console.log("Token refresh failed", refreshError);
          useAuthStore.getState().logout();
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

// Add a method for file uploads
axiosInstance.uploadFile = async (url, formData) => {
  return axiosInstance.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
