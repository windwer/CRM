import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle standard API format if needed, 
// though we'll mostly use this on the client side to call our own routes.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors like 401s if necessary
    return Promise.reject(error);
  }
);

export default api;
