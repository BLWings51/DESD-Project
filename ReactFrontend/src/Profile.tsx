import { useEffect, useState } from "react";
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
import { IconEdit, IconTrash, IconCheck, IconX, IconCalendarEvent, IconUsers } from "@tabler/icons-react";
import apiRequest from "./api/apiRequest";
import { useAuth } from './authContext';

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
    const { isAuthenticated, isLoading: authLoading, loggedAccountID } = useAuth();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

    const form = useForm<UserProfile>({
        initialValues: {
            accountID: 0,
            firstName: '',
            lastName: '',
            email: '',
            bio: '',
            pfp: '../../UniHub/media/profile_pics/default.webp',
            is_owner: false,
            societies: [],
            events: []
        },
    });

    // Add loading state for auth
    if (authLoading) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Loader size="xl" />
            </Flex>
        );
    }

    // Redirect or show message if not authenticated
    if (!isAuthenticated || !loggedAccountID) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Text>Please log in to view your profile</Text>
            </Flex>
        );
    }

    const fetchUserProfile = async () => {
        setLoading(true);
        try {
            const response = await apiRequest<UserProfile>({
                endpoint: `/Profile/${loggedAccountID}/`,
                method: "GET",
            });

            if (response.error) {
                throw new Error(response.message);
            }

            if (response.data) {
                const profileData = {
                    ...response.data,
                    pfp: response.data.pfp || '../../UniHub/media/profile_pics/default.webp'
                };
                form.setValues(profileData);
                setUser(profileData);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, [loggedAccountID]);

    const handleSubmit = async (values: UserProfile) => {
        if (!loggedAccountID) {
            setError("No account ID available");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { pfp, is_owner, societies, events, ...dataToSend } = values;
            const response = await apiRequest<UserProfile>({
                endpoint: "/Profile/Settings/",
                method: "POST",
                data: dataToSend,
            });

            if (response.error) {
                throw new Error(response.message);
            }

            setUser(response.data || null);
            setEditing(false);
            await fetchUserProfile();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save profile");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!loggedAccountID) {
            setError("No account ID available");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest({
                endpoint: `/profile/${loggedAccountID}/`,
                method: "DELETE",
            });

            if (response.error) {
                throw new Error(response.message);
            }

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

    // Fields to always show
    const publicFields = ['firstName', 'lastName', 'bio'];

    // Fields to show only to owner
    const privateFields = ['email', 'accountID', 'societies', 'events'];

    return (
        <Flex justify="center" align="center" direction="column" py="xl">
            <Card p={30} shadow="md" radius="lg" w={400}>
                <Group justify="space-between" mb="md">
                    <Title order={2}>Profile</Title>
                    {!editing && user?.is_owner && (
                        <Group gap="xs">
                            <ActionIcon
                                color="blue"
                                onClick={() => setEditing(true)}
                                title="Edit profile"
                            >
                                <IconEdit size={18} />
                            </ActionIcon>
                            <ActionIcon
                                color="red"
                                onClick={() => setDeleteModalOpen(true)}
                                title="Delete profile"
                            >
                                <IconTrash size={18} />
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
                            placeholder="Your name"
                            {...form.getInputProps('firstName')}
                            mb="sm"
                            required
                        />

                        <TextInput
                            label="Last Name"
                            placeholder="Your name"
                            {...form.getInputProps('lastName')}
                            mb="sm"
                            required
                        />

                        <TextInput
                            label="Email"
                            placeholder="your@email.com"
                            {...form.getInputProps('email')}
                            mb="sm"
                            required
                            disabled={!user?.is_owner}
                        />

                        <Textarea
                            label="Bio"
                            placeholder="Tell us about yourself"
                            {...form.getInputProps('bio')}
                            minRows={4}
                            mb="sm"
                        />

                        <Group justify="flex-end">
                            <Button
                                variant="default"
                                onClick={() => {
                                    setEditing(false);
                                    if (user) form.setValues(user);
                                }}
                                leftSection={<IconX size={16} />}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={loading}
                                leftSection={<IconCheck size={16} />}
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

                        {/* Always show public fields */}
                        {publicFields.map((key) => (
                            <Text key={key} mt="xs">
                                <strong>{key}:</strong> {user[key] || 'Not specified'}
                            </Text>
                        ))}

                        {/* Show private fields only to owner */}
                        {user.is_owner && (
                            <>
                                {privateFields.map((key) => {
                                    if (key === 'societies' || key === 'events') {
                                        return (
                                            <Box key={key} mt="md">
                                                <Flex align="center" gap="sm" mb="xs">
                                                    {key === 'societies' ? (
                                                        <IconUsers size={18} />
                                                    ) : (
                                                        <IconCalendarEvent size={18} />
                                                    )}
                                                    <Text fw={500}>{key}:</Text>
                                                </Flex>
                                                {user[key].length > 0 ? (
                                                    <Group gap="sm">
                                                        {user[key].map((item: string) => (
                                                            <Badge key={item} variant="light">
                                                                {item}
                                                            </Badge>
                                                        ))}
                                                    </Group>
                                                ) : (
                                                    <Text fs="italic" c="dimmed">No {key}</Text>
                                                )}
                                            </Box>
                                        );
                                    }
                                    return (
                                        <Text key={key} mt="xs">
                                            <strong>{key}:</strong> {user[key]}
                                        </Text>
                                    );
                                })}
                            </>
                        )}
                    </Box>
                ) : (
                    <Box>
                        <Text mb="md">No profile found.</Text>
                        {user && (user as UserProfile).is_owner && (
                            <Button onClick={() => setEditing(true)}>
                                Create Profile
                            </Button>
                        )}
                    </Box>
                )}
            </Card>

            {user?.is_owner && (
                <Modal
                    opened={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    title="Delete Profile"
                    centered
                >
                    <Text>Are you sure you want to delete your profile? This action cannot be undone.</Text>
                    <Group mt="xl" justify="flex-end">
                        <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
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
    );
};

export default Profile;