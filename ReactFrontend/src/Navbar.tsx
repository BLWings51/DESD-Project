import { useEffect, useState } from "react";
import { useAuth } from './authContext';
import { Container, Group, Button, Text, Paper, Menu, Burger, TextInput, Loader, List, Badge } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import apiRequest from "./api/apiRequest";
import { useDisclosure } from "@mantine/hooks";
import { Icon } from '@iconify/react';
import chevronDown from '@iconify-icons/tabler/chevron-down';
import search from '@iconify-icons/tabler/search';
import bell from '@iconify-icons/tabler/bell';

interface Is_Admin {
    admin: boolean;
}

interface NotificationCount {
    quantity: number;
}

// Create a global event emitter for notification updates
const notificationEvents = new EventTarget();
export const NOTIFICATION_UPDATED = 'notification-updated';

export const updateNotificationCount = () => {
    notificationEvents.dispatchEvent(new Event(NOTIFICATION_UPDATED));
};

const Navbar: React.FC = () => {
    const { isAuthenticated, logout, loggedAccountID } = useAuth();
    const [isAdmin, setIsAdmin] = useState(true);
    const [opened, { toggle }] = useDisclosure(false);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await apiRequest<NotificationCount>({
                endpoint: '/notificationBell/',
                method: 'GET',
            });
            if (response.data) {
                setUnreadCount(response.data.quantity);
            }
        } catch (error) {
            console.error("Failed to fetch unread count:", error);
        }
    };

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

    // Fetch unread notification count
    useEffect(() => {
        fetchUnreadCount();
        // Set up polling every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        // Listen for notification updates
        const handleNotificationUpdate = () => {
            fetchUnreadCount();
        };
        notificationEvents.addEventListener(NOTIFICATION_UPDATED, handleNotificationUpdate);

        return () => {
            clearInterval(interval);
            notificationEvents.removeEventListener(NOTIFICATION_UPDATED, handleNotificationUpdate);
        };
    }, [isAuthenticated]);

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
                    <Group>
                        {isAuthenticated ? (
                            <>
                                <Button
                                    variant="subtle"
                                    component={Link}
                                    to="/notifications"
                                    style={{ position: 'relative' }}
                                >
                                    <Icon icon={bell} width={20} height={20} />
                                    {unreadCount > 0 && (
                                        <Badge
                                            size="sm"
                                            color="red"
                                            style={{
                                                position: 'absolute',
                                                top: -1,
                                                right: -1,
                                                padding: '0 4px',
                                                minWidth: '16px',
                                                height: '16px',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                border: '2px solid var(--mantine-color-body)'
                                            }}
                                        >
                                            {unreadCount}
                                        </Badge>
                                    )}
                                </Button>
                                <Button
                                    variant="subtle"
                                    component={Link}
                                    to="/friends"
                                >
                                    Friends
                                </Button>
                                <Button
                                    variant="subtle"
                                    component={Link}
                                    to="/friend-requests"
                                >
                                    Friend Requests
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
                                        <Button fullWidth variant="subtle" component={Link} to="/notifications">
                                            Notifications {unreadCount > 0 && `(${unreadCount})`}
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
                            </Group>
                        </Paper>
                    )}
                </Group>
            </Container>
        </Paper>
    );
};

export default Navbar;