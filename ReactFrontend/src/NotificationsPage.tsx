import { useEffect, useState } from "react";
import { Container, Title, Card, Text, Loader, Stack, Group, Badge, Flex } from "@mantine/core";
import { Link } from "react-router-dom";
import { Icon } from '@iconify/react';
import bell from '@iconify-icons/tabler/bell';
import calendarEvent from '@iconify-icons/tabler/calendar-event';
import users from '@iconify-icons/tabler/users';
import messageCircle from '@iconify-icons/tabler/message-circle';
import apiRequest from "./api/apiRequest";
import { useAuth } from "./authContext";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

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

    useEffect(() => {
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

        fetchNotifications();
    }, [isAuthenticated]);

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
                        <Title order={2} mb="xl">Notifications</Title>

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
                                        <Group>
                                            {getNotificationIcon(notification.message)}
                                            <div style={{ flex: 1 }}>
                                                <Text>{notification.message}</Text>
                                                <Text size="sm" c="dimmed">
                                                    {new Date(notification.created_at).toLocaleString()}
                                                </Text>
                                            </div>
                                            {!notification.is_read && (
                                                <Badge color="blue">New</Badge>
                                            )}
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