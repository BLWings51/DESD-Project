// EventDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiRequest from "./api/apiRequest";
import {
    Card, Title, Text, Loader, Button,
    Group, ActionIcon, Modal, Badge
} from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";

interface EventDetail {
    id: number;
    name: string;
    description: string;
    date: string;
    location: string;
    is_admin: boolean;
    is_attending: boolean;
}

const EventDetail = () => {
    const { society_name, eventID } = useParams();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await apiRequest<EventDetail>({
                    endpoint: `/Societies/${society_name}/${eventID}/`,
                    method: 'GET',
                });
                if (response.data) {
                    setEvent(response.data);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load event");
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [society_name, eventID]);

    const handleAttend = async () => {
        if (!event) return;

        try {
            await apiRequest({
                endpoint: `/Societies/${society_name}/${eventID}/${event.is_attending ? 'leave' : 'join'}/`,
                method: 'POST',
            });
            // Refresh event data
            const response = await apiRequest<EventDetail>({
                endpoint: `/Societies/${society_name}/${eventID}/`,
                method: 'GET',
            });
            if (response.data) {
                setEvent(response.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Operation failed");
        }
    };

    const handleDelete = async () => {
        try {
            await apiRequest({
                endpoint: `/Societies/${society_name}/${eventID}/`,
                method: 'DELETE',
            });
            navigate(`/Societies/${society_name}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete event");
        }
    };

    if (loading) {
        return <Loader size="xl" />;
    }

    if (!event) {
        return <Text>Event not found</Text>;
    }

    return (
        <div>
            <Group justify="space-between" mb="md">
                <Title order={2}>{event.name}</Title>

                <Group>
                    {event.is_admin && (
                        <>
                            <Button
                                leftSection={<IconEdit size={16} />}
                                component={Link}
                                to={`/Societies/${society_name}/${eventID}/UpdateEvent`}
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
                    <Button
                        color={event.is_attending ? 'red' : 'blue'}
                        onClick={handleAttend}
                    >
                        {event.is_attending ? 'Cancel Attendance' : 'Attend Event'}
                    </Button>
                </Group>
            </Group>

            {error && <Text color="red">{error}</Text>}

            <Card shadow="sm" padding="lg" radius="md" withBorder mb="md">
                <Text size="lg" mb="sm">
                    <strong>Date:</strong> {new Date(event.date).toLocaleString()}
                </Text>
                <Text size="lg" mb="sm">
                    <strong>Location:</strong> {event.location}
                </Text>
                <Text mb="sm">
                    <strong>Status:</strong>
                    <Badge color={new Date(event.date) > new Date() ? 'blue' : 'gray'} ml="sm">
                        {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                    </Badge>
                </Text>
                <Text>
                    <strong>Description:</strong> {event.description}
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
    );
};

export default EventDetail;