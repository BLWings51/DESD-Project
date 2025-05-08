import { useEffect, useState } from "react";
import { Container, Title, Card, Text, Loader, Stack, Group, Badge, Flex, Button } from "@mantine/core";
import { Link } from "react-router-dom";
import { Icon } from '@iconify/react';
import bell from '@iconify-icons/tabler/bell';
import calendarEvent from '@iconify-icons/tabler/calendar-event';
import users from '@iconify-icons/tabler/users';
import messageCircle from '@iconify-icons/tabler/message-circle';
import check from '@iconify-icons/tabler/check';
import userPlus from '@iconify-icons/tabler/user-plus';
import apiRequest from "./api/apiRequest";
import { useAuth } from "./authContext";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import { updateNotificationCount } from "./Navbar";

interface Notification {
    id: number;
    message: string;
    created_at: string;
    is_read: boolean;
}

const NotificationsPage = () => {
    const { isAuthenticated, loggedAccountID } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [friendRequestCount, setFriendRequestCount] = useState(0);

    const fetchNotifications = async () => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            const response = await apiRequest<Notification[]>({
                endpoint: '/notifications/',
                method: 'GET',
            });

            if (response.error) {
                throw new Error(response.message);
            }

            if (response.data) {
                setNotifications(response.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const fetchFriendRequestCount = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await apiRequest<{ quantity: number }>({
                endpoint: '/notificationBell/',
                method: 'GET',
            });
            if (response.data) {
                // Get the total count and subtract the notification count
                const totalCount = response.data.quantity;
                const notificationCount = notifications.filter(n => !n.is_read).length;
                setFriendRequestCount(totalCount - notificationCount);
            }
        } catch (err) {
            console.error("Failed to fetch friend request count:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [isAuthenticated]);

    useEffect(() => {
        fetchFriendRequestCount();
    }, [isAuthenticated, notifications]);

    const handleMarkAsRead = async (notificationId: number) => {
        if (!notificationId) {
            setError("Invalid notification ID");
            return;
        }

        try {
            const response = await apiRequest({
                endpoint: `/notifications/${notificationId}/`,
                method: 'POST',
            });

            if (response.error) {
                throw new Error(response.message);
            }

            // Update the local state to reflect the change
            setNotifications(prevNotifications =>
                prevNotifications.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, is_read: true }
                        : notification
                )
            );

            // Trigger notification count update
            updateNotificationCount();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to mark notification as read");
        }
    };

    const getNotificationIcon = (message: string) => {
        if (message.toLowerCase().includes('event')) {
            return <Icon icon={calendarEvent} width={20} height={20} />;
        } else if (message.toLowerCase().includes('society')) {
            return <Icon icon={users} width={20} height={20} />;
        } else if (message.toLowerCase().includes('message')) {
            return <Icon icon={messageCircle} width={20} height={20} />;
        }
        return <Icon icon={bell} width={20} height={20} />;
    };

    return (
        <>
            <Sidebar>
                <Flex justify="center" align="flex-start" gap="md" px="md">
                    <div style={{ width: "200px" }} />

                    <div style={{ flex: 1, maxWidth: "900px" }}>
                        <Group justify="space-between" mb="xl">
                            <Title order={2}>Notifications</Title>
                            <div style={{ marginRight: '12px' }}>
                                <Button
                                    variant="subtle"
                                    component={Link}
                                    to="/friend-requests"
                                    style={{ 
                                        position: 'relative',
                                        padding: '8px',
                                        width: '52px',
                                        height: '52px'
                                    }}
                                >
                                    <Icon icon={userPlus} width={20} height={20} />
                                    {friendRequestCount > 0 && (
                                        <Badge
                                            size="md"
                                            color="red"
                                            style={{
                                                position: 'absolute',
                                                top: -1,
                                                right: -1,
                                                padding: '0 4px',
                                                minWidth: '18px',
                                                height: '18px',
                                                borderRadius: '9px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                border: '2px solid var(--mantine-color-body)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                zIndex: 1,
                                                transform: 'translate(0, 0)'
                                            }}
                                        >
                                            {friendRequestCount}
                                        </Badge>
                                    )}
                                </Button>
                            </div>
                        </Group>

                        {loading ? (
                            <Flex justify="center" align="center" h="200px">
                                <Loader size="xl" />
                            </Flex>
                        ) : error ? (
                            <Text c="red">{error}</Text>
                        ) : notifications.length === 0 ? (
                            <Text c="dimmed" ta="center">No notifications yet</Text>
                        ) : (
                            <Stack gap="md">
                                {notifications.map((notification) => (
                                    <Card
                                        key={notification.id}
                                        shadow="sm"
                                        p="lg"
                                        radius="md"
                                        withBorder
                                    >
                                        <Group justify="space-between">
                                            <Group>
                                                {getNotificationIcon(notification.message)}
                                                <div>
                                                    <Text>{notification.message}</Text>
                                                    <Text size="sm" c="dimmed">
                                                        {new Date(notification.created_at).toLocaleString()}
                                                    </Text>
                                                </div>
                                            </Group>
                                            <Group>
                                                {!notification.is_read && (
                                                    <>
                                                        <Badge color="blue">New</Badge>
                                                        <Button
                                                            variant="light"
                                                            size="xs"
                                                            leftSection={<Icon icon={check} width={16} height={16} />}
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                        >
                                                            Mark as Read
                                                        </Button>
                                                    </>
                                                )}
                                            </Group>
                                        </Group>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </div>

                    <div style={{ width: "200px" }} />
                </Flex>
            </Sidebar>
            <RightSidebar />
        </>
    );
};

export default NotificationsPage; 