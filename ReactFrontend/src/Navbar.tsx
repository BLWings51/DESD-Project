import { useEffect, useState } from "react";
import { useAuth } from './authContext';
import { Container, Group, Button, Text, Paper, Menu, Burger, TextInput, Loader, List } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import apiRequest from "./api/apiRequest";
import { useDisclosure } from "@mantine/hooks";
import { Icon } from '@iconify/react';
import chevronDown from '@iconify-icons/tabler/chevron-down';
import search from '@iconify-icons/tabler/search';

interface Is_Admin {
    admin: boolean;
}

const Navbar: React.FC = () => {
    const { isAuthenticated, logout, loggedAccountID } = useAuth();
    const [isAdmin, setIsAdmin] = useState(true);
    const [opened, { toggle }] = useDisclosure(false);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Check if user is admin
    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!isAuthenticated) return;
            try {
                const response = await apiRequest<Is_Admin>({
                    endpoint: '/admin_check/',
                    method: 'POST',
                });
                setIsAdmin(response.data?.admin || false);
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
            // Redirect to login page (root URL)
            window.location.href = "/";
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    };

    return (
        <Paper shadow="sm" p="md" style={{ position: "sticky", top: 0, zIndex: 1000 }}>
            <Container fluid>
                <Group justify="space-between">
                    <Text size="xl" component={Link} to="/home" style={{ textDecoration: 'none' }}>
                        UWEhub
                    </Text>
                    {isAuthenticated && (
                        <form onSubmit={handleSearch} style={{ flex: 1, marginLeft: 24, marginRight: 24 }}>
                            <TextInput
                                leftSection={<Icon icon={search} width={18} height={18} />}
                                leftSectionPointerEvents="none"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                                rightSection={searchLoading ? <Loader size="xs" /> : null}
                                style={{ minWidth: 300 }}
                            />
                        </form>
                    )}

                    {/* Desktop Navigation */}
                    <Group gap="lg" visibleFrom="sm">
                        {isAuthenticated ? (
                            <>
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
                                {isAuthenticated ? (
                                    <>
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
                            </Group>
                        </Paper>
                    )}
                </Group>
            </Container>
        </Paper>
    );
};

export default Navbar;