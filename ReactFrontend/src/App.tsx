import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Home from "./Home";
import { useAuth } from "./api/auth"; // Import auth hook

const App: React.FC = () => {
	const { isAuthenticated } = useAuth(); // Get authentication state

	return (
		<Router>
			<Routes>
				<Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Login />} />
				<Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/" />} />
			</Routes>
		</Router>
	);
};

export default App;
