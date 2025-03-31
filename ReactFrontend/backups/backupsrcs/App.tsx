import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { useAuth } from './authContext';
import Login from "./Login";
import Home from "./Home";
import SignUp from "./SignUp";
import Profile from "./Profile";
import CustomNavbar from "./Navbar";
import { AuthProvider } from './authContext';
import ProtectedRoute from './ProtectedRoute';


import { MantineProvider, createTheme } from '@mantine/core';
import { theme } from './theme';

import '@mantine/core/styles.css';

const App = () => {
  return (
    <MantineProvider theme={theme} defaultColorScheme = "dark">
      <Router>
        <AuthProvider>
          <CustomNavbar />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </MantineProvider>
  );
};


export default App;
