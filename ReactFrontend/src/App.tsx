import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { useAuth } from './authContext';
import Login from "./Login";
import Home from "./Home";
import SignUp from "./SignUp";
import Profile from "./Profile";
import CustomNavbar from "./Navbar";
import Societies from "./Societies";
import SocietyDetail from "./SocietyDetail";
import CreateSociety from "./CreateSociety";
import UpdateSociety from "./UpdateSociety";
import CreateEvent from "./CreateEvent";
import EventDetail from "./EventDetail";
import UpdateEvent from "./UpdateEvent";
import Events from "./Events";
import { AuthProvider } from './authContext';
import ProtectedRoute from './ProtectedRoute';
import SearchPage from "./SearchPage";

import "./static/stylesheet.css";

import { MantineProvider, createTheme } from '@mantine/core';
import { theme } from './theme';

import '@mantine/core/styles.css';

const App = () => {
  return (
    <MantineProvider defaultColorScheme="dark">
      <Router>
        <AuthProvider>
          <CustomNavbar />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/home" element={<Home />} />
            <Route path="/Profile" element={<Profile />} />
            <Route path="/Profile/:accountID" element={<Profile />} />
            {/* <Route path="/Profile/Settings" element={<ProfileSettings />} /> */}
            {/* <Route path="/Profile/Delete" element={<ProfileDelete />} /> */}
            <Route path="/Societies" element={<Societies />} />
            <Route path="/events" element={<Events />} />
            <Route path="/Societies/:society_name" element={<SocietyDetail />} />
            <Route path="/Societies/CreateSociety" element={<CreateSociety />} />
            <Route path="/Societies/:society_name/UpdateSociety" element={<UpdateSociety />} />
            <Route path="/Societies/:society_name/CreateEvent" element={<CreateEvent />} />
            <Route path="/Societies/:society_name/:eventID" element={<EventDetail />} />
            <Route path="/Societies/:society_name/:eventID/UpdateEvent" element={<UpdateEvent />} />
            <Route path="/search" element={<SearchPage />} />
            {/* <Route path="/Societies/:society_name/DeleteSociety" element={<DeleteSociety />} />
            <Route path="/Societies/:society_name/Events" element={<SocietyEvents />} />
            <Route path="/Societies/:society_name/posts" element={<SocietyPosts />} />
            <Route path="/Societies/:society_name/posts/create" element={<CreatePost />} />
            <Route path="/Societies/:society_name/posts/update/:post_id" element={<UpdatePost />} />
            <Route path="/Societies/:society_name/posts/delete/:post_id" element={<DeletePost />} />
            <Route path="/posts/friends" element={<FriendsPosts />} />
            <Route path="/search" element={<SearchPage />} /> */}

            <Route element={<ProtectedRoute />}>
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </MantineProvider>
  );
};

export default App;
