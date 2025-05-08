// Profile.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card, Title, Text, Loader, Flex, Alert, TextInput, Textarea,
    Button, Modal, Group, ActionIcon, Box, Badge, Avatar, SimpleGrid
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Icon } from "@iconify/react";
import type { IconifyIcon } from '@iconify/types';
import edit from "@iconify-icons/tabler/edit";
import trash from "@iconify-icons/tabler/trash";
import check from "@iconify-icons/tabler/check";
import x from "@iconify-icons/tabler/x";
import calendarEvent from "@iconify-icons/tabler/calendar-event";
import usersIcon from "@iconify-icons/tabler/users";
import userIcon from "@iconify-icons/tabler/user";
import apiRequest from "./api/apiRequest";
import { useAuth } from "./authContext";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

/* ---------- data model ---------- */
interface InterestTag {
    id: number;
    name: string;
}

interface Event {
    id: number;
    title: string;
    description: string;
    date: string;
    location: string;
}

interface UserProfile {
    accountID: number;
    firstName: string;
    lastName: string;
    email: string;
    bio: string;
    pfp: string;
    is_owner: boolean;
    is_admin: boolean;
    is_friend: boolean;
    address: string;
    dob: string;
    course: string;
    year_of_course: number;
    interests: InterestTag[];
    societies: string[];
    events: Event[];
}

/* ---------- component ---------- */
const Profile = () => {
    const { accountID: paramID } = useParams<{ accountID: string }>();

    /* auth context */
    const { isAuthenticated, isLoading: authLoading, loggedAccountID } = useAuth();

    /* stable states */
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [verifiedAccountID, setVerifiedAccountID] = useState<string | null>(null);
    const [outgoingRequests, setOutgoingRequests] = useState<number[]>([]);

    /* compute whose profile to show */
    const profileID =
        paramID && !isNaN(+paramID)
            ? +paramID
            : verifiedAccountID
                ? +verifiedAccountID
                : null;

    /* form */
    const form = useForm<UserProfile>({
        initialValues: {
            accountID: profileID ?? 0,
            firstName: "",
            lastName: "",
            email: "",
            bio: "",
            pfp: "http://127.0.0.1:8000/media/profile_pics/default.webp",
            is_owner: false,
            is_admin: false,
            is_friend: false,
            address: "",
            dob: "",
            course: "",
            year_of_course: 0,
            interests: [],
            societies: [],
            events: [],
        },
        validate: {
            firstName: (v) => (v ? null : "First name is required"),
            lastName: (v) => (v ? null : "Last name is required"),
            email: (v) => (/^\S+@\S+$/.test(v) ? null : "Must be a valid email"),
        },
    });

    /* ---------- side-effects ---------- */

    /* verify auth → get own accountID */
    useEffect(() => {
        if (!isAuthenticated) return;
        apiRequest<{ authenticated: boolean; accountID: string }>({
            endpoint: "/authenticated/",
            method: "POST",
        })
            .then(r => r.data?.authenticated && setVerifiedAccountID(r.data.accountID))
            .catch(() => setError("Failed to verify authentication"));
    }, [isAuthenticated]);

    /* admin check */
    useEffect(() => {
        if (!isAuthenticated) return;
        apiRequest<{ admin: boolean }>({ endpoint: "/admin_check/", method: "POST" })
            .then(r => setIsAdmin(r.data?.admin ?? false))
            .catch(() => console.error("Admin check failed"));
    }, [isAuthenticated]);

    /* fetch profile */
    const fetchProfile = async () => {
        if (!profileID) return;
        setLoading(true); setError(null);
        try {
            const r = await apiRequest<UserProfile>({
                endpoint: `/Profile/${profileID}/`,
                method: "GET",
            });
            if (r.error) throw new Error(r.message);
            const data = r.data!;
            const owner = loggedAccountID ? +loggedAccountID === data.accountID : false;
            const pfp = data.pfp || form.values.pfp;
            const profile: UserProfile = { ...data, is_owner: owner, pfp };
            setUser(profile);
            form.setValues(profile);
        } catch (e: any) {
            setError(e.message);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, [profileID, loggedAccountID]);

    useEffect(() => {
        const fetchOutgoingRequests = async () => {
            const res = await apiRequest<{ accountID: number }[]>({ endpoint: "/friends/outgoing/" });
            if (!res.error) {
                setOutgoingRequests(res.data?.map(u => u.accountID) || []);
            }
        };
        if (isAuthenticated) {
            fetchOutgoingRequests();
        }
    }, [isAuthenticated]);

    /* ---------- action handlers ---------- */

    /* save edits */
    const handleSave = async (values: UserProfile) => {
        setLoading(true); setError(null);
        try {
            const { pfp, is_owner, societies, events, ...payload } = values;
            await apiRequest({
                endpoint: "/Profile/Settings/",
                method: "POST",
                data: { ...payload, accountID: profileID },
            });
            setEditing(false);
            await fetchProfile();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    /* delete profile */
    const handleDelete = async () => {
        setLoading(true); setError(null);
        try {
            const ep = isAdmin && paramID
                ? `/Profile/${paramID}/delete/`
                : "/Profile/delete/";
            await apiRequest({ endpoint: ep, method: "DELETE" });
            window.location.href = "/";
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    /* upload picture */
    const handleUploadPfp = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.currentTarget.files?.[0];
        if (!file) return;
        setLoading(true); setError(null);
        try {
            const fd = new FormData(); fd.append("pfp", file);
            const r = await apiRequest<{ pfp: string }>({
                endpoint: `/Profile/${profileID}/uploadpfp/`,
                method: "PATCH",
                data: fd,
            });
            const pfpUrl = r.data?.pfp;
            if (pfpUrl) {
                form.setFieldValue("pfp", pfpUrl);
                setUser(u => u && { ...u, pfp: pfpUrl });
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    /* friendship */
    const handleAddFriend = async () => {
        setLoading(true); setError(null);
        try {
            await apiRequest({ endpoint: `/friends/send/${profileID}/`, method: "POST" });
            if (profileID) {
                setOutgoingRequests(prev => [...prev, profileID]);
            }
            await fetchProfile();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFriend = async () => {
        setLoading(true); setError(null);
        try {
            await apiRequest({ endpoint: `/friends/remove/${profileID}/`, method: "POST" });
            await fetchProfile();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    /* ---------- early returns ---------- */
    if (authLoading || (loading && !user)) {
        return <Flex justify="center" align="center" h="100vh"><Loader size="xl" /></Flex>;
    }
    if (!paramID && (!isAuthenticated || !verifiedAccountID)) {
        return <Flex justify="center" align="center" h="100vh"><Text>Please log in to view your profile</Text></Flex>;
    }
    if (!profileID) {
        return <Flex justify="center" align="center" h="100vh"><Text>Unable to determine which profile to view.</Text></Flex>;
    }

    /* ---------- render ---------- */
    return (
        <>
            <Sidebar>
                <Flex justify="center" align="flex-start" gap="md" px="md">
                    <div style={{ width: 200 }} />
                    <div style={{ flex: 1, maxWidth: 900 }}>
                        <Flex justify="center" align="center" direction="column" py="xl" px="md">
                            <Card p="xl" shadow="md" radius="lg" w="100%" maw={450}>

                                {/* header */}
                                <Group justify="space-between" mb="md" wrap="wrap">
                                    <Title order={2}>{paramID ? "User Profile" : "My Profile"}</Title>
                                    <Group gap="xs">
                                        {!user?.is_owner && (
                                            <>
                                                {user?.is_friend ? (
                                                    <Button 
                                                        color="red" 
                                                        variant="filled" 
                                                        onClick={handleRemoveFriend}
                                                        leftSection={<Icon icon={trash} width={16} height={16} />}
                                                    >
                                                        Unfriend
                                                    </Button>
                                                ) : outgoingRequests.includes(user?.accountID || 0) ? (
                                                    <Button 
                                                        variant="outline" 
                                                        color="gray" 
                                                        disabled
                                                    >
                                                        Request Sent
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        onClick={handleAddFriend}
                                                        leftSection={<Icon icon={userIcon} width={16} height={16} />}
                                                    >
                                                        Add Friend
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                        {!editing && (user?.is_owner || isAdmin) && (
                                            <>
                                                <ActionIcon color="blue" onClick={() => setEditing(true)} title="Edit profile"><Icon icon={edit} width={18} height={18} /></ActionIcon>
                                                <ActionIcon color="red" onClick={() => setDeleteModalOpen(true)} title="Delete profile"><Icon icon={trash} width={18} height={18} /></ActionIcon>
                                            </>
                                        )}
                                    </Group>
                                </Group>

                                {error && <Alert color="red" mb="md">{error}</Alert>}

                                {/* ------------ EDIT MODE ------------ */}
                                {editing ? (
                                    <form onSubmit={form.onSubmit(handleSave)}>
                                        <Flex justify="center" mb="md">
                                            <Avatar src={form.values.pfp} size={120} radius="50%" />
                                        </Flex>
                                        <TextInput type="file" accept="image/*" label="Profile Picture" onChange={handleUploadPfp} mb="sm" />
                                        <TextInput label="First Name" {...form.getInputProps("firstName")} mb="sm" required />
                                        <TextInput label="Last Name"  {...form.getInputProps("lastName")} mb="sm" required />
                                        <TextInput label="Email" {...form.getInputProps("email")} mb="sm" required disabled={!user?.is_owner && !isAdmin} />
                                        <Textarea label="Bio"   {...form.getInputProps("bio")} minRows={4} mb="sm" />

                                        {(user?.is_owner || isAdmin) && (
                                            <>
                                                <TextInput label="Address"        {...form.getInputProps("address")} mb="sm" />
                                                <TextInput label="Date of Birth" type="date"  {...form.getInputProps("dob")} mb="sm" />
                                                <TextInput label="Course"         {...form.getInputProps("course")} mb="sm" />
                                                <TextInput label="Year of Course" type="number" {...form.getInputProps("year_of_course")} mb="sm" />
                                            </>
                                        )}

                                        <Group justify="flex-end" mt="md" wrap="wrap">
                                            <Button variant="default" onClick={() => { setEditing(false); user && form.setValues(user); }} leftSection={<Icon icon={x} width={16} height={16} />}>Cancel</Button>
                                            <Button type="submit" loading={loading} leftSection={<Icon icon={check} width={16} height={16} />}>Save</Button>
                                        </Group>
                                    </form>
                                ) : /* ------------ VIEW MODE ------------ */ user ? (
                                    <Box>
                                        <Flex justify="center" mb="md"><Avatar src={user.pfp} size={120} radius="50%" /></Flex>
                                        <Flex justify="center" gap="md" wrap="wrap">
                                            <Text fw={500}>{user.firstName}</Text>
                                            <Text fw={500}>{user.lastName}</Text>
                                        </Flex>
                                        <Flex justify="center"><Text mt="xs">{user.email}</Text></Flex>
                                        <Flex justify="center"><Text mt="xs"><strong>ID:</strong> {user.accountID}</Text></Flex>
                                        <Box mt="sm" p="sm" bg="dark.6"><Text size="sm" c="dimmed">{user.bio || "No bio provided."}</Text></Box>

                                        <Box mt="md">
                                            <Title order={4} mb="sm">Additional Information</Title>
                                            <SimpleGrid cols={2} spacing="md">
                                                {user.address && <Info label="Address" value={user.address} />}
                                                {user.dob && <Info label="Date of Birth" value={new Date(user.dob).toLocaleDateString()} />}
                                                {user.course && <Info label="Course" value={user.course} />}
                                                {user.year_of_course && <Info label="Year of Course" value={user.year_of_course} />}
                                            </SimpleGrid>
                                        </Box>

                                        {user.is_owner && (
                                            <>
                                                <ListBlock icon={usersIcon} label="Societies" data={user.societies} />
                                                <ListBlock icon={calendarEvent} label="Events" data={user.events.map(e => (e as any).name ?? e)} />
                                            </>
                                        )}
                                    </Box>
                                ) : (
                                    <Box><Text mb="md">No profile found.</Text></Box>
                                )}
                            </Card>

                            {/* delete modal */}
                            {(user?.is_owner || isAdmin) && (
                                <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Profile" centered>
                                    <Text>
                                        {isAdmin && !user?.is_owner
                                            ? "Are you sure you want to delete this user's profile? This action cannot be undone."
                                            : "Are you sure you want to delete your profile? This action cannot be undone."}
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

/* ---------- small helpers ---------- */
const Info = ({ label, value }: { label: string; value: string | number }) => (
    <Box>
        <Text fw={500} size="sm">{label}:</Text>
        <Text size="sm">{value}</Text>
    </Box>
);

const ListBlock = ({ icon, label, data }: { icon: any; label: string; data: string[] }) => (
    <Box mt="md">
        <Flex align="center" gap="sm" mb="xs">
            <Icon icon={icon} width={18} height={18} />
            <Text fw={500}>{label}:</Text>
        </Flex>
        {data.length ? (
            <Group gap="sm" wrap="wrap">
                {data.map(item => <Badge key={item} variant="light">{item}</Badge>)}
            </Group>
        ) : (
            <Text fs="italic" c="dimmed">No {label.toLowerCase()}</Text>
        )}
    </Box>
);

export default Profile;
