const API_BASE_URL = "http://127.0.0.1:8000/api";

// Define response structure
interface ApiResponse<T> {
    error: boolean;
    data?: T;
    message?: string;
}

// Define request parameters
interface RequestOptions {
    endpoint: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    data?: Record<string, any>;
}

// Function to make API requests
async function apiRequest<T>({ endpoint, method = "GET", data }: RequestOptions): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    const options: RequestInit = {
        method,
        headers,
        credentials: "include",
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);

        if (response.status === 401) {
            // Try refreshing the token
            const refreshed = await refreshAccessToken();

            if (refreshed) {
                return apiRequest<T>({ endpoint, method, data }); // Retry request after refreshing
            } else {
                return { error: true, message: "Authentication failed" };
            }
        }

        const responseData: T = await response.json();

        if (!response.ok) {
            return { error: true, message: (responseData as any)?.error || "Something went wrong!" };
        }

        return { error: false, data: responseData };
    } catch (err) {
        return { error: true, message: (err as Error).message || "Network error!" };
    }
}

// Function to refresh the token
async function refreshAccessToken(): Promise<boolean> {
    const refreshUrl = `${API_BASE_URL}/token/refresh/`;

    try {
        const response = await fetch(refreshUrl, {
            method: "POST",
            credentials: "include", // Send cookies
        });

        return response.ok; // Return `true` if refresh was successful
    } catch (error) {
        console.error("Token refresh failed:", error);
    }

    return false; // Token refresh failed
}

export default apiRequest;
