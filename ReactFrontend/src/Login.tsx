import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "./api/auth";
import "./App.css";

interface LoginProps {
  setAuth: (auth: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setAuth }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loginCall = async (event: React.FormEvent) => {
  event.preventDefault();
  setError(null);

  try {
    const response = await loginUser(email, password);
    if (!(response.status==200)) {
      const errorData = response;
      throw new Error(errorData.message || "Login failed");
    };

    const data = response;

    // Store tokens
    console.log(data)
    console.log(data.access)
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);

    alert("Login successful!");
    setAuth(true);
    navigate("/home");
  } catch (error) {
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError("An unexpected error occurred.");
    }
  }
};



  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={loginCall}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
