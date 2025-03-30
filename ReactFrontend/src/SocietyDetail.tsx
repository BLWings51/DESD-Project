import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import apiRequest from "./api/apiRequest";
import {
    Card, Title, Text, Loader, Flex, Button, Image,
    Tabs, Badge, Group, ActionIcon, Modal, Textarea
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
    description: string;
    date: string;
    location: string;
}

const SocietyDetail = () => {
    const { society_name } = useParams<{ society_name: string }>();
    const { isAuthenticated, loggedAccountID } = useAuth();
    const [society, setSociety] = useState<SocietyDetail | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const navigate = useNavigate();

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

    const handleJoinLeave = async () => {
        if (!society) return;

        try {
            await apiRequest({
                endpoint: `/Societies/${society_name}/${society.is_member ? 'leave' : 'join'}/`,
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
                endpoint: `/Societies/${society_name}/`,
                method: 'DELETE',
            });
            navigate('/Societies');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete society");
        }
    };

    if (loading) {
        return <Loader size="xl" />;
    }

    if (!society) {
        return <Text>Society not found</Text>;
    }

    return (
        <div>
            <Flex justify="space-between" align="center" mb="md">
                <Title order={2}>{society.name}</Title>

                <Group>
                    {true && (
                        <>
                            <Button
                                leftSection={<IconEdit size={16} />}
                                component={Link}
                                to={`/Societies/${society_name}/UpdateSociety`}
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
                    {isAuthenticated && !true && (
                        <Button
                            color={society.is_member ? 'red' : 'blue'}
                            onClick={handleJoinLeave}
                        >
                            {society.is_member ? 'Leave' : 'Join'} ({society.numOfInterestedPeople})
                        </Button>
                    )}
                </Group>
            </Flex>

            {error && <Text color="red">{error}</Text>}

            <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                <Card.Section>
                    <Image
                        src={society.logo || '/default-society-logo.png'}
                        height={300}
                        alt={society.name}
                    />
                </Card.Section>
                <Text mt="md">{society.description}</Text>
            </Card>

            <Tabs defaultValue="events">
                <Tabs.List>
                    <Tabs.Tab value="events" leftSection={<IconCalendarEvent size={16} />}>
                        Events
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="events">
                    {true && (
                        <Button
                            component={Link}
                            to={`/Societies/${society_name}/CreateEvent`}
                            mb="md"
                        >
                            Create Event
                        </Button>
                    )}

                    {events.length > 0 ? (
                        events.map((event) => (
                            <Card key={event.id} shadow="sm" padding="lg" radius="md" withBorder mb="sm">
                                <Group justify="space-between">
                                    <div>
                                        <Title order={4}>{event.name}</Title>
                                        <Text>{new Date(event.date).toLocaleString()}</Text>
                                        <Text>{event.location}</Text>
                                    </div>
                                    <Button
                                        component={Link}
                                        to={`/Societies/${society_name}/${event.id}`}
                                        variant="outline"
                                    >
                                        View Details
                                    </Button>
                                </Group>
                            </Card>
                        ))
                    ) : (
                        <Text>No events scheduled</Text>
                    )}
                </Tabs.Panel>
            </Tabs>

            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Society"
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
        </div>
    );
};

export default SocietyDetail;