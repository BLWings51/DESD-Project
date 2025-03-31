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
    Switch,
    Button,
    Modal,
    Group,
    ActionIcon,
    Box
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconEdit, IconTrash, IconCheck, IconX } from "@tabler/icons-react";
import apiRequest from "./api/apiRequest";

interface UserProfile {
    id?: string;
    name?: string;
    email?: string;
    bio?: string;
    isAdmin?: boolean;
    isActive?: boolean;
    isStaff?: boolean;
    pfp?: string;  // Add this
    [key: string]: any;
}

const Profile = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

    // In your form initialization:
    const form = useForm<UserProfile>({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            bio: '',
            pfp: '../../UniHub/media/profile_pics/default.webp', // Set default here
        },
    })

    // Fetch user profile
    const fetchUserProfile = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest<UserProfile>({
                endpoint: "/Profile/",
                method: "GET",
            });

            if (response.error) {
                throw new Error(response.message);
            }

            if (response.data) {
                if (response.data.pfp === null) response.data.pfp = "../../UniHub/media/profile_pics/default.webp";

                form.setValues(response.data);
            }

            setUser(form.getValues());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Create or Update profile
    const handleSubmit = async (values: UserProfile) => {
        setLoading(true);
        setError(null);

        try {
            const method = "POST";
            const endpoint = "/ProfileSettings/";

            // Destructure to exclude pfp, then use the rest
            const { pfp, ...dataToSend } = values;

            const response = await apiRequest<UserProfile>({
                endpoint,
                method,
                data: dataToSend,
            });

            if (response.error) {
                throw new Error(response.message);
            }

            setUser(response.data || null);
            setEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save profile");
        } finally {
            setLoading(false);
        }
    };

    // Delete profile
    const handleDelete = async () => {
        setLoading(true);
        setError(null);

        try {
            if (!user?.id) {
                throw new Error("No user to delete");
            }

            const response = await apiRequest({
                endpoint: `/profile/${user.id}`,
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
            <>
                <Flex justify="center" align="center" h="100vh">
                    <Loader size="xl" mt="xl" />
                </Flex>
            </>
        );
    }

    return (
        <>
            <Flex justify="center" align="center" direction="column" py="xl">
                <Card p={30} shadow="md" radius="lg" w={400}>
                    <Group justify="space-between" mb="md">
                        <Title order={2}>Profile</Title>
                        {!editing && user ? (
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
                        ) : null}
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
                            />

                            <TextInput
                                label="Last Name"
                                placeholder="Your name"
                                {...form.getInputProps('lastName')}
                                mb="sm"
                            />

                            <TextInput
                                label="Email"
                                placeholder="your@email.com"
                                {...form.getInputProps('email')}
                                mb="sm"
                            />

                            <Textarea
                                label="Bio"
                                placeholder="Tell us about yourself"
                                {...form.getInputProps('bio')}
                                minRows={4}
                                mb="sm"
                            />

                            {/* <Switch
                                label="Admin status"
                                {...form.getInputProps('isAdmin', { type: 'checkbox' })}
                                mb="sm"
                            /> */}

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
                            {/* Add profile picture at the top */}
                            <Flex justify="center" mb="md">
                                <img
                                    src={user.pfp}
                                    alt="Profile"
                                    style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </Flex>

                            {Object.entries(user).map(([key, value]) => {
                                // Skip id and pfp fields from text display (we show pfp separately)
                                if (key === 'id' || key === 'pfp') return null;

                                return (
                                    <Text key={key} mt="xs">
                                        <strong>{key}:</strong> {typeof value === "boolean" ?
                                            (value ? "Yes" : "No") :
                                            value}
                                    </Text>
                                );
                            })}
                        </Box>

                    ) : (
                        <Box>
                            <Text mb="md">No profile found. Would you like to create one?</Text>
                            <Button onClick={() => setEditing(true)}>
                                Create Profile
                            </Button>
                        </Box>
                    )}
                </Card>
            </Flex>

            {/* Delete confirmation modal */}
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
        </>
    );
};

export default Profile;











//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
    Box
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconEdit, IconTrash, IconCheck, IconX } from "@tabler/icons-react";
import apiRequest from "./api/apiRequest";
import { Link } from "react-router-dom";

interface UserProfile {
    id?: string;
    name?: string;
    email?: string;
    bio?: string;
    isAdmin?: boolean;
    isActive?: boolean;
    isStaff?: boolean;
    pfp?: string;
    [key: string]: any;
}

const Profile = () => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);

    const form = useForm<UserProfile>({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            bio: '',
            pfp: '../../UniHub/media/profile_pics/default.webp',
        },
    })

    const fetchUserProfile = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest<UserProfile>({
                endpoint: "/Profile/",
                method: "GET",
            });

            if (response.error) {
                throw new Error(response.message);
            }

            if (response.data) {
                if (response.data.pfp === null) response.data.pfp = "../../UniHub/media/profile_pics/default.webp";
                form.setValues(response.data);
            }

            setUser(form.getValues());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const handleSubmit = async (values: UserProfile) => {
        setLoading(true);
        setError(null);

        try {
            const method = "POST";
            const endpoint = "/ProfileSettings/";

            const { pfp, ...dataToSend } = values;

            const response = await apiRequest<UserProfile>({
                endpoint,
                method,
                data: dataToSend,
            });

            if (response.error) {
                throw new Error(response.message);
            }

            setUser(response.data || null);
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
            if (!user?.id) {
                throw new Error("No user to delete");
            }

            const response = await apiRequest({
                endpoint: `/profile/${user.id}`,
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
                <Loader size="xl" mt="xl" />
            </Flex>
        );
    }

    return (
        <Flex justify={"center"} align={"center"} h={"90vh"} direction={"column"}>
            <Card w={550} p={50} radius={"lg"} style={{ backgroundColor: 'var(--mantine-color-primary-6)' }}>
                <Card.Section style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Title style={{ color: 'var(--mantine-color-secondary-1)', fontSize: "32px" }}>Profile</Title>
                </Card.Section>

                {error && (
                    <Alert color="red" mb="md">
                        {error}
                    </Alert>
                )}

                <Card.Section p="md">
                    {editing ? (
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Flex justify="center" mb="md">
                                <img
                                    src={form.values.pfp}
                                    alt="Profile"
                                    style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </Flex>

                            <TextInput
                                label="First Name"
                                placeholder="Your name"
                                {...form.getInputProps('firstName')}
                                mb="sm"
                                styles={{
                                    input: {
                                        backgroundColor: 'var(--mantine-color-primary-8)',
                                        border: "2px solid rgb(255, 255, 255)",
                                        padding: "16px",
                                        fontSize: "16px",
                                    },
                                }}
                            />

                            <TextInput
                                label="Last Name"
                                placeholder="Your name"
                                {...form.getInputProps('lastName')}
                                mb="sm"
                                styles={{
                                    input: {
                                        backgroundColor: 'var(--mantine-color-primary-8)',
                                        border: "2px solid rgb(255, 255, 255)",
                                        padding: "16px",
                                        fontSize: "16px",
                                    },
                                }}
                            />

                            <TextInput
                                label="Email"
                                placeholder="your@email.com"
                                {...form.getInputProps('email')}
                                mb="sm"
                                styles={{
                                    input: {
                                        backgroundColor: 'var(--mantine-color-primary-8)',
                                        border: "2px solid rgb(255, 255, 255)",
                                        padding: "16px",
                                        fontSize: "16px",
                                    },
                                }}
                            />

                            <Textarea
                                label="Bio"
                                placeholder="Tell us about yourself"
                                {...form.getInputProps('bio')}
                                minRows={4}
                                mb="sm"
                                styles={{
                                    input: {
                                        backgroundColor: 'var(--mantine-color-primary-8)',
                                        border: "2px solid rgb(255, 255, 255)",
                                        padding: "16px",
                                        fontSize: "16px",
                                    },
                                }}
                            />

                            <Group justify="flex-end" mt="xl">
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
                                    color="tertiary.8"
                                >
                                    Save
                                </Button>
                            </Group>
                        </form>
                    ) : user ? (
                        <Box>
                            <Flex justify="center" mb="md">
                                <img
                                    src={user.pfp}
                                    alt="Profile"
                                    style={{
                                        width: 150,
                                        height: 150,
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: "4px solid var(--mantine-color-secondary-1)"
                                    }}
                                />
                            </Flex>

                            {Object.entries(user).map(([key, value]) => {
                                if (key === 'id' || key === 'pfp') return null;
                                return (
                                    <Text key={key} mt="xs" style={{ color: 'white' }}>
                                        <strong style={{ color: 'var(--mantine-color-secondary-1)' }}>
                                            {key.charAt(0).toUpperCase() + key.slice(1)}:
                                        </strong> {typeof value === "boolean" ?
                                            (value ? "Yes" : "No") :
                                            value}
                                    </Text>
                                );
                            })}

                            <Group justify="flex-end" mt="xl">
                                <ActionIcon
                                    color="var(--mantine-color-secondary-1)"
                                    onClick={() => setEditing(true)}
                                    title="Edit profile"
                                    size="lg"
                                >
                                    <IconEdit size={24} />
                                </ActionIcon>
                                <ActionIcon
                                    color="red"
                                    onClick={() => setDeleteModalOpen(true)}
                                    title="Delete profile"
                                    size="lg"
                                >
                                    <IconTrash size={24} />
                                </ActionIcon>
                            </Group>
                        </Box>
                    ) : (
                        <Box>
                            <Text mb="md" style={{ color: 'white' }}>
                                No profile found. Would you like to create one?
                            </Text>
                            <Button 
                                onClick={() => setEditing(true)}
                                color="tertiary.8"
                                fullWidth
                            >
                                Create Profile
                            </Button>
                        </Box>
                    )}
                </Card.Section>
            </Card>

            {/* Delete confirmation modal */}
            <Modal
                opened={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Profile"
                centered
                styles={{
                    title: { color: 'var(--mantine-color-secondary-1)' },
                    content: { backgroundColor: 'var(--mantine-color-primary-6)' }
                }}
            >
                <Text style={{ color: 'white' }}>
                    Are you sure you want to delete your profile? This action cannot be undone.
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
        </Flex>
    );
};

export default Profile;