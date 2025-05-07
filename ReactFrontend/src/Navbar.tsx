import { useEffect, useState } from "react";
import { useAuth } from './authContext';
import { Container, Group, Button, Text, Paper, Menu, Burger, TextInput, Loader, List } from "@mantine/core";
import { Link, useNavigate, useLocation } from "react-router-dom";
import apiRequest from "./api/apiRequest";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconSearch } from "@tabler/icons-react";

interface Is_Admin {
    admin: boolean;
}

const Navbar: React.FC = () => {
    const { isAuthenticated, logout, loggedAccountID } = useAuth();
    const [isAdmin, setIsAdmin] = useState(true);
    const [opened, { toggle }] = useDisclosure(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Check if we're on login or signup page
    const isAuthPage = location.pathname === '/' || location.pathname === '/signup';

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
            navigate('/');
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
                <Group justify="space-between" align="center">
                    <Text size="xl" component={Link} to="/home" style={{ textDecoration: 'none' }}>
                        UWEhub
                    </Text>
                    {!isAuthPage && (
                        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 600, margin: '0 auto' }}>
                            <TextInput
                                leftSection={<IconSearch size={18} />}
                                leftSectionPointerEvents="none"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.currentTarget.value)}
                                rightSection={searchLoading ? <Loader size="xs" /> : null}
                                style={{ width: '100%' }}
                            />
                        </form>
                    )}
                    <div style={{ width: 100 }}> {/* Spacer to balance the logo */}
                        {isAuthenticated && (
                            <Button variant="subtle" onClick={handleLogout}>
                                Logout
                            </Button>
                        )}
                    </div>
                </Group>
            </Container>
        </Paper>
    );
};

export default Navbar;