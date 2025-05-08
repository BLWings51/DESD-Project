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
    Avatar,
    SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Icon } from "@iconify/react";
import edit from "@iconify-icons/tabler/edit";
import trash from "@iconify-icons/tabler/trash";
import check from "@iconify-icons/tabler/check";
import x from "@iconify-icons/tabler/x";
import calendarEvent from "@iconify-icons/tabler/calendar-event";
import users from "@iconify-icons/tabler/users";
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
    pfp: string;
    is_owner: boolean;
    societies: string[];
    events: string[];
    address?: string;
    dob?: string;
    course?: string;
    year_of_course?: string;
    interests?: string[];
}

const Profile = () => {
    const { accountID: paramID } = useParams<{ accountID: string }>();
    const {
        isAuthenticated,
        isLoading: authLoading,
        loggedAccountID,
    } = useAuth();

    // — All hooks must run unconditionally
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [verifiedAccountID, setVerifiedAccountID] = useState<string | null>(null);

    const profileID =
        paramID && !isNaN(+paramID)
            ? +paramID
            : verifiedAccountID
                ? +verifiedAccountID
                : null;

    const form = useForm<UserProfile>({
        initialValues: {
            accountID: profileID ?? 0,
            firstName: "",
            lastName: "",
            email: "",
            bio: "",
            pfp: "http://127.0.0.1:8000/media/profile_pics/default.webp",
            is_owner: false,
            societies: [],
            events: [],
        },
        validate: {
            firstName: (v) => (v ? null : "First name is required"),
            lastName: (v) => (v ? null : "Last name is required"),
            email: (v) =>
                /^\S+@\S+$/.test(v) ? null : "Must be a valid email address",
        },
    });

    // verify auth and get verifiedAccountID
    useEffect(() => {
        if (!isAuthenticated) return;
        apiRequest<{ authenticated: boolean; accountID: string }>({
            endpoint: "/authenticated/",
            method: "POST",
        })
            .then((res) => {
                if (res.data?.authenticated) {
                    setVerifiedAccountID(res.data.accountID);
                }
            })
            .catch(() => setError("Failed to verify authentication"));
    }, [isAuthenticated]);

    // check admin status
    useEffect(() => {
        if (!isAuthenticated) return;
        apiRequest<{ admin: boolean }>({
            endpoint: "/admin_check/",
            method: "POST",
        })
            .then((res) => setIsAdmin(res.data?.admin ?? false))
            .catch(() => console.error("Admin check failed"));
    }, [isAuthenticated]);

    // fetch profile data
    useEffect(() => {
        if (!profileID) return;
        setLoading(true);
        apiRequest<UserProfile>({
            endpoint: `/Profile/${profileID}/`,
            method: "GET",
        })
            .then((res) => {
                if (res.error) throw new Error(res.message);
                const data = res.data!;
                const is_owner = loggedAccountID ? +loggedAccountID === data.accountID : false;
                const pfpUrl = data.pfp || form.values.pfp;
                const profileData = { ...data, is_owner, pfp: pfpUrl };
                setUser(profileData);
                form.setValues(profileData);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [profileID, loggedAccountID]);

    // now that all hooks have run, handle loading/auth early returns
    if (authLoading) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Loader size="xl" />
            </Flex>
        );
    }

    if (!paramID && (!isAuthenticated || !verifiedAccountID)) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Text>Please log in to view your profile</Text>
            </Flex>
        );
    }

    if (!profileID) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Text>Unable to determine which profile to view.</Text>
            </Flex>
        );
    }

    // form submit handler
    const handleSubmit = async (values: UserProfile) => {
        setLoading(true);
        setError(null);
        try {
            const { pfp, is_owner, societies, events, ...payload } = values;
            await apiRequest({
                endpoint: "/Profile/Settings/",
                method: "POST",
                data: { ...payload, accountID: profileID },
            });
            setEditing(false);
            // refresh
            setUser((u) => u && { ...u, ...payload });
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // delete handler
    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            const ep = isAdmin && paramID
                ? `/Profile/${paramID}/delete/`
                : "/Profile/delete/";
            await apiRequest({ endpoint: ep, method: "DELETE" });
            // after delete, you might redirect:
            window.location.href = "/";
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // picture upload
    const handleProfilePictureUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.currentTarget.files?.[0];
        if (!file) return;
        setLoading(true);
        setError(null);
        const fd = new FormData();
        fd.append("pfp", file);
        try {
            const res = await apiRequest<{ pfp: string }>({
                endpoint: `/Profile/${profileID}/uploadpfp/`,
                method: "PATCH",
                data: fd,
            });
            const pfpUrl = res.data?.pfp;
            if (pfpUrl) {
                form.setFieldValue("pfp", pfpUrl);
                setUser((u) => u && { ...u, pfp: pfpUrl });
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Sidebar>
                <Flex justify="center" align="flex-start" gap="md" px="md">
                    <div style={{ width: 200 }} />
                    <div style={{ flex: 1, maxWidth: 900 }}>
                        <Flex justify="center" align="center" direction="column" py="xl" px="md">
                            <Card p="xl" shadow="md" radius="lg" w="100%" maw={450}>
                                <Group justify="space-between" mb="md" wrap="wrap">
                                    <Title order={2}>{paramID ? "User Profile" : "My Profile"}</Title>
                                    {!editing && (user?.is_owner || isAdmin) && (
                                        <Group gap="xs">
                                            <ActionIcon color="blue" onClick={() => setEditing(true)} title="Edit profile">
                                                <Icon icon={edit} width={18} height={18} />
                                            </ActionIcon>
                                            <ActionIcon color="red" onClick={() => setDeleteModalOpen(true)} title="Delete profile">
                                                <Icon icon={trash} width={18} height={18} />
                                            </ActionIcon>
                                        </Group>
                                    )}
                                </Group>

                                {error && <Alert color="red" mb="md">{error}</Alert>}

                                {editing ? (
                                    <form onSubmit={form.onSubmit(handleSubmit)}>
                                        <Flex justify="center" mb="md">
                                            <Avatar src={form.values.pfp} size={120} radius="50%" alt="Profile picture" />
                                        </Flex>
                                        <TextInput type="file" accept="image/*" label="Profile Picture" onChange={handleProfilePictureUpload} mb="sm" />
                                        <TextInput label="First Name" {...form.getInputProps("firstName")} mb="sm" required />
                                        <TextInput label="Last Name" {...form.getInputProps("lastName")} mb="sm" required />
                                        <TextInput label="Email" {...form.getInputProps("email")} mb="sm" required disabled={!user?.is_owner && !isAdmin} />
                                        <Textarea label="Bio" {...form.getInputProps("bio")} minRows={4} mb="sm" />
                                        {(user?.is_owner || isAdmin) && (
                                            <>
                                                <TextInput label="Address" {...form.getInputProps("address")} mb="sm" />
                                                <TextInput label="Date of Birth" type="date" {...form.getInputProps("dob")} mb="sm" />
                                                <TextInput label="Course" {...form.getInputProps("course")} mb="sm" />
                                                <TextInput
                                                    label="Year of Course"
                                                    type="number"
                                                    {...form.getInputProps("year_of_course")}
                                                    mb="sm"
                                                />
                                            </>
                                        )}
                                        <Group justify="flex-end" mt="md" wrap="wrap">
                                            <Button variant="default" onClick={() => { setEditing(false); user && form.setValues(user); }} leftSection={<Icon icon={x} width={16} height={16} />}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" loading={loading} leftSection={<Icon icon={check} width={16} height={16} />}>
                                                Save
                                            </Button>
                                        </Group>
                                    </form>
                                ) : user ? (
                                    <Box>
                                        <Flex justify="center" mb="md">
                                            <Avatar src={user.pfp} size={120} radius="50%" alt="Profile picture" />
                                        </Flex>
                                        <Flex justify="center" gap="md" wrap="wrap">
                                            <Text fw={500}>{user.firstName}</Text>
                                            <Text fw={500}>{user.lastName}</Text>
                                        </Flex>
                                        <Flex justify="center"><Text mt="xs">{user.email}</Text></Flex>
                                        <Flex justify="center"><Text mt="xs"><strong>ID:</strong> {user.accountID}</Text></Flex>
                                        <Box mt="sm" p="sm" bg="dark.6">
                                            <Text size="sm" c="dimmed">{user.bio || "No bio provided."}</Text>
                                        </Box>

                                        {(user.is_owner || isAdmin) && (
                                            <Box mt="md">
                                                <Title order={4} mb="sm">Additional Information</Title>
                                                <SimpleGrid cols={2} spacing="md">
                                                    {user.address && (
                                                        <Box>
                                                            <Text fw={500} size="sm">Address:</Text>
                                                            <Text size="sm">{user.address}</Text>
                                                        </Box>
                                                    )}
                                                    {user.dob && (
                                                        <Box>
                                                            <Text fw={500} size="sm">Date of Birth:</Text>
                                                            <Text size="sm">{new Date(user.dob).toLocaleDateString()}</Text>
                                                        </Box>
                                                    )}
                                                    {user.course && (
                                                        <Box>
                                                            <Text fw={500} size="sm">Course:</Text>
                                                            <Text size="sm">{user.course}</Text>
                                                        </Box>
                                                    )}
                                                    {user.year_of_course && (
                                                        <Box>
                                                            <Text fw={500} size="sm">Year of Course:</Text>
                                                            <Text size="sm">{user.year_of_course}</Text>
                                                        </Box>
                                                    )}
                                                </SimpleGrid>
                                            </Box>
                                        )}

                                        {user.is_owner && (
                                            <>
                                                <Box mt="md">
                                                    <Flex align="center" gap="sm" mb="xs">
                                                        <Icon icon={users} width={18} height={18} />
                                                        <Text fw={500}>Societies:</Text>
                                                    </Flex>
                                                    {user.societies.length > 0 ? (
                                                        <Group gap="sm" wrap="wrap">
                                                            {user.societies.map((item) => (
                                                                <Badge key={item} variant="light">{item}</Badge>
                                                            ))}
                                                        </Group>
                                                    ) : (
                                                        <Text fs="italic" c="dimmed">No societies</Text>
                                                    )}
                                                </Box>
                                                <Box mt="md">
                                                    <Flex align="center" gap="sm" mb="xs">
                                                        <Icon icon={calendarEvent} width={18} height={18} />
                                                        <Text fw={500}>Events:</Text>
                                                    </Flex>
                                                    {user.events.length > 0 ? (
                                                        <Group gap="sm" wrap="wrap">
                                                            {user.events.map((item: any) => (
                                                                <Badge key={item.name} variant="light">{item.name}</Badge>
                                                            ))}
                                                        </Group>
                                                    ) : (
                                                        <Text fs="italic" c="dimmed">No events</Text>
                                                    )}
                                                </Box>
                                            </>
                                        )}
                                    </Box>
                                ) : (
                                    <Box><Text mb="md">No profile found.</Text></Box>
                                )}
                            </Card>

                            {(user?.is_owner || isAdmin) && (
                                <Modal
                                    opened={deleteModalOpen}
                                    onClose={() => setDeleteModalOpen(false)}
                                    title="Delete Profile"
                                    centered
                                >
                                    <Text>
                                        {isAdmin && !user?.is_owner
                                            ? "Are you sure you want to delete this user's profile? This action cannot be undone."
                                            : "Are you sure you want to delete your profile? This action cannot be undone."
                                        }
                                    </Text>
                                    <Group mt="xl" justify="flex-end">
                                        <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                                        <Button color="red" onClick={handleDelete} loading={loading}>Delete</Button>
                                    </Group>
                                </Modal>
                            )}
                        </Flex>
                    </div>
                    <div style={{ width: 200 }} />
                </Flex>
            </Sidebar>
            <RightSidebar />
        </>
    );
};

export default Profile;
