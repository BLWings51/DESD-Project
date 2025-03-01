import axios from "axios";
import { useState, useEffect } from "react";

const API_URL = "http://127.0.0.1:8000/api/";

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
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []);

  return { isAuthenticated, setIsAuthenticated };
};

export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>("login/", 
      { email, password }, 
      { headers: { "X-CSRFToken": getCookie("csrftoken") || "" } } // Add CSRF token if needed
    );
    
    return response.data; // Ensure response returns the expected object
  } catch (error: any) {
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error("Invalid credentials");
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
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
};
