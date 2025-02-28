import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const Login: React.FC = () => {
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate(); // Hook to handle navigation

	const loginCall = async (event: React.FormEvent) => {
		event.preventDefault(); // Prevent default form submission

		try {
			const response = await fetch("http://localhost:8000/api/login/", {
				method: "POST",
				credentials: "include", // To handle cookies/sessions
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (response.ok) {
				alert("Login successful!");
				console.log("API Response:", data);
				navigate("/home"); // Redirect to home page
			} else {
				setError(data.detail || "Login failed. Please try again.");
			}
		} catch (error) {
			setError("Network error. Please check your connection.");
			console.error("Login error:", error);
		}
	};

	return (
		<div className="login-container">
			<h1>Login</h1>
			{error && <p className="error">{error}</p>}
			<form onSubmit={loginCall}>
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
				<button type="submit">Login</button>
			</form>
		</div>
	);
};

export default Login;
