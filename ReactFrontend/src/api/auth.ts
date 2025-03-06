import axios from "axios";
import { useState, useEffect } from "react";

// Use environment variable for API URL to avoid hardcoding
const API_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000/api/";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Ensures cookies are sent with requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Define response types
interface AuthStatusResponse {
  authenticated: boolean;
}

interface LoginResponse {
  status: number;
  token: string;
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get<AuthStatusResponse>("auth-status/");
        setIsAuthenticated(response.data.authenticated);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []);

  return { isAuthenticated, setIsAuthenticated };
};

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>(
      "login/",
      { email, password },
      { headers: { "X-CSRFToken": getCookie("csrftoken") || "" } }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "";

      if (status === 404) {
        // Specifically handle "Account does not exist"
        throw new Error("Account does not exist, please sign up.");
      } else if (status === 400) {
        if (message.toLowerCase().includes("invalid credentials")) {
          throw new Error("Invalid email or password.");
        } else {
          throw new Error("Bad request, please check your input.");
        }
      } else if (status === 401) {
        throw new Error("Invalid credentials.");
      } else {
        throw new Error("Server error. Please try again later.");
      }
    } else if (error.request) {
      throw new Error("Network error. Please check your connection.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
};


// Helper function to get CSRF token
const getCookie = (name: string): string | undefined => {
  const match = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`);
  return match ? decodeURIComponent(match[2]) : undefined;
};


export const signUpUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>(
      "login/",
      { email, password },
      { headers: { "X-CSRFToken": getCookie("csrftoken") || "" } }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "";

      if (status === 404) {
        // Specifically handle "Account does not exist"
        throw new Error("Account does not exist, please sign up.");
      } else if (status === 400) {
        if (message.toLowerCase().includes("invalid credentials")) {
          throw new Error("Invalid email or password.");
        } else {
          throw new Error("Bad request, please check your input.");
        }
      } else if (status === 401) {
        throw new Error("Invalid credentials.");
      } else {
        throw new Error("Server error. Please try again later.");
      }
    } else if (error.request) {
      throw new Error("Network error. Please check your connection.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
};