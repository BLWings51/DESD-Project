import axios from "axios";
import { useState, useEffect } from "react";

const API_URL = "http://127.0.0.1:8000/api/login/";


export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        setIsAuthenticated(!!token);
    }, []);

    return { isAuthenticated, setIsAuthenticated };
};


export const loginUser = async (email: string, password: string) => {
  try {
    const csrfToken = getCookie("csrftoken"); // CSRF token for security

    const response = await axios.post(
      API_URL,
      { email, password },
      {
        headers: {
          "X-CSRFToken": csrfToken,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    return response.data; // Return login response
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

// Helper function to get CSRF token
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop()?.split(";").shift() : undefined;
};
