import { useEffect, useState } from "react";
import { useAuth } from './authContext';
import { Container, Group, Button, Text, Paper, Menu, Burger } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import apiRequest from "./api/apiRequest";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown } from "@tabler/icons-react";

const Navbar: React.FC = () => {
    const { isAuthenticated, logout, loggedAccountID } = useAuth();
    const [isAdmin, setIsAdmin] = useState(true);
    const [opened, { toggle }] = useDisclosure(false);
    const navigate = useNavigate();

    // Check if user is admin
    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!isAuthenticated) return;
            try {
                // const response = await apiRequest({
                //     endpoint: '/admin_check/',
                //     method: 'GET',
                // });
                // setIsAdmin(response.data?.is_admin || false);
            } catch (error) {
                console.error("Failed to check admin status:", error);
            }
        };
        checkAdminStatus();
    }, [isAuthenticated, loggedAccountID]);

    // Logout function
    const handleLogout = async () => {
        try {
            await apiRequest({ endpoint: "/logout/", method: "POST" });
            logout();
            navigate('/');
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <Paper shadow="sm" p="md" style={{ position: "sticky", top: 0, zIndex: 1000 }}>
            <Container fluid>
                <Group justify="space-between">
                    <Text size="xl" component={Link} to="/home" style={{ textDecoration: 'none' }}>
                        UWEhub
                    </Text>

                    {/* Desktop Navigation */}
                    <Group gap="lg" visibleFrom="sm">
                        <Button variant="subtle" component={Link} to="/home">
                            Home
                        </Button>

                        {/* Societies Dropdown */}
                        <Menu trigger="hover" transitionProps={{ exitDuration: 0 }}>
                            <Menu.Target>
                                <Button variant="subtle" rightSection={<IconChevronDown size={14} />}>
                                    Societies
                                </Button>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Item component={Link} to="/Societies">
                                    All Societies
                                </Menu.Item>
                                {isAdmin && (
                                    <Menu.Item component={Link} to="/Societies/CreateSociety">
                                        Create Society
                                    </Menu.Item>
                                )}
                            </Menu.Dropdown>
                        </Menu>

                        {isAuthenticated ? (
                            <>
                                <Button variant="subtle" component={Link} to="/profile">
                                    Profile
                                </Button>
                                <Button variant="subtle" onClick={handleLogout}>
                                    Logout
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

                        <Button variant="subtle" component={Link} to="/contact">
                            Contact
                        </Button>
                    </Group>

                    {/* Mobile Navigation */}
                    <Burger opened={opened} onClick={toggle} hiddenFrom="sm" />
                    {opened && (
                        <Paper hiddenFrom="sm" style={{
                            position: 'absolute',
                            top: 60,
                            right: 20,
                            zIndex: 100,
                            width: '200px',
                            padding: '10px'
                        }}>
                            <Group gap="xs" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <Button fullWidth variant="subtle" component={Link} to="/home" onClick={toggle}>
                                    Home
                                </Button>

                                <Menu>
                                    <Menu.Target>
                                        <Button fullWidth variant="subtle" rightSection={<IconChevronDown size={14} />}>
                                            Societies
                                        </Button>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Item component={Link} to="/Societies" onClick={toggle}>
                                            All Societies
                                        </Menu.Item>
                                        {isAdmin && (
                                            <Menu.Item component={Link} to="/Societies/CreateSociety" onClick={toggle}>
                                                Create Society
                                            </Menu.Item>
                                        )}
                                    </Menu.Dropdown>
                                </Menu>

                                {isAuthenticated ? (
                                    <>
                                        <Button fullWidth variant="subtle" component={Link} to="/profile" onClick={toggle}>
                                            Profile
                                        </Button>
                                        <Button fullWidth variant="subtle" onClick={() => {
                                            handleLogout();
                                            toggle();
                                        }}>
                                            Logout
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button fullWidth variant="subtle" component={Link} to="/" onClick={toggle}>
                                            Login
                                        </Button>
                                        <Button fullWidth variant="subtle" component={Link} to="/signup" onClick={toggle}>
                                            Sign Up
                                        </Button>
                                    </>
                                )}

                                <Button fullWidth variant="subtle" component={Link} to="/contact" onClick={toggle}>
                                    Contact
                                </Button>
                            </Group>
                        </Paper>
                    )}
                </Group>
            </Container>
        </Paper>
    );
};

export default Navbar;