import apiRequest from "./apiRequest";

// Endpoint definitions
const LOGIN_ENDPOINT = "/login/";
const REFRESH_ENDPOINT = "/token/refresh/";
const LOGOUT_ENDPOINT = "/logout/";

// User authentication function
export const login = async (username: string, password: string) => {
  return await apiRequest<{ message: string }>({
    endpoint: LOGIN_ENDPOINT,
    method: "POST",
    data: { username, password },
  });
};

// Logout function
export const logout = async () => {
  await apiRequest<{ message: string }>({ endpoint: LOGOUT_ENDPOINT, method: "POST" });
  window.location.href = "/login"; // Redirect user to login after logout
};

// Token refresh function
export const refreshAccessToken = async (): Promise<boolean> => {
  const response = await apiRequest<{ message: string }>({
    endpoint: REFRESH_ENDPOINT,
    method: "POST",
  });

  return !response.error; // Return `true` if refresh was successful, otherwise `false`
};
