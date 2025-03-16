const API_BASE_URL = "http://127.0.0.1:8000/api"; // Change to your Django API base URL

// Define the expected response structure
interface ApiResponse<T> {
  error: boolean;
  data?: T;
  message?: string;
}

// Define the function parameters
interface RequestOptions {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE"; // Restrict to valid HTTP methods
  data?: Record<string, any>; // Generic object for request body
  token?: string; // Optional authentication token
}

// The API request function with proper TypeScript typings
async function apiRequest<T>({ endpoint, method = "GET", data, token }: RequestOptions): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`; // Use Bearer token for JWT
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: "include", // Include cookies in the request
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData: T = await response.json();

    console.log("Raw response from backend:", responseData);

    const accessToken = getCookie("access_token");

    console.log("Access token :", accessToken);

    if (!response.ok) {
      return { error: true, message: (responseData as any)?.error || "Something went wrong!" };
    }

    return { error: false, data: responseData };
  } catch (err) {
    return { error: true, message: (err as Error).message || "Network error!" };
  }
}

// Utility function to get cookies
function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  if (value !== null || value !== undefined) return value;
  // const parts = value.split(`; ${name}=`);
  // if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return "null";
}

// Utility function to save tokens to local storage
export const saveTokensToLocalStorage = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
};

// Utility function to get tokens from local storage
export const getTokensFromLocalStorage = (): { accessToken: string | null; refreshToken: string | null } => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  return { accessToken, refreshToken };
};

// Utility function to clear tokens from local storage
export const clearTokensFromLocalStorage = (): void => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

// Function to refresh the access token
export const refreshToken = async (): Promise<string | null> => {
  const refreshToken = getCookie("refresh_token");

  if (!refreshToken) {
    return null;
  }

  const response = await apiRequest<{ access: string }>({
    endpoint: "/token/refresh/",
    method: "POST",
    data: { refresh: refreshToken },
  });

  if (response.error || !response.data) {
    return null;
  }

  return response.data.access;
};

export default apiRequest;