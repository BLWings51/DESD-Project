import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./Login";
import Home from "./Home";
import SignUp from "./SignUp";

import { MantineProvider, createTheme } from '@mantine/core';
import { theme } from './theme';

import '@mantine/core/styles.css';

const App: React.FC = () => {

  return (
    <MantineProvider theme={theme} >
      <Router>
        <Routes>
          {/* <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <Login setAuth={setAuthenticated} />} />
          <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/" />} /> */}
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
};

export default App;
