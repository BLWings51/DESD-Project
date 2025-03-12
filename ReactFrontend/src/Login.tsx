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
      const data = await loginUser(email, password);
      alert("Login successful!");
      localStorage.setItem("authToken", data.token);
      setAuth(true);
      navigate("/home");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message); // Show precise error message
      } else {
        setError("An unexpected error occurred.");
      }
      console.error("Login error:", error);
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
