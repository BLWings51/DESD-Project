import { useEffect, useState } from "react";
import { Stack, Group, Grid, Center, Card, Text, Title, Button, Container, Flex, Loader } from '@mantine/core';
import { Link } from "react-router-dom";
import { useAuth } from "./authContext";
import apiRequest from "./api/apiRequest";
import "./App.css";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

interface Event {
  id: number;
  name: string;
  details: string;
  startTime: string;
  endTime: string;
  location: string;
  society: string;
  status: string;
}

interface Society {
  id: number;
  name: string;
}

const Events: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all societies
        const societiesResponse = await apiRequest<Society[]>({
          endpoint: '/Societies/',
          method: 'GET',
        });

        if (societiesResponse.error) {
          throw new Error(societiesResponse.message);
        }

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

        // Filter out past events and sort by start time
        const now = new Date();
        const upcomingEvents = allEvents
          .filter(event => new Date(event.startTime) > now)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        setEvents(upcomingEvents);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (authLoading || loading) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Loader size="xl" />
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Text>Please log in to view events</Text>
      </Flex>
    );
  }

  return (
    <>
      <Sidebar>
        <Flex justify="center" align="flex-start" gap="md" px="md">
          {/* Left Sidebar Placeholder */}
          <div style={{ width: "200px" }} />

          {/* Main Content */}
          <Container size="xl" py="md" style={{ flex: 1, maxWidth: "900px" }}>
            <Stack gap="xl">
              {/* Header */}
              <Center>
                <Stack align="center" gap="xs">
                  <Title order={1} size="h2">Upcoming Events</Title>
                  <Text size="lg" c="dimmed">Discover and join events from all societies</Text>
                </Stack>
              </Center>

              {/* Events Grid */}
              {error && <Text color="red">{error}</Text>}
              <Grid>
                {events.length > 0 ? (
                  events.map((event) => (
                    <Grid.Col key={event.id} span={{ base: 12, sm: 6, md: 4 }}>
                      <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Stack gap="xs">
                          <Text fw={500} size="lg">{event.name}</Text>
                          <Text size="sm" c="dimmed">
                            {new Date(event.startTime).toLocaleDateString()} at {new Date(event.startTime).toLocaleTimeString()}
                          </Text>
                          <Text size="sm" fw={500}>{event.society}</Text>
                          <Text size="sm" lineClamp={2}>{event.details}</Text>
                          <Text size="sm" c="dimmed">{event.location}</Text>
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
          </Container>

          {/* Right Sidebar Placeholder */}
          <div style={{ width: "200px" }} />
        </Flex>
      </Sidebar>
      <RightSidebar />
    </>
  );
};

export default Events; 