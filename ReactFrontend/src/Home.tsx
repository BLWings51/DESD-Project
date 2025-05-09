import { useEffect, useState } from "react";
import { Stack, Group, Grid, Center, Card, Image, Text, Title, Button, Container, Flex, Badge, TextInput, Paper, Divider } from '@mantine/core';
import { Link } from "react-router-dom";
import apiRequest from "./api/apiRequest";
import "./App.css";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
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

interface Comment {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
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

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [featuredSocieties, setFeaturedSocieties] = useState<Society[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [publicPosts, setPublicPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<{ [key: number]: boolean }>({});
  const [newComment, setNewComment] = useState('');
  const [commentingPostId, setCommentingPostId] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<{ [key: number]: boolean }>({});

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

        // Fetch public posts from all societies
        const allPosts: Post[] = [];
        for (const society of societiesResponse.data || []) {
          try {
            const postsResponse = await apiRequest<Post[]>({
              endpoint: `/Societies/${society.name}/posts/`,
              method: 'GET',
            });

            if (!postsResponse.error && postsResponse.data) {
              // Add society name to each post and filter for public posts
              const publicPostsWithSociety = postsResponse.data
                .filter(post => post.visibility === 'public')
                .map(post => ({
                  ...post,
                  society: society.name
                }));
              allPosts.push(...publicPostsWithSociety);
            }
          } catch (err) {
            console.error(`Failed to fetch posts for society ${society.name}:`, err);
          }
        }

        // Sort posts by creation date (newest first) and limit to 60
        const sortedPosts = allPosts
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 60);
        setPublicPosts(sortedPosts);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

      setPublicPosts(posts => posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...(post.comments || []), response.data].filter((comment): comment is Comment => comment !== undefined)
          };
        }
        return post;
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
        setPublicPosts(posts => posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              likes_count: likedPosts[postId] ? post.likes_count - 1 : post.likes_count + 1,
              liked_by_user: !likedPosts[postId]
            };
          }
          return post;
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

              {/* Public Posts */}
              <Stack gap="md">
                <Group>
                  <Icon icon={messageCircle} width={24} height={24} />
                  <Title order={2} size="h4">Latest Posts</Title>
                </Group>
                <Stack gap="md">
                  {publicPosts.length > 0 ? (
                    publicPosts.map((post) => (
                      <Card key={post.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">{post.author_name} • {formatDateTime(post.created_at)}</Text>
                            <Badge color="blue">Public</Badge>
                          </Group>
                          <Text>{post.content}</Text>
                          {post.image && (
                            <Image
                              src={post.image}
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

                              {post.comments?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((comment) => (
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
                    ))
                  ) : (
                    <Text c="dimmed" ta="center">No public posts available</Text>
                  )}
                </Stack>
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