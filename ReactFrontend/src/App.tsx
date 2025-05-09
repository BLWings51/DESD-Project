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
import NotificationsPage from "./NotificationsPage";
import { AuthProvider } from './authContext';
import ProtectedRoute from './ProtectedRoute';
import PermissionRoute from './PermissionRoute';
import SearchPage from "./SearchPage";
import ChatPage from "./ChatPage";
import FriendsList from "./FriendsList";
import FriendRequests from "./FriendRequests";
import SocietyMembers from "./SocietyMembers";

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
          <div style={{ paddingTop: "60px" }}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home />} />
                <Route path="/Profile" element={<Profile />} />
                <Route path="/Profile/:accountID" element={<Profile />} />
                <Route path="/events" element={<Events />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/Societies" element={<Societies />} />
                <Route path="/Societies/CreateSociety" element={<CreateSociety />} />
                <Route path="/Societies/:society_name" element={<SocietyDetail />} />
                <Route path="/Societies/:society_name/members" element={<SocietyMembers />} />
                <Route path="/friends" element={<FriendsList />} />
                <Route path="/friend-requests" element={<FriendRequests />} />

                {/* Admin Routes */}
                <Route element={<PermissionRoute requiredPermission="admin" />}>
                  {/* Admin-only routes go here */}
                </Route>

                {/* Society Admin Routes */}
                <Route path="/Societies/:society_name">
                  <Route element={<PermissionRoute requiredPermission="society_admin" />}>
                    <Route path="UpdateSociety" element={<UpdateSociety />} />
                    <Route path="CreateEvent" element={<CreateEvent />} />
                    <Route path=":eventID/UpdateEvent" element={<UpdateEvent />} />
                  </Route>

                  {/* Member Routes */}
                  <Route element={<PermissionRoute requiredPermission="member" />}>
                    <Route path=":eventID" element={<EventDetail />} />
                    <Route path=":eventID/chat" element={<ChatPage />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </MantineProvider>
  );
};

export default App;
