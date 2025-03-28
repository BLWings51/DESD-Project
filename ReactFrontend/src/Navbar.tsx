import { useEffect, useState } from "react";
import { useAuth } from './authContext';
import { Container, Group, Button, Text, Paper } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import apiRequest from "./api/apiRequest";

const Navbar: React.FC = () => {
    const { isAuthenticated, logout } = useAuth();

    // Logout function
    const handleLogout = async () => {
        await apiRequest({ endpoint: "/logout/", method: "POST" });
        logout();
    };

    return (
        <Paper shadow="sm" p="md" style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <Container fluid>
                <Group justify="space-between">
                    <Text size="xl">UWEhub</Text>

                    <Group gap="lg" className="desktop-links">
                        <Button color="var(--mantine-color-secondary-5)" variant="subtle" component={Link} to="/home">
                            Home
                        </Button>

                        {isAuthenticated ? (
                            <>
                                <Button variant="subtle" onClick={handleLogout}>
                                    Logout
                                </Button>
                                <Button variant="subtle" component={Link} to="/profile">
                                    Profile
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="subtle" component={Link} to="/">
                                    Login
                                </Button>
                                <Button variant="subtle" component={Link} to="/signup">
                                    Sign Up
                                </Button>
                            </>
                        )}

                        <Button variant="subtle">Contact</Button>
                    </Group>
                </Group>
            </Container>
        </Paper>
    );
};


export default Navbar;
