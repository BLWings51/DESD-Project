import { useEffect, useState } from "react";
import { Container, Group, Button, Text, Paper } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import apiRequest from "./api/apiRequest"; // Import your API request function

const Navbar: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const navigate = useNavigate();

    // Check authentication status on component mount
    useEffect(() => {
        const checkAuth = async () => {
            const response = await apiRequest<{ authenticated: boolean }>({
                endpoint: "/authenticated/", // Make sure your Django backend provides this route
                method: "POST",
            });

            setIsAuthenticated(response.data?.authenticated || false);
        };

        checkAuth();
    }, []);

    // Logout function
    const handleLogout = async () => {
        await apiRequest({ endpoint: "/logout/", method: "POST" });
        setIsAuthenticated(false);
        navigate("/"); // Redirect to login after logout
    };

    return (
        <Paper shadow="sm" p="md" style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <Container fluid>
                <Group justify="space-between">
                    {/* Logo or Title */}
                    <Text size="xl">UWEhub</Text>

                    {/* Desktop Navbar Links */}
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
