import { Stack, Group, Grid, Center, Card, Image, Text, Title, Button, Container } from '@mantine/core';
import "./App.css";

const Home: React.FC = () => {
  // Mock data - you'll replace this with your backend calls
  const featuredSocieties = [
    { id: 1, name: "Photography Club", members: 120, coverImage: "https://source.unsplash.com/random/300x200/?photography" },
    { id: 2, name: "Debate Society", members: 85, coverImage: "https://source.unsplash.com/random/300x200/?debate" },
    { id: 3, name: "Computer Science Society", members: 210, coverImage: "https://source.unsplash.com/random/300x200/?coding" },
  ];

  const upcomingEvents = [
    { id: 1, title: "Photography Exhibition", date: "Oct 15, 2023", society: "Photography Club", image: "https://source.unsplash.com/random/300x200/?exhibition" },
    { id: 2, title: "Tech Talk: AI Future", date: "Oct 18, 2023", society: "Computer Science Society", image: "https://source.unsplash.com/random/300x200/?ai" },
    { id: 3, title: "Debate Competition", date: "Oct 20, 2023", society: "Debate Society", image: "https://source.unsplash.com/random/300x200/?debate" },
  ];

  const recentPhotos = [
    { id: 1, url: "https://source.unsplash.com/random/200x200/?university", caption: "Freshers Week 2023", likes: 42 },
    { id: 2, url: "https://source.unsplash.com/random/200x200/?event", caption: "Society Fair", likes: 28 },
    { id: 3, url: "https://source.unsplash.com/random/200x200/?party", caption: "End of Year Party", likes: 56 },
    { id: 4, url: "https://source.unsplash.com/random/200x200/?meeting", caption: "Society Meeting", likes: 19 },
  ];

  return (
    <Container size="xl" py="md">
      {/* Hero Section */}
      <Stack gap="xl" mb="xl">
        <Center>
          <Stack align="center" gap="xs">
            <Title order={1} size="h2">Welcome to University Societies</Title>
            <Text size="lg" c="dimmed">Discover, join, and engage with student communities</Text>
            <Group mt="md">
              <Button variant="filled">Browse Societies</Button>
              <Button variant="outline">View Events</Button>
            </Group>
          </Stack>
        </Center>

        {/* Featured Societies */}
        <Stack gap="md">
          <Title order={2} size="h4">Featured Societies</Title>
          <Grid>
            {featuredSocieties.map((society) => (
              <Grid.Col key={society.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Card.Section>
                    <Image
                      src={society.coverImage}
                      height={160}
                      alt={society.name}
                    />
                  </Card.Section>
                  <Stack gap="xs" mt="md">
                    <Text fw={500}>{society.name}</Text>
                    <Text size="sm" c="dimmed">{society.members} members</Text>
                    <Button variant="light" fullWidth mt="md" radius="md">
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
            {upcomingEvents.map((event) => (
              <Grid.Col key={event.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Card.Section>
                    <Image
                      src={event.image}
                      height={160}
                      alt={event.title}
                    />
                  </Card.Section>
                  <Stack gap="xs" mt="md">
                    <Text fw={500}>{event.title}</Text>
                    <Text size="sm" c="dimmed">{event.date}</Text>
                    <Text size="sm">Hosted by: {event.society}</Text>
                    <Button variant="light" fullWidth mt="md" radius="md">
                      View Details
                    </Button>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>

        {/* Recent Photos */}
        <Stack gap="md">
          <Title order={2} size="h4">Recent Photos</Title>
          <Group gap="md">
            {recentPhotos.map((photo) => (
              <Card key={photo.id} shadow="sm" padding="sm" radius="md" withBorder>
                <Image
                  src={photo.url}
                  height={200}
                  width={200}
                  alt={photo.caption}
                  radius="md"
                />
                <Stack gap={0} mt="sm">
                  <Text size="sm">{photo.caption}</Text>
                  <Text size="xs" c="dimmed">{photo.likes} likes</Text>
                </Stack>
              </Card>
            ))}
          </Group>
        </Stack>
      </Stack>
    </Container>
  );
};

export default Home;