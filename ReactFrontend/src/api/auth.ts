//import axios from "axios";
import { useState, useEffect } from "react";
//const API_URL = "http://127.0.0.1:8000/api/login/";


export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        setIsAuthenticated(!!token);
    }, []);

    return { isAuthenticated, setIsAuthenticated };
};



export const loginUser = async (email: string, password: string): Promise<{ token: string }> => {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
  });

    if (response.status === 401) {
      throw new Error("Invalid credentials");
    }

    if (!response.ok) {
      throw new Error("Server error. Please try again later.");
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      // Fetch fails due to network issues (e.g., server down, no internet)
      throw new Error("Network error. Please check your connection.");
    }
    throw error; // Propagate other errors (e.g., invalid credentials)
  }
};



// Helper function to get CSRF token
/*const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop()?.split(";").shift() : undefined;
};*/