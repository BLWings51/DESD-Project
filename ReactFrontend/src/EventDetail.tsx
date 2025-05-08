import { useEffect, useState } from "react";
import { useAuth } from './authContext';
import { useParams, Link, useNavigate } from "react-router-dom";
import apiRequest from "./api/apiRequest";
import {
    Card,
    Title,
    Text,
    Loader,
    Button,
    Group,
    ActionIcon,
    Modal,
    Badge,
    Flex,
    Container,
    Alert,
} from "@mantine/core";
import { Icon } from '@iconify/react';
import edit from '@iconify-icons/tabler/edit';
import trash from '@iconify-icons/tabler/trash';
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
    online: boolean;
}

const EventDetail = () => {
    const { isAuthenticated, isLoading: authLoading, loggedAccountID } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSocietyAdmin, setIsSocietyAdmin] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const { society_name, eventID } = useParams<{ society_name: string; eventID: string }>();
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const navigate = useNavigate();

    // fetch user roles & membership
    useEffect(() => {
        if (!isAuthenticated || !loggedAccountID) return;
        (async () => {
            try {
                // get user database ID
                const profile = await apiRequest<{ id: number }>({
                    endpoint: `/Profile/${loggedAccountID}/`,
                    method: 'GET',
                });
                if (profile.data) setUserId(profile.data.id);

                // super-admin?
                const adm = await apiRequest<{ admin: boolean }>({
                    endpoint: '/admin_check/',
                    method: 'POST',
                });
                if (adm.data) setIsAdmin(adm.data.admin);

                // society-admin?
                const socAdm = await apiRequest<{ is_admin: boolean }>({
                    endpoint: `/Societies/${society_name}/IsSocietyAdmin/`,
                    method: 'POST',
                });
                if (socAdm.data) setIsSocietyAdmin(socAdm.data.is_admin);

                // member?
                const mem = await apiRequest<{ success: boolean }>({
                    endpoint: `/${society_name}/${loggedAccountID}/`,
                    method: 'GET',
                });
                if (mem.data) setIsMember(mem.data.success);

                // joined event?
                const join = await apiRequest<{ has_joined: boolean }>({
                    endpoint: `/Societies/${society_name}/${eventID}/CheckInterest/`,
                    method: 'GET',
                });
                if (join.data) setHasJoined(join.data.has_joined);
            } catch (e) {
                console.error(e);
            }
        })();
    }, [isAuthenticated, loggedAccountID, society_name, eventID]);

    // fetch event data
    useEffect(() => {
        (async () => {
            try {
                const resp = await apiRequest<EventDetail[]>({
                    endpoint: `/Societies/${society_name}/Events/`,
                    method: 'GET',
                });
                if (resp.data) {
                    const found = resp.data.find(e => e.id.toString() === eventID);
                    if (found) setEvent(found);
                    else setError("Event not found");
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load event");
            } finally {
                setLoading(false);
            }
        })();
    }, [society_name, eventID]);

    const handleDelete = async () => {
        try {
            await apiRequest({
                endpoint: `/Societies/${society_name}/${eventID}/DeleteEvent/`,
                method: 'DELETE',
            });
            navigate(`/Societies/${society_name}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to delete event");
        }
    };

    const handleUpdate = () => {
        navigate(`/Societies/${society_name}/${eventID}/UpdateEvent`);
    };

    const formatDateTime = (s: string) => {
        const d = new Date(s);
        if (isNaN(d.getTime())) return "Invalid date";
        return d.toLocaleString([], {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    if (loading || authLoading) return <Loader size="xl" />;
    if (error) return <Text color="red">{error}</Text>;
    if (!event) return <Text>Event not found</Text>;

    const canManage = isAdmin || isSocietyAdmin;
    const showJoin = isAuthenticated && !hasJoined && event.status === "upcoming" && isMember;
    const showLeave = isAuthenticated && hasJoined && event.status === "upcoming" && isMember;

    return (
        <>
            <Sidebar>
                <Flex px="md" gap="md" justify="center" align="flex-start">
                    <div style={{ width: 200 }} />
                    <Container size="xl" py="md" style={{ flex: 1, maxWidth: 900 }}>
                        {!isMember && (
                            <Alert color="yellow" mb="md">
                                You must be a member of this society to interact with its events.
                            </Alert>
                        )}

                        <Card mb="lg" shadow="sm" p="lg" radius="md" withBorder>
                            <Group >
                                <div>
                                    <Title order={2}>{event.name}</Title>
                                    <Text color="dimmed" size="sm">{event.location}</Text>
                                </div>
                                <Group>
                                    {showJoin && (
                                        <Button onClick={async () => {
                                            await apiRequest({ endpoint: `/Societies/${society_name}/Events/${eventID}/Join/`, method: 'POST' });
                                            setHasJoined(true);
                                        }}>
                                            Join Event
                                        </Button>
                                    )}
                                    {showLeave && (
                                        <Button color="red" variant="outline" onClick={async () => {
                                            await apiRequest({ endpoint: `/Societies/${society_name}/Events/${eventID}/Leave/`, method: 'POST' });
                                            setHasJoined(false);
                                        }}>
                                            Leave Event
                                        </Button>
                                    )}
                                    {canManage && (
                                        <>
                                            <Button leftSection={<Icon icon={edit} />} onClick={handleUpdate}>
                                                Edit Event
                                            </Button>
                                            <Button color="red" leftSection={<Icon icon={trash} />} onClick={() => setDeleteModalOpen(true)}>
                                                Delete Event
                                            </Button>
                                        </>
                                    )}
                                </Group>
                            </Group>
                        </Card>

                        <Card shadow="sm" p="lg" radius="md" withBorder>
                            <Text mb="sm"><strong>Start:</strong> {formatDateTime(event.startTime)}</Text>
                            <Text mb="sm"><strong>End:</strong>   {formatDateTime(event.endTime)}</Text>
                            <Text mb="sm"><strong>Status:</strong>{" "}
                                <Badge color={
                                    event.status === "upcoming" ? "blue" :
                                        event.status === "ongoing" ? "gray" :
                                            "green"
                                }>
                                    {event.status}
                                </Badge>
                            </Text>
                            <Text><strong>Details:</strong> {event.details}</Text>
                        </Card>

                        <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Event">
                            <Text>Are you sure?</Text>
                            <Group mt="md">
                                <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                                <Button color="red" onClick={handleDelete}>Delete</Button>
                            </Group>
                        </Modal>
                    </Container>
                    <div style={{ width: 200 }} />
                </Flex>
            </Sidebar>
            <RightSidebar />
        </>
    );
};

export default EventDetail;
