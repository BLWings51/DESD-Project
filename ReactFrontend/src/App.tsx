import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./Login";
import Home from "./Home";

const App: React.FC = () => {
  const [isAuthenticated, setAuthenticated] = useState<boolean>(false);

  return (
<<<<<<< Updated upstream
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Login setAuth={setAuthenticated} />} />
        <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/" />} />
      </Routes>
    </Router>
=======
    <MantineProvider theme={theme} >
      <Router>
        <Routes>
          {/* <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Login setAuth={setAuthenticated} />} />
          <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/" />} /> */}
          <Route path="/" element={<Login setAuth={setAuthenticated} />} />
          <Route path="/home" element={<Home />} />
          <Route path="/signUp" element={<SignUp  setAuth={setAuthenticated}/>} />
        </Routes>
      </Router>
    </MantineProvider>
>>>>>>> Stashed changes
  );
};

export default App;
