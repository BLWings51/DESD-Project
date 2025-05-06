import { useEffect, useState } from "react";
import { useAuth } from './authContext';
import { useParams, Link, useNavigate } from "react-router-dom";
import apiRequest from "./api/apiRequest";
import {
    Card, Title, Text, Loader, Button,
    Group, ActionIcon, Modal, Badge, Flex
} from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

interface EventDetail {
    id: number;
    name: string;
    details: string;
    startTime: string;
    endTime: string;
    location: string;
    status: string;
}

interface Is_Admin {
    admin: boolean;
}

const EventDetail = () => {
    const { isAuthenticated, isLoading: authLoading, loggedAccountID } = useAuth();
    const [isAdmin, setIsAdmin] = useState(true);
    const { society_name, eventID } = useParams();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const navigate = useNavigate();

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

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                // First get all events for the society
                const allEventsResponse = await apiRequest<EventDetail[]>({
                    endpoint: `/Societies/${society_name}/Events/`,
                    method: 'GET',
                });

                if (allEventsResponse.data) {
                    // Find the specific event by ID
                    const foundEvent = allEventsResponse.data.find(e => e.id.toString() === eventID);
                    if (foundEvent) {
                        setEvent(foundEvent);
                    } else {
                        setError("Event not found");
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load event");
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [society_name, eventID]);

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid date";

        return date.toLocaleString([], {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = async () => {
        try {
            await apiRequest({
                endpoint: `/Societies/${society_name}/Events/${eventID}/`,
                method: 'POST',
            });
            navigate(`/Societies/${society_name}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete event");
        }
    };

    if (loading) {
        return <Loader size="xl" />;
    }

    if (error) {
        return <Text color="red">{error}</Text>;
    }

    if (!event) {
        return <Text>Event not found</Text>;
    }

    return (
        <>
            <Sidebar>
                <Flex justify="center" align="flex-start" gap="md" px="md">
                    {/* Left Sidebar Placeholder */}
                    <div style={{ width: "200px" }} />
        
                    {/* Main Content */}
                    <div style={{ flex: 1, maxWidth: "900px" }}>
                        <Group justify="space-between" mb="md">
                            <Title order={2}>{event.name}</Title>

                            <Group>
                                {isAdmin && (
                                    <>
                                        <Button
                                            leftSection={<IconEdit size={16} />}
                                            component={Link}
                                            to={`/Societies/${society_name}/Events/${eventID}/UpdateEvent`}
                                        >
                                            Edit
                                        </Button>
                                        <ActionIcon
                                            color="red"
                                            variant="outline"
                                            onClick={() => setDeleteModalOpen(true)}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </>
                                )}
                            </Group>
                        </Group>

                        <Card shadow="sm" p="lg" radius="md" withBorder>
                            <Text size="lg" mb="sm">
                                <strong>Start:</strong> {formatDateTime(event.startTime)}
                            </Text>
                            <Text size="lg" mb="sm">
                                <strong>End:</strong> {formatDateTime(event.endTime)}
                            </Text>
                            <Text size="lg" mb="sm">
                                <strong>Location:</strong> {event.location}
                            </Text>
                            <Text mb="sm">
                                <strong>Status:</strong>
                                <Badge
                                    color={event.status === 'upcoming' ? 'blue' : event.status === 'finished' ? 'green' : 'gray'}
                                    ml="sm"
                                >
                                    {event.status}
                                </Badge>
                            </Text>
                            <Text>
                                <strong>Details:</strong> {event.details}
                            </Text>
                        </Card>

                        <Modal
                            opened={deleteModalOpen}
                            onClose={() => setDeleteModalOpen(false)}
                            title="Delete Event"
                        >
                            <Text>Are you sure you want to delete this event?</Text>
                            <Group justify="flex-end" mt="md">
                                <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button color="red" onClick={handleDelete}>
                                    Delete
                                </Button>
                            </Group>
                        </Modal>
                    </div>
        
                    {/* Right Sidebar Placeholder */}
                    <div style={{ width: "200px" }} />
                </Flex>
            </Sidebar>
            <RightSidebar />
        </>
    );
};

export default EventDetail;