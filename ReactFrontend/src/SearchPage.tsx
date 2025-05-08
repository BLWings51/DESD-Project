// SearchPage.tsx
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import apiRequest from "./api/apiRequest";
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
    MultiSelect,
    Select,
    Checkbox,
} from "@mantine/core";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

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
interface Post { [key: string]: any }
interface SearchResults {
    societies: Society[]; events: Event[]; users: User[]; posts: Post[];
}
const EMPTY_RESULTS: SearchResults = {
    societies: [], events: [], users: [], posts: [],
};

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();

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

    /* ---------- render ---------- */
    return (
        <>
            <Sidebar>
                <Flex justify="center" align="flex-start" gap="md" px="md">
                    <div style={{ width: 200 }} />

                    <div style={{ flex: 1, maxWidth: 900 }}>
                        <Container size="md" py="xl">
                            <Title order={2} mb="lg">Search Results for “{query}”</Title>

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
                                    <MultiSelect label="Tags" placeholder="Select tags"
                                        data={availableTags} value={selectedTags}
                                        onChange={v => handleFilterChange("tags", v)}
                                        searchable clearable style={{ minWidth: 200 }}
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
                                <List>
                                    {results.posts.map((post, i) => (
                                        <List.Item key={i}>{JSON.stringify(post)}</List.Item>
                                    ))}
                                </List>
                            ) : <Text color="dimmed">No posts found.</Text>}
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
