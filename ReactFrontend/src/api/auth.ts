import axios from 'axios';

const API_URL = "http://localhost:8000"

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Ensures cookies are sent with requests
    headers: {
      "Content-Type": "application/json",
    },
  });

// Define the API call function for login
export const loginUser = async (email: string, password: string) => {
  try {
    // Send a POST request to the login API endpoint with email and password
    const response = await api.post("/api/login/", { email, password });

    // Return the response data containing tokens and user info
    return response;
  } catch (error) {
    // Handle the error if the API response fails
    if (error.response) {
      throw new Error(error.response.data.detail || "Login failed");
    } else {
      // Handle other errors such as network errors
      throw new Error("An unexpected error occurred");
    }
  }
};

export const signUpUser = async (email: string, password: string) => {
    try {
      // Send a POST request to the login API endpoint with email and password
      const response = await axios.post("/api/signup/", { email, password });
  
      // Return the response data containing tokens and user info
      return response.data;
    } catch (error) {
      // Handle the error if the API response fails
      if (error.response) {
        throw new Error(error.response.data.success || "Signup failed");
      } else {
        // Handle other errors such as network errors
        throw new Error("An unexpected error occurred");
      }
    }
  };
