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
    headers["Authorization"] = `Token ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData: T = await response.json();

    if (!response.ok) {
      return { error: true, message: (responseData as any)?.detail || "Something went wrong!" };
    }

    return { error: false, data: responseData };
  } catch (err) {
    return { error: true, message: (err as Error).message || "Network error!" };
  }
}

export default apiRequest;
