import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import apiRequest from "./api/apiRequest";
import { Container, Title, Card, Text, Loader, Stack, Paper, List, Anchor } from "@mantine/core";
import { Link } from "react-router-dom";

interface Society {
    id: number;
    name: string;
    description: string;
    numOfInterestedPeople: number;
}

interface Event {
    id: number;
    name: string;
    details: string;
    startTime: string;
    endTime: string;
    location: string;
    society?: string;
}

interface User {
    accountID: number;
    firstName: string;
    lastName: string;
    email: string;
}

interface Post {
    // Define post fields as needed
}

interface SearchResults {
    societies: Society[];
    events: Event[];
    users: User[];
    posts: Post[];
}

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!query) return;
        setLoading(true);
        setError(null);
        apiRequest<SearchResults>({
            endpoint: `/search/?q=${encodeURIComponent(query)}`,
            method: "GET",
        })
            .then((response) => {
                if (!response.error) {
                    setResults(response.data || null);
                } else {
                    setError(response.message || "Search failed");
                }
            })
            .catch((err) => {
                setError(err.message || "Search failed");
            })
            .finally(() => setLoading(false));
    }, [query]);

    return (
        <Container size="md" py="xl">
            <Title order={2} mb="lg">Search Results for "{query}"</Title>
            {loading && <Loader />}
            {error && <Text color="red">{error}</Text>}
            {results && (
                <>
                    <Title order={3} mt="md" mb="xs">Societies</Title>
                    {results.societies.length > 0 ? (
                        <Stack gap="sm">
                            {results.societies.map((society) => (
                                <Card key={society.id} shadow="sm" p="md" radius="md" withBorder>
                                    <Anchor component={Link} to={`/Societies/${encodeURIComponent(society.name)}`} underline="always">
                                        <Title order={4}>{society.name}</Title>
                                    </Anchor>
                                    <Text>{society.description}</Text>
                                    <Text size="sm" color="dimmed">Interested: {society.numOfInterestedPeople}</Text>
                                </Card>
                            ))}
                        </Stack>
                    ) : <Text color="dimmed">No societies found.</Text>}

                    <Title order={3} mt="lg" mb="xs">Events</Title>
                    {results.events.length > 0 ? (
                        <Stack gap="sm">
                            {results.events.map((event) => (
                                <Card key={event.id} shadow="sm" p="md" radius="md" withBorder>
                                    {event.society ? (
                                        <Anchor component={Link} to={`/Societies/${encodeURIComponent(event.society)}/${event.id}`} underline="always">
                                            <Title order={4}>{event.name}</Title>
                                        </Anchor>
                                    ) : (
                                        <Title order={4}>{event.name}</Title>
                                    )}
                                    <Text>{event.details}</Text>
                                    <Text size="sm" color="dimmed">
                                        {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
                                    </Text>
                                    <Text size="sm" color="dimmed">Location: {event.location}</Text>
                                </Card>
                            ))}
                        </Stack>
                    ) : <Text color="dimmed">No events found.</Text>}

                    <Title order={3} mt="lg" mb="xs">Users</Title>
                    {results.users.length > 0 ? (
                        <Stack gap="sm">
                            {results.users.map((user) => (
                                <Card key={user.accountID} shadow="sm" p="md" radius="md" withBorder>
                                    <Anchor component={Link} to={`/profile?accountID=${user.accountID}`} underline="always">
                                        <Title order={4}>{user.firstName} {user.lastName}</Title>
                                    </Anchor>
                                    <Text size="sm" color="dimmed">ID: {user.accountID}</Text>
                                    <Text>{user.email}</Text>
                                </Card>
                            ))}
                        </Stack>
                    ) : <Text color="dimmed">No users found.</Text>}

                    <Title order={3} mt="lg" mb="xs">Posts</Title>
                    {results.posts.length > 0 ? (
                        <List>
                            {results.posts.map((post, idx) => (
                                <List.Item key={idx}>{JSON.stringify(post)}</List.Item>
                            ))}
                        </List>
                    ) : <Text color="dimmed">No posts found.</Text>}
                </>
            )}
        </Container>
    );
};

export default SearchPage; 