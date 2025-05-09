// SearchPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import apiRequest, { getMediaUrl } from "./api/apiRequest";
import {
    Container,
    Title,
    Card,
    Text,
    Loader,
    Stack,
    List,
    Anchor,
    Flex,
    Select,
    Checkbox,
    Group,
    Image,
    Badge,
    Button,
    Divider,
    Box,
    TextInput,
    Paper,
} from "@mantine/core";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import TagDropdown from "./components/TagDropdown";
import { Icon } from '@iconify/react';
import messageCircle from '@iconify-icons/tabler/message-circle';
import send from '@iconify-icons/tabler/send';
import chevronDown from '@iconify-icons/tabler/chevron-down';
import chevronUp from '@iconify-icons/tabler/chevron-up';
import { useAuth } from "./authContext";

interface Society {
    id: number;
    name: string;
    description: string;
    numOfInterestedPeople: number;
}
interface EventSocietyName { name: string }
interface Event {
    id: number; name: string; details: string;
    startTime: string; endTime: string; location: string;
    society?: string;
}
interface User {
    accountID: number; firstName: string; lastName: string; email: string;
}
interface Post {
    id: number;
    content: string;
    created_at: string;
    author_name: string;
    society: string;
    visibility: string;
    image?: string;
    comments?: Comment[];
    likes_count: number;
    liked_by_user: boolean;
}
interface Comment {
    id: number;
    content: string;
    created_at: string;
    author_name: string;
}
interface SearchResults {
    societies: Society[]; events: Event[]; users: User[]; posts: Post[];
}
const EMPTY_RESULTS: SearchResults = {
    societies: [], events: [], users: [], posts: [],
};

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();

    /* ---------- filters pulled from URL ---------- */
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "";
    const sort = searchParams.get("sort") || "";
    const order = searchParams.get("order") || "desc";
    const friendsOnly = searchParams.get("friends_only") === "true";
    const selectedTags = searchParams.getAll("tags");

    /* ---------- component state ---------- */
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedPosts, setExpandedPosts] = useState<{ [key: number]: boolean }>({});
    const [newComment, setNewComment] = useState('');
    const [commentingPostId, setCommentingPostId] = useState<number | null>(null);
    const [likedPosts, setLikedPosts] = useState<{ [key: number]: boolean }>({});

    /* ---------- fetch tag suggestions once ---------- */
    useEffect(() => {
        apiRequest<string[]>({ endpoint: "/tags/search/?q=", method: "GET" })
            .then(r => setAvailableTags(r.data || []))
            .catch(() => setAvailableTags([]));
    }, []);

    /* ---------- fetch search results whenever the query string changes ---------- */
    useEffect(() => {
        if (!query) {                       // blank search box ⇒ clear screen
            setResults(EMPTY_RESULTS);
            return;
        }

        setLoading(true);
        setError(null);

        const qs = searchParams.toString();
        apiRequest<SearchResults>({ endpoint: `/search/?${qs}`, method: "GET" })
            .then(async (response) => {
                if (response.error) throw new Error(response.message || "Search failed");

                /* --- always fan-in missing keys to prevent undefined --- */
                // const data = response.data || {};
                const merged: SearchResults = {
                    ...EMPTY_RESULTS,
                    ...(response.data as Partial<SearchResults>),
                };


                /* --- enrich events with their society name, if any --- */
                if (merged.events.length) {
                    merged.events = await Promise.all(
                        merged.events.map(async (evt) => {
                            try {
                                const r = await apiRequest<EventSocietyName>({
                                    endpoint: `/GetSocietyFromEvent/${evt.id}/`,
                                    method: "GET",
                                });
                                return { ...evt, society: r.data?.name };
                            } catch {
                                return evt;
                            }
                        })
                    );
                }

                setResults(merged);             // <-- ALWAYS the merged object
            })
            .catch(err => setError(err.message || "Search failed"))
            .finally(() => setLoading(false));
    }, [searchParams.toString()]);

    /* ---------- URL-driven filter helper ---------- */
    const handleFilterChange = (filter: string, value: string | boolean | string[]) => {
        const params = new URLSearchParams(searchParams.toString());

        switch (filter) {
            case "type":
            case "sort":
            case "order":
                value ? params.set(filter, value as string)
                    : params.delete(filter);
                break;
            case "friends_only":
                value ? params.set("friends_only", "true")
                    : params.delete("friends_only");
                break;
            case "tags":
                params.delete("tags");
                (value as string[]).forEach(tag => params.append("tags", tag));
                break;
        }
        setSearchParams(params, { replace: true });
    };

    const formatDateTime = (str: string) => {
        const d = new Date(str);
        return isNaN(d.getTime())
            ? 'Invalid date'
            : d.toLocaleString(undefined, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
    };

    const toggleComments = (postId: number) => {
        setExpandedPosts(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    const handleAddComment = async (postId: number) => {
        if (!newComment.trim() || !isAuthenticated) return;

        try {
            const response = await apiRequest<Comment>({
                endpoint: `/Societies/posts/${postId}/comments/`,
                method: 'POST',
                data: {
                    content: newComment,
                    post_id: postId
                }
            });

            setResults(prev => ({
                ...prev,
                posts: prev.posts.map(post => {
                    if (post.id === postId) {
                        return {
                            ...post,
                            comments: [...(post.comments || []), response.data].filter((comment): comment is Comment => comment !== undefined)
                        };
                    }
                    return post;
                })
            }));

            setNewComment('');
            setCommentingPostId(null);
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleLike = async (postId: number, society: string) => {
        if (!isAuthenticated) return;
        
        try {
            const endpoint = likedPosts[postId] 
                ? `/Societies/${society}/posts/${postId}/dislike/`
                : `/Societies/${society}/posts/${postId}/like/`;
            
            const response = await apiRequest({
                endpoint,
                method: 'POST'
            });

            if (!response.error) {
                setResults(prev => ({
                    ...prev,
                    posts: prev.posts.map(post => {
                        if (post.id === postId) {
                            return {
                                ...post,
                                likes_count: likedPosts[postId] ? post.likes_count - 1 : post.likes_count + 1,
                                liked_by_user: !likedPosts[postId]
                            };
                        }
                        return post;
                    })
                }));
                setLikedPosts(prev => ({
                    ...prev,
                    [postId]: !prev[postId]
                }));
            }
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    /* ---------- render ---------- */
    return (
        <>
            <Sidebar>
                <Flex justify="center" align="flex-start" gap="md" px="md">
                    <div style={{ width: 200 }} />

                    <div style={{ flex: 1, maxWidth: 900 }}>
                        <Container size="md" py="xl">
                            <Title order={2} mb="lg">Search Results for "{query}"</Title>

                            {/* Filters */}
                            <Card mb="lg" p="md" withBorder>
                                <Flex gap="md" wrap="wrap">
                                    <Select label="Type" data={[
                                        { value: "", label: "All" },
                                        { value: "society", label: "Society" },
                                        { value: "event", label: "Event" },
                                        { value: "user", label: "User" },
                                        { value: "post", label: "Post" },
                                    ]} value={type}
                                        onChange={v => handleFilterChange("type", v || "")}
                                        style={{ minWidth: 120 }}
                                    />
                                    <Select label="Sort" data={[
                                        { value: "", label: "Default" },
                                        { value: "popularity", label: "Popularity" },
                                        { value: "date", label: "Date" },
                                    ]} value={sort}
                                        onChange={v => handleFilterChange("sort", v || "")}
                                        style={{ minWidth: 120 }}
                                    />
                                    <Select label="Order" data={[
                                        { value: "desc", label: "Descending" },
                                        { value: "asc", label: "Ascending" },
                                    ]} value={order}
                                        onChange={v => handleFilterChange("order", v || "desc")}
                                        style={{ minWidth: 120 }}
                                    />
                                    <Checkbox label="Friends Only" checked={friendsOnly}
                                        onChange={e => handleFilterChange("friends_only", e.currentTarget.checked)}
                                        style={{ marginTop: 28 }}
                                    />
                                    <TagDropdown
                                        label="Tags"
                                        placeholder="Select tags"
                                        value={selectedTags}
                                        onChange={v => handleFilterChange("tags", v)}
                                    />
                                </Flex>
                            </Card>

                            {loading && <Loader />}
                            {error && <Text color="red">{error}</Text>}

                            {/* Societies */}
                            <Title order={3} mt="md" mb="xs">Societies</Title>
                            {results.societies.length ? (
                                <Stack gap="sm">
                                    {results.societies.map(soc => (
                                        <Card key={soc.id} shadow="sm" p="md" radius="md" withBorder>
                                            <Anchor component={Link}
                                                to={`/Societies/${encodeURIComponent(soc.name)}`}
                                                underline="always">
                                                <Title order={4}>{soc.name}</Title>
                                            </Anchor>
                                            <Text>{soc.description}</Text>
                                            <Text size="sm" color="dimmed">
                                                Interested: {soc.numOfInterestedPeople}
                                            </Text>
                                        </Card>
                                    ))}
                                </Stack>
                            ) : <Text color="dimmed">No societies found.</Text>}

                            {/* Events */}
                            <Title order={3} mt="lg" mb="xs">Events</Title>
                            {results.events.length ? (
                                <Stack gap="sm">
                                    {results.events.map(ev => (
                                        <Card key={ev.id} shadow="sm" p="md" radius="md" withBorder>
                                            {ev.society ? (
                                                <Anchor component={Link}
                                                    to={`/Societies/${encodeURIComponent(ev.society)}/${ev.id}`}
                                                    underline="always">
                                                    <Title order={4}>{ev.name}</Title>
                                                </Anchor>
                                            ) : <Title order={4}>{ev.name}</Title>}
                                            <Text>{ev.details}</Text>
                                            <Text size="sm" color="dimmed">
                                                {new Date(ev.startTime).toLocaleString()} – {new Date(ev.endTime).toLocaleString()}
                                            </Text>
                                            <Text size="sm" color="dimmed">Location: {ev.location}</Text>
                                        </Card>
                                    ))}
                                </Stack>
                            ) : <Text color="dimmed">No events found.</Text>}

                            {/* Users */}
                            <Title order={3} mt="lg" mb="xs">Users</Title>
                            {results.users.length ? (
                                <Stack gap="sm">
                                    {results.users.map(u => (
                                        <Card key={u.accountID} shadow="sm" p="md" radius="md" withBorder>
                                            <Anchor component={Link} to={`/profile/${u.accountID}`} underline="always">
                                                <Title order={4}>{u.firstName} {u.lastName}</Title>
                                            </Anchor>
                                            <Text size="sm" color="dimmed">ID: {u.accountID}</Text>
                                            <Text>{u.email}</Text>
                                        </Card>
                                    ))}
                                </Stack>
                            ) : <Text color="dimmed">No users found.</Text>}

                            {/* Posts */}
                            <Title order={3} mt="lg" mb="xs">Posts</Title>
                            {results.posts.length ? (
                                <Stack gap="md">
                                    {results.posts.map((post) => (
                                        <Card key={post.id} shadow="sm" padding="lg" radius="md" withBorder>
                                            <Stack gap="xs">
                                                <Group justify="space-between">
                                                    <Text size="sm" c="dimmed">{post.author_name} • {formatDateTime(post.created_at)}</Text>
                                                    <Badge color="blue">{post.visibility}</Badge>
                                                </Group>
                                                <Text>{post.content}</Text>
                                                {post.image && (
                                                    <Image
                                                        src={getMediaUrl(post.image)}
                                                        alt="Post image"
                                                        mt="md"
                                                        radius="md"
                                                        fit="contain"
                                                        style={{ maxHeight: '400px' }}
                                                    />
                                                )}
                                                <Group justify="space-between">
                                                    <Text size="sm" c="dimmed">Posted in {post.society}</Text>
                                                    <Button
                                                        variant="light"
                                                        radius="md"
                                                        component={Link}
                                                        to={`/Societies/${post.society}`}
                                                    >
                                                        View Society
                                                    </Button>
                                                </Group>

                                                {/* Comments Section */}
                                                <Divider my="sm" />
                                                <Group justify="space-between" mb="xs">
                                                    <Group>
                                                        <Button
                                                            variant="subtle"
                                                            color={post.liked_by_user ? "red" : "gray"}
                                                            leftSection={<Icon icon={post.liked_by_user ? "tabler:heart-filled" : "tabler:heart"} width={16} height={16} />}
                                                            onClick={() => handleLike(post.id, post.society)}
                                                            disabled={!isAuthenticated}
                                                        >
                                                            {post.likes_count}
                                                        </Button>
                                                        <Text size="sm" fw={500}>
                                                            {post.comments?.length || 0} Comments
                                                        </Text>
                                                    </Group>
                                                    <Button
                                                        variant="subtle"
                                                        size="sm"
                                                        leftSection={<Icon icon={expandedPosts[post.id] ? chevronUp : chevronDown} width={16} height={16} />}
                                                        onClick={() => toggleComments(post.id)}
                                                    >
                                                        {expandedPosts[post.id] ? 'Hide Comments' : 'View Comments'}
                                                    </Button>
                                                </Group>

                                                {expandedPosts[post.id] && (
                                                    <Stack gap="xs">
                                                        {commentingPostId === post.id ? (
                                                            <Group>
                                                                <TextInput
                                                                    placeholder="Write a comment..."
                                                                    value={newComment}
                                                                    onChange={(e) => setNewComment(e.target.value)}
                                                                    style={{ flex: 1 }}
                                                                />
                                                                <Button
                                                                    variant="light"
                                                                    onClick={() => handleAddComment(post.id)}
                                                                    leftSection={<Icon icon={send} width={16} height={16} />}
                                                                >
                                                                    Post
                                                                </Button>
                                                            </Group>
                                                        ) : (
                                                            <Button
                                                                variant="subtle"
                                                                leftSection={<Icon icon={messageCircle} width={16} height={16} />}
                                                                onClick={() => setCommentingPostId(post.id)}
                                                            >
                                                                Add Comment
                                                            </Button>
                                                        )}

                                                        {post.comments?.map((comment) => (
                                                            <Paper key={comment.id} p="xs" withBorder>
                                                                <Group justify="space-between" mb={4}>
                                                                    <Text size="sm" fw={500}>{comment.author_name}</Text>
                                                                    <Text size="xs" c="dimmed">
                                                                        {formatDateTime(comment.created_at)}
                                                                    </Text>
                                                                </Group>
                                                                <Text size="sm">{comment.content}</Text>
                                                            </Paper>
                                                        ))}
                                                    </Stack>
                                                )}
                                            </Stack>
                                        </Card>
                                    ))}
                                </Stack>
                            ) : (
                                <Text color="dimmed">No posts found.</Text>
                            )}
                        </Container>
                    </div>

                    <div style={{ width: 200 }} />
                </Flex>
            </Sidebar>
            <RightSidebar />
        </>
    );
};

export default SearchPage;
