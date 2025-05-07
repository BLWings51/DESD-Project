// Profile.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Card,
    Title,
    Text,
    Loader,
    Flex,
    Alert,
    TextInput,
    Textarea,
    Button,
    Modal,
    Group,
    ActionIcon,
    Box,
    Badge,
    Avatar
} from "@mantine/core";
import { useForm } from "@mantine/form";
// import {
//     IconEdit,
//     IconTrash,
//     IconCheck,
//     IconX,
//     IconCalendarEvent,
//     IconUsers
// } from "@tabler/icons-react";
import { Icon } from '@iconify/react';
import edit from '@iconify-icons/tabler/edit';
import trash from '@iconify-icons/tabler/trash';
import check from '@iconify-icons/tabler/check';
import x from '@iconify-icons/tabler/x';
import calendarEvent from '@iconify-icons/tabler/calendar-event';
import users from '@iconify-icons/tabler/users';
import apiRequest from "./api/apiRequest";
import { useAuth } from "./authContext";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

interface UserProfile {
    accountID: number;
    firstName: string;
    lastName: string;
    email: string;
    bio: string;
    pfp: string | null;
    is_owner: boolean;
    societies: string[];
    events: string[];
    [key: string]: any;
}

const Profile = () => {
    const { accountID: paramID } = useParams<{ accountID: string }>();
    const {
        isAuthenticated,
        isLoading: authLoading,
        loggedAccountID
    } = useAuth();

    // Determine which ID to fetch: URL param or own
    const profileID = paramID
        ? parseInt(paramID, 10)
        : loggedAccountID;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

    const form = useForm<UserProfile>({
        initialValues: {
            accountID: profileID || 0,
            firstName: "",
            lastName: "",
            email: "",
            bio: "",
            pfp: "../../UniHub/media/profile_pics/default.webp",
            is_owner: false,
            societies: [],
            events: []
        }
    });

    // Wait for auth context to settle
    if (authLoading) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Loader size="xl" />
            </Flex>
        );
    }

    // If no param AND not logged in, force login
    if (!paramID && (!isAuthenticated || !loggedAccountID)) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Text>Please log in to view your profile</Text>
            </Flex>
        );
    }

    const fetchUserProfile = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest<UserProfile>({
                endpoint: `/Profile/${profileID}/`,
                method: "GET"
            });

            if (response.error) {
                throw new Error(response.message);
            }

            if (response.data) {
                // Determine ownership
                const isOwner = profileID === loggedAccountID;
                const profileData = {
                    ...response.data,
                    is_owner: isOwner,
                    pfp: response.data.pfp || "../../UniHub/media/profile_pics/default.webp"
                };
                form.setValues(profileData);
                setUser(profileData);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load profile");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, [profileID, loggedAccountID]);

    const handleSubmit = async (values: UserProfile) => {
        setLoading(true);
        setError(null);

        try {
            const { pfp, is_owner, societies, events, ...dataToSend } = values;
            const response = await apiRequest<UserProfile>({
                endpoint: "/Profile/Settings/",
                method: "POST",
                data: dataToSend
            });

            if (response.error) {
                throw new Error(response.message);
            }

            // Refresh after save
            await fetchUserProfile();
            setEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save profile");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        setError(null);

        try {
            await apiRequest({
                endpoint: `/Profile/${profileID}/`,
                method: "DELETE"
            });
            setUser(null);
            setDeleteModalOpen(false);
            form.reset();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete profile");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !user) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Loader size="xl" />
            </Flex>
        );
    }

    return (
        <>
            <Sidebar>
                <Flex justify="center" align="flex-start" gap="md" px="md">
                    <div style={{ width: "200px" }} />

                    <div style={{ flex: 1, maxWidth: "900px" }}>
                        <Flex
                            justify="center"
                            align="center"
                            direction="column"
                            py="xl"
                            px="md"
                        >
                            <Card p="xl" shadow="md" radius="lg" w="100%" maw={450}>
                                <Group justify="space-between" mb="md" wrap="wrap">
                                    <Title order={2}>
                                        {paramID ? "User Profile" : "My Profile"}
                                    </Title>
                                    {!editing && user?.is_owner && (
                                        <Group gap="xs">
                                            <ActionIcon
                                                color="blue"
                                                onClick={() => setEditing(true)}
                                                title="Edit profile"
                                            >
                                                <Icon icon={edit} width={18} height={18} />
                                            </ActionIcon>
                                            <ActionIcon
                                                color="red"
                                                onClick={() => setDeleteModalOpen(true)}
                                                title="Delete profile"
                                            >
                                                <Icon icon={trash} width={18} height={18} />
                                            </ActionIcon>
                                        </Group>
                                    )}
                                </Group>

                                {error && (
                                    <Alert color="red" mb="md">
                                        {error}
                                    </Alert>
                                )}

                                {editing ? (
                                    <form onSubmit={form.onSubmit(handleSubmit)}>
                                        <TextInput
                                            label="First Name"
                                            {...form.getInputProps("firstName")}
                                            mb="sm"
                                            required
                                        />
                                        <TextInput
                                            label="Last Name"
                                            {...form.getInputProps("lastName")}
                                            mb="sm"
                                            required
                                        />
                                        <TextInput
                                            label="Email"
                                            {...form.getInputProps("email")}
                                            mb="sm"
                                            required
                                            disabled={!user?.is_owner}
                                        />
                                        <Textarea
                                            label="Bio"
                                            {...form.getInputProps("bio")}
                                            minRows={4}
                                            mb="sm"
                                        />
                                        <Group justify="flex-end" mt="md" wrap="wrap">
                                            <Button
                                                variant="default"
                                                onClick={() => {
                                                    setEditing(false);
                                                    if (user) form.setValues(user);
                                                }}
                                                leftSection={<Icon icon={x} width={16} height={16} />}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                loading={loading}
                                                leftSection={<Icon icon={check} width={16} height={16} />}
                                            >
                                                Save
                                            </Button>
                                        </Group>
                                    </form>
                                ) : user ? (
                                    <Box>
                                        <Flex justify="center" mb="md">
                                            <Avatar
                                                src={user.pfp}
                                                size={120}
                                                radius="50%"
                                                alt="Profile picture"
                                            />
                                        </Flex>
                                        <Flex justify="center" gap="md" wrap="wrap">
                                            <Text fw={500}>{user.firstName}</Text>
                                            <Text fw={500}>{user.lastName}</Text>
                                        </Flex>
                                        <Flex justify="center">
                                            <Text mt="xs">{user.email}</Text>
                                        </Flex>
                                        <Flex justify="center">
                                            <Text mt="xs">
                                                <strong>ID:</strong> {user.accountID}
                                            </Text>
                                        </Flex>
                                        <Box
                                            mt="sm"
                                            p="sm"
                                            bg="dark.6"
                                            style={{
                                                borderRadius: "8px",
                                                minHeight: "80px",
                                                whiteSpace: "pre-wrap",
                                                wordBreak: "break-word"
                                            }}
                                        >
                                            <Text size="sm" c="dimmed">
                                                {user.bio || "No bio provided."}
                                            </Text>
                                        </Box>

                                        {user.is_owner && (
                                            <>
                                                <Box mt="md">
                                                    <Flex align="center" gap="sm" mb="xs">
                                                        <Icon icon={users} width={18} height={18} />
                                                        <Text fw={500}>Societies:</Text>
                                                    </Flex>
                                                    {user.societies.length > 0 ? (
                                                        <Group gap="sm" wrap="wrap">
                                                            {user.societies.map((item: string) => (
                                                                <Badge key={item} variant="light">
                                                                    {item}
                                                                </Badge>
                                                            ))}
                                                        </Group>
                                                    ) : (
                                                        <Text fs="italic" c="dimmed">
                                                            No societies
                                                        </Text>
                                                    )}
                                                </Box>
                                                <Box mt="md">
                                                    <Flex align="center" gap="sm" mb="xs">
                                                        <Icon icon={calendarEvent} width={18} height={18} />
                                                        <Text fw={500}>Events:</Text>
                                                    </Flex>
                                                    {user.events.length > 0 ? (
                                                        <Group gap="sm" wrap="wrap">
                                                            {user.events.map((item: string) => (
                                                                <Badge key={item} variant="light">
                                                                    {item}
                                                                </Badge>
                                                            ))}
                                                        </Group>
                                                    ) : (
                                                        <Text fs="italic" c="dimmed">
                                                            No events
                                                        </Text>
                                                    )}
                                                </Box>
                                            </>
                                        )}
                                    </Box>
                                ) : (
                                    <Box>
                                        <Text mb="md">No profile found.</Text>
                                    </Box>
                                )}
                            </Card>

                            {/* Delete Confirmation */}
                            {user?.is_owner && (
                                <Modal
                                    opened={deleteModalOpen}
                                    onClose={() => setDeleteModalOpen(false)}
                                    title="Delete Profile"
                                    centered
                                >
                                    <Text>
                                        Are you sure you want to delete your profile? This
                                        action cannot be undone.
                                    </Text>
                                    <Group mt="xl" justify="flex-end">
                                        <Button
                                            variant="default"
                                            onClick={() => setDeleteModalOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            color="red"
                                            onClick={handleDelete}
                                            loading={loading}
                                        >
                                            Delete
                                        </Button>
                                    </Group>
                                </Modal>
                            )}
                        </Flex>
                    </div>

                    <div style={{ width: "200px" }} />
                </Flex>
            </Sidebar>
            <RightSidebar />
        </>
    );
};

export default Profile;
