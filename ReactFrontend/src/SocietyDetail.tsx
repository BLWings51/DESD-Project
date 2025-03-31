import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import apiRequest from "./api/apiRequest";
import {
    Card, Title, Text, Loader, Flex, Button, Image,
    Tabs, Badge, Group, ActionIcon, Modal, Textarea, Box
} from "@mantine/core";
import { IconEdit, IconTrash, IconCalendarEvent } from "@tabler/icons-react";

interface SocietyDetail {
    name: string;
    description: string;
    numOfInterestedPeople: number;
    logo?: string | null;
    is_member?: boolean;
}

interface Event {
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

const SocietyDetail = () => {
    const { society_name } = useParams<{ society_name: string }>();
    const { isAuthenticated, loggedAccountID } = useAuth();
    const [society, setSociety] = useState<SocietyDetail | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!isAuthenticated) return;
            try {
                const response = await apiRequest<Is_Admin>({
                    endpoint: '/admin_check/',
                    method: 'POST',
                });
                setIsAdmin(response.data?.admin || false);
                console.log("iouaerhgioAWHGOIHWEGIOHGEORFIH")
                console.log(response.data?.admin)
            } catch (error) {
                console.error("Failed to check admin status:", error);
            }
        };
        checkAdminStatus();
    }, [isAuthenticated, loggedAccountID]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch society details using the number (society_name in URL)
                const societyResponse = await apiRequest<SocietyDetail>({
                    endpoint: `/Societies/${society_name}/`,
                    method: 'GET',
                });

                if (societyResponse.data) {
                    setSociety({
                        ...societyResponse.data,
                    });
                }

                // Fetch society events using the actual name from response
                if (societyResponse.data?.name) {
                    const eventsResponse = await apiRequest<Event[]>({
                        endpoint: `/Societies/${societyResponse.data.name}/Events/`,
                        method: 'GET',
                    });
                    setEvents(eventsResponse.data || []);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load society");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [society_name]);

    const handleJoin = async () => {
        if (!society) return;

        try {
            await apiRequest({
                endpoint: `/Societies/${society_name}/join/`,
                method: 'POST',
            });
            // Refresh society data
            const response = await apiRequest<SocietyDetail>({
                endpoint: `/Societies/${society_name}/`,
                method: 'GET',
            });
            if (response.data) {
                setSociety(response.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Operation failed");
        }
    };

    const handleLeave = async () => {
        if (!society) return;

        try {
            await apiRequest({
                endpoint: `/Societies/${society_name}/leave/`,
                method: 'POST',
            });
            // Refresh society data
            const response = await apiRequest<SocietyDetail>({
                endpoint: `/Societies/${society_name}/`,
                method: 'GET',
            });
            if (response.data) {
                setSociety(response.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Operation failed");
        }
    };

    const handleDeleteSociety = async () => {
        try {
            await apiRequest({
                endpoint: `/Societies/${society_name}/DeleteSociety/`,
                method: 'DELETE',
            });
            navigate('/Societies');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete society");
        }
    };

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

    if (loading) {
        return <Loader size="xl" />;
    }

    if (!society) {
        return <Text>Society not found</Text>;
    }

    return (
        <Box p="md">
            {/* Header Section with Responsive Flex */}
            <Flex 
                justify="space-between" 
                align="center" 
                mb="md"
                wrap="wrap"
                gap="md"
                pr={{ base: 'md', xs: 0 }} // Prevent scrollbar overlap
            >
                <Title order={2}>{society.name}</Title>

                <Group wrap="nowrap">
                    {isAdmin && (
                        <>
                            <Button
                                leftSection={<IconEdit size={16} />}
                                component={Link}
                                to={`/Societies/${society_name}/UpdateSociety/`}
                                size="compact-md"
                            >
                                Edit
                            </Button>
                            <ActionIcon
                                color="red"
                                variant="outline"
                                onClick={() => setDeleteModalOpen(true)}
                                size="lg"
                            >
                                <IconTrash size={16} />
                            </ActionIcon>
                        </>
                    )}
                    {isAuthenticated && (
                        <Group wrap="nowrap">
                            <Button
                                color="blue"
                                onClick={handleJoin}
                                size="compact-md"
                            >
                                Join ({society.numOfInterestedPeople})
                            </Button>
                            <Button
                                color="red"
                                onClick={handleLeave}
                                size="compact-md"
                            >
                                Leave
                            </Button>
                        </Group>
                    )}
                </Group>
            </Flex>

            {/* Society Details Card */}
            <Card 
                shadow="sm" 
                p="lg" 
                radius="md" 
                withBorder 
                mb="md"
                style={{ overflow: 'hidden' }}
            >
                <Card.Section>
                    <Image
                        src={society.logo || '/default-society-logo.png'}
                        height={300}
                        alt={society.name}
                        fit="cover"
                    />
                </Card.Section>
                <Text mt="md">{society.description}</Text>
            </Card>

            {/* Events Section */}
            <Tabs defaultValue="events">
                <Tabs.List>
                    <Tabs.Tab value="events" leftSection={<IconCalendarEvent size={16} />}>
                        Events
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="events" pt="md">
                    <Flex direction="column" gap="md">
                        {isAdmin && (
                            <Button
                                component={Link}
                                to={`/Societies/${society_name}/CreateEvent/`}
                                w={{ base: '100%', sm: 'fit-content' }}
                            >
                                Create Event
                            </Button>
                        )}

                        {events.length > 0 ? (
                            events.map((event) => (
                                <Card 
                                    key={event.id} 
                                    shadow="sm" 
                                    p="lg" 
                                    radius="md" 
                                    withBorder
                                >
                                    <Flex 
                                        justify="space-between" 
                                        align={{ base: 'flex-start', sm: 'center' }}
                                        direction={{ base: 'column', sm: 'row' }}
                                        gap="md"
                                    >
                                        <div>
                                            <Title order={4}>{event.name}</Title>
                                            <Text>
                                                {formatDateTime(event.startTime)} - {formatDateTime(event.endTime)}
                                            </Text>
                                            <Text>{event.location}</Text>
                                            <Badge
                                                color={event.status === 'upcoming' ? 'blue' : 'green'}
                                                mt="sm"
                                            >
                                                {event.status}
                                            </Badge>
                                        </div>
                                        <Button
                                            component={Link}
                                            to={`/Societies/${society_name}/${event.id}`}
                                            variant="outline"
                                            w={{ base: '100%', sm: 'fit-content' }}
                                        >
                                            View Details
                                        </Button>
                                    </Flex>
                                </Card>
                            ))
                        ) : (
                            <Text>No events scheduled</Text>
                        )}
                    </Flex>
                </Tabs.Panel>
            </Tabs>

            {/* Delete Modal (keep existing) */}
            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Society"
                centered

            >
                <Text>Are you sure you want to delete this society?</Text>
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button color="red" onClick={handleDeleteSociety}>
                        Delete
                    </Button>
                </Group>
            </Modal>
        </Box>
    );
};

export default SocietyDetail;