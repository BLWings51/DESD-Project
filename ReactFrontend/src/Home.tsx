import { useEffect, useState } from "react";
import { Stack, Group, Grid, Center, Card, Image, Text, Title, Button, Container, Flex } from '@mantine/core';
import { Link } from "react-router-dom";
import apiRequest from "./api/apiRequest";
import "./App.css";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

interface Society {
  id: number;
  name: string;
  description: string;
  pfp: string;
  numOfInterestedPeople: number;
}

interface Event {
  id: number;
  name: string;
  details: string;
  startTime: string;
  endTime: string;
  location: string;
  society: string;
}

const Home: React.FC = () => {
  const [featuredSocieties, setFeaturedSocieties] = useState<Society[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch societies
        const societiesResponse = await apiRequest<Society[]>({
          endpoint: '/Societies/',
          method: 'GET',
        });

        if (societiesResponse.error) {
          throw new Error(societiesResponse.message);
        }

        // Get top 6 societies by member count
        const sortedSocieties = (societiesResponse.data || [])
          .sort((a, b) => b.numOfInterestedPeople - a.numOfInterestedPeople)
          .slice(0, 6);
        setFeaturedSocieties(sortedSocieties);

        // Fetch events from each society
        const allEvents: Event[] = [];
        for (const society of societiesResponse.data || []) {
          try {
            const eventsResponse = await apiRequest<Event[]>({
              endpoint: `/Societies/${society.name}/Events/`,
              method: 'GET',
            });

            if (!eventsResponse.error && eventsResponse.data) {
              // Add society name to each event
              const eventsWithSociety = eventsResponse.data.map(event => ({
                ...event,
                society: society.name
              }));
              allEvents.push(...eventsWithSociety);
            }
          } catch (err) {
            console.error(`Failed to fetch events for society ${society.name}:`, err);
          }
        }

        // Filter and sort upcoming events
        const now = new Date();
        const upcoming = allEvents
          .filter(event => new Date(event.startTime) > now)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 3);
        setUpcomingEvents(upcoming);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  return (
    <>
      <Sidebar>
        <Flex justify="center" align="flex-start" gap="md" px="md">
          {/* Left Sidebar Placeholder */}
          <div style={{ width: "200px" }} />

          {/* Main Content */}
          <Container size="xl" py="md" style={{ flex: 1, maxWidth: "900px" }}>
            {/* Hero Section */}
            <Stack gap="xl" mb="xl">
              <Center>
                <Stack align="center" gap="xs">
                  <Title order={1} size="h2">Welcome to University Societies</Title>
                  <Text size="lg" c="dimmed">Discover, join, and engage with student communities</Text>
                  <Group mt="md">
                    <Button variant="filled" component={Link} to="/Societies">Browse Societies</Button>
                    <Button variant="outline" component={Link} to="/Events">View Events</Button>
                  </Group>
                </Stack>
              </Center>

              {/* Featured Societies */}
              <Stack gap="md">
                <Title order={2} size="h4">Featured Societies</Title>
                {error && <Text color="red">{error}</Text>}
                <Grid>
                  {featuredSocieties.map((society) => (
                    <Grid.Col key={society.id} span={{ base: 12, sm: 6, md: 4 }}>
                      <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Card.Section>
                          <Image
                            src={society.pfp || '/default-society-logo.png'}
                            height={160}
                            alt={society.name}
                            fallbackSrc="https://placehold.co/160x160?text=No+Image"
                          />
                        </Card.Section>
                        <Stack gap="xs" mt="md">
                          <Text fw={500}>{society.name}</Text>
                          <Text size="sm" c="dimmed">{society.numOfInterestedPeople} members</Text>
                          <Text size="sm" lineClamp={3}>{society.description}</Text>
                          <Button
                            variant="light"
                            fullWidth
                            mt="md"
                            radius="md"
                            component={Link}
                            to={`/Societies/${society.name}`}
                          >
                            Learn More
                          </Button>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              </Stack>

              {/* Upcoming Events */}
              <Stack gap="md">
                <Title order={2} size="h4">Upcoming Events</Title>
                <Grid>
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <Grid.Col key={event.id} span={{ base: 12, sm: 6, md: 4 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                          <Stack gap="xs">
                            <Text fw={500}>{event.name}</Text>
                            <Text size="sm" c="dimmed">
                              {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString()}
                            </Text>
                            <Text size="sm">{event.society}</Text>
                            <Text size="sm" lineClamp={2}>{event.details}</Text>
                            <Button
                              variant="light"
                              fullWidth
                              mt="md"
                              radius="md"
                              component={Link}
                              to={`/Societies/${event.society}/${event.id}`}
                            >
                              View Details
                            </Button>
                          </Stack>
                        </Card>
                      </Grid.Col>
                    ))
                  ) : (
                    <Grid.Col span={12}>
                      <Text c="dimmed" ta="center">No upcoming events</Text>
                    </Grid.Col>
                  )}
                </Grid>
              </Stack>
            </Stack>
          </Container>

          {/* Right Sidebar Placeholder */}
          <div style={{ width: "200px" }} />
        </Flex>
      </Sidebar>
      <RightSidebar />
    </>
  );
};

export default Home;