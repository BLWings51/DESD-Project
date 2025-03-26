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
import CustomNavbar from "./Navbar";

interface UserProfile {
    id?: string;
    name?: string;
    email?: string;
    bio?: string;
    isAdmin?: boolean;
    isActive?: boolean;
    isStaff?: boolean;
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
            name: '',
            email: '',
            bio: '',
            isAdmin: false,
            isStaff: false,
        },
    });

    // Fetch user profile
    const fetchUserProfile = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest<UserProfile>({
                endpoint: "/profile/",
                method: "GET",
            });

            if (response.error) {
                throw new Error(response.message);
            }

            setUser(response.data || null);
            if (response.data) {
                form.setValues(response.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load profile");

            // Simulated data for demo purposes
            const demoData = {
                id: "123",
                name: "Luqmaan",
                email: "luqmaan@example.com",
                bio: `Part 7 is peak fiction!\n\n"I will devour that light and be the villain if I have to!!!"\n\nOUSEN IS THAT GUY!!!!!!`,
                isAdmin: false,
                isStaff: false,
            };
            setUser(demoData);
            form.setValues(demoData);
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
            const method = user?.id ? "PUT" : "POST";
            const endpoint = user?.id ? `/profile/${user.id}` : "/profile/";

            const response = await apiRequest<UserProfile>({
                endpoint,
                method,
                data: values,
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
                <CustomNavbar />
                <Flex justify="center" align="center" h="100vh">
                    <Loader size="xl" mt="xl" />
                </Flex>
            </>
        );
    }

    return (
        <>
            <CustomNavbar />
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
                                label="Name"
                                placeholder="Your name"
                                {...form.getInputProps('name')}
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

                            <Switch
                                label="Admin status"
                                {...form.getInputProps('isAdmin', { type: 'checkbox' })}
                                mb="sm"
                            />

                            <Switch
                                label="Staff status"
                                {...form.getInputProps('isStaff', { type: 'checkbox' })}
                                mb="md"
                            />

                            <Group justify="flex-end">
                                <Button
                                    variant="default"
                                    onClick={() => {
                                        setEditing(false);
                                        form.reset();
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
                            {Object.entries(user).map(([key, value]) => {
                                // Skip id field from display
                                if (key === 'id') return null;

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