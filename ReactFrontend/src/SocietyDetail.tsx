import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import apiRequest from "./api/apiRequest";
import {
  Card,
  Title,
  Text,
  Loader,
  Flex,
  Button,
  Image,
  Tabs,
  Badge,
  Group,
  ActionIcon,
  Modal,
  Box,
  Textarea,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconCalendarEvent,
  IconMessageCircle,
  IconPlus,
} from "@tabler/icons-react";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

interface SocietyDetail {
  name: string;
  description: string;
  numOfInterestedPeople: number;
  logo?: string | null;
  is_member?: boolean;
}

interface Event {
  id: number;
  name: string;
  details: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
}

interface Post {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
  author: number | { id: number; [key: string]: any };
}

interface Is_Admin {
  admin: boolean;
}

const SocietyDetail = () => {
  const { society_name } = useParams<{ society_name: string }>();
  const { isAuthenticated, loggedAccountID, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [society, setSociety] = useState<SocietyDetail | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePostModalOpen, setDeletePostModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isSocietyAdmin, setIsSocietyAdmin] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [postPermissions, setPostPermissions] = useState<{ [key: number]: boolean }>({});

  // Check admin status and get user ID
  useEffect(() => {
    if (!isAuthenticated || !loggedAccountID || !society_name) return;
    
    // Get user profile to get database ID
    apiRequest<{ id: number; adminStatus: boolean }>({ 
      endpoint: `/Profile/${loggedAccountID}/`, 
      method: 'GET' 
    })
      .then(res => {
        if (res.data) {
          setUserId(res.data.id);
          setIsAdmin(res.data.adminStatus);
        }
      })
      .catch(err => console.error("Failed to get user details:", err));

    // Check if user is a society admin
    apiRequest<{ "Society Admin": boolean }>({
      endpoint: `/Societies/${society_name}/IsSocietyAdmin/`,
      method: 'POST'
    })
      .then(res => {
        if (res.data) {
          setIsSocietyAdmin(res.data["Society Admin"]);
        }
      })
      .catch(err => console.error("Failed to check society admin status:", err));
  }, [isAuthenticated, loggedAccountID, society_name]);

  // Check if user can delete each post
  useEffect(() => {
    if (!isAuthenticated || !society_name) return;

    const checkPostPermissions = async () => {
      const permissions: { [key: number]: boolean } = {};
      
      for (const post of posts) {
        try {
          const response = await apiRequest<{ can_delete: boolean }>({
            endpoint: `/Societies/${society_name}/posts/can_delete/${post.id}/`,
            method: 'GET'
          });
          if (response.data) {
            permissions[post.id] = response.data.can_delete;
          }
        } catch (err) {
          console.error(`Failed to check permissions for post ${post.id}:`, err);
          permissions[post.id] = false;
        }
      }
      
      setPostPermissions(permissions);
    };

    checkPostPermissions();
  }, [isAuthenticated, society_name, posts]);

  // Fetch society details & events
  useEffect(() => {
    const fetchData = async () => {
      try {
        const societyResponse = await apiRequest<SocietyDetail>({
          endpoint: `/Societies/${society_name}/`,
          method: "GET",
        });
        if (societyResponse.data) {
          setSociety(societyResponse.data);
          const eventsResponse = await apiRequest<Event[]>({
            endpoint: `/Societies/${societyResponse.data.name}/Events/`,
            method: "GET",
          });
          setEvents(eventsResponse.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load society");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [society_name]);

  // Fetch society posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsResponse = await apiRequest<Post[]>({
          endpoint: `/Societies/${society_name}/posts/`,
          method: "GET",
        });
        setPosts(postsResponse.data || []);
      } catch (err) {
        setPostsError(err instanceof Error ? err.message : "Failed to load posts");
      } finally {
        setPostsLoading(false);
      }
    };
    fetchPosts();
  }, [society_name]);

  const handleJoin = async () => {
    if (!society) return;
    try {
      await apiRequest({ endpoint: `/Societies/${society_name}/join/`, method: "POST" });
      const resp = await apiRequest<SocietyDetail>({
        endpoint: `/Societies/${society_name}/`,
        method: "GET",
      });
      if (resp.data) setSociety(resp.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleLeave = async () => {
    if (!society) return;
    try {
      await apiRequest({ endpoint: `/Societies/${society_name}/leave/`, method: "POST" });
      const resp = await apiRequest<SocietyDetail>({
        endpoint: `/Societies/${society_name}/`,
        method: "GET",
      });
      if (resp.data) setSociety(resp.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    }
  };

  const handleDeleteSociety = async () => {
    try {
      await apiRequest({ endpoint: `/Societies/${society_name}/DeleteSociety/`, method: "DELETE" });
      navigate("/Societies");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete society");
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setIsCreatingPost(true);
    try {
      await apiRequest({
        endpoint: `/Societies/${society_name}/posts/create/`,
        method: "POST",
        data: { content: newPostContent },
      });
      // refresh
      const postsResponse = await apiRequest<Post[]>({
        endpoint: `/Societies/${society_name}/posts/`,
        method: "GET",
      });
      setPosts(postsResponse.data || []);
      setNewPostContent("");
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await apiRequest({
        endpoint: `/Societies/${society_name}/posts/delete/${postToDelete.id}/`,
        method: "DELETE",
      });
      // refresh
      const postsResponse = await apiRequest<Post[]>({
        endpoint: `/Societies/${society_name}/posts/`,
        method: "GET",
      });
      setPosts(postsResponse.data || []);
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : "Failed to delete post");
    } finally {
      setDeletePostModalOpen(false);
      setPostToDelete(null);
    }
  };

  const canDeletePost = (post: Post) => {
    return postPermissions[post.id] || false;
  };

  const formatDateTime = (str: string) => {
    const d = new Date(str);
    if (isNaN(d.getTime())) return "Invalid date";
    return d.toLocaleString([], {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Wait for both data & auth
  if (loading || authLoading) return <Loader size="xl" />;
  if (!society) return <Text>Society not found</Text>;

  // Debug logs
  console.log("Current user ID:", loggedAccountID);
  console.log("Fetched posts:", posts);

  return (
    <>
      <Sidebar>
        <Flex justify="center" align="flex-start" gap="md" px="md">
          <div style={{ width: 200 }} />
          <Box style={{ flex: 1, maxWidth: 900 }}>
            <Flex justify="space-between" align="center" mb="md">
              <Title order={2}>{society.name}</Title>
              {isAdmin && (
                <Group>
                  <Button
                    leftSection={<IconEdit size={16} />}
                    component={Link}
                    to={`/Societies/${society_name}/UpdateSociety`}
                  >
                    Edit
                  </Button>
                  <ActionIcon
                    color="red"
                    variant="outline"
                    onClick={() => setDeleteModalOpen(true)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              )}
            </Flex>

            {isAuthenticated && (
              <Group wrap="nowrap" mb="md">
                <Button color="blue" onClick={handleJoin}>
                  Join ({society.numOfInterestedPeople})
                </Button>
                <Button color="red" onClick={handleLeave}>
                  Leave
                </Button>
              </Group>
            )}

            <Card shadow="sm" p="lg" radius="md" withBorder mb="md">
              <Card.Section>
                <Image
                  src={society.logo || "/default-society-logo.png"}
                  height={300}
                  alt={society.name}
                  fit="cover"
                />
              </Card.Section>
              <Text mt="md">{society.description}</Text>
            </Card>

            <Tabs defaultValue="events">
              <Tabs.List>
                <Tabs.Tab value="events" leftSection={<IconCalendarEvent size={16} />}>
                  Events
                </Tabs.Tab>
                <Tabs.Tab value="posts" leftSection={<IconMessageCircle size={16} />}>
                  Posts
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="events" pt="md">
                <Flex direction="column" gap="md">
                  {isAdmin && (
                    <Button component={Link} to={`/Societies/${society_name}/CreateEvent/`}>
                      Create Event
                    </Button>
                  )}
                  {events.length ? (
                    events.map((evt) => (
                      <Card
                        key={evt.id}
                        shadow="sm"
                        p="lg"
                        radius="md"
                        withBorder
                      >
                        <Flex justify="space-between" align="center">
                          <Box>
                            <Title order={4}>{evt.name}</Title>
                            <Text>
                              {formatDateTime(evt.startTime)} –{" "}
                              {formatDateTime(evt.endTime)}
                            </Text>
                            <Text>{evt.location}</Text>
                            <Badge mt="sm">{evt.status}</Badge>
                          </Box>
                          <Button
                            component={Link}
                            to={`/Societies/${society_name}/${evt.id}`}
                            variant="outline"
                          >
                            View Details
                          </Button>
                        </Flex>
                      </Card>
                    ))
                  ) : (
                    <Text>No events scheduled</Text>
                  )}
                </Flex>
              </Tabs.Panel>

              <Tabs.Panel value="posts" pt="md">
                {isAuthenticated && (
                  <Card shadow="sm" p="lg" radius="md" withBorder mb="md">
                    <Textarea
                      placeholder="What's on your mind?"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      minRows={3}
                      mb="md"
                    />
                    <Button
                      leftSection={<IconPlus size={16} />}
                      onClick={handleCreatePost}
                      loading={isCreatingPost}
                      disabled={!newPostContent.trim()}
                    >
                      Create Post
                    </Button>
                  </Card>
                )}

                {postsLoading ? (
                  <Loader size="sm" />
                ) : postsError ? (
                  <Text color="red">{postsError}</Text>
                ) : posts.length ? (
                  <Flex direction="column" gap="md">
                    {posts.map((post) => {
                      console.log(
                        `Post ${post.id} author field:`,
                        post.author
                      );
                      return (
                        <Card
                          key={post.id}
                          shadow="xs"
                          p="md"
                          radius="md"
                          withBorder
                        >
                          <Flex justify="space-between" align="flex-start">
                            <Box>
                              <Text size="sm" color="dimmed">
                                {post.author_name} •{" "}
                                {formatDateTime(post.created_at)}
                              </Text>
                              <Text mt="sm">{post.content}</Text>
                            </Box>
                            {canDeletePost(post) && (
                              <ActionIcon
                                color="red"
                                variant="subtle"
                                onClick={() => {
                                  setPostToDelete(post);
                                  setDeletePostModalOpen(true);
                                }}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            )}
                          </Flex>
                        </Card>
                      );
                    })}
                  </Flex>
                ) : (
                  <Text>No posts available</Text>
                )}
              </Tabs.Panel>
            </Tabs>

            {/* Delete Society Modal */}
            <Modal
              opened={deleteModalOpen}
              onClose={() => setDeleteModalOpen(false)}
              title="Delete Society"
              centered
            >
              <Text>Are you sure you want to delete this society?</Text>
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={() => setDeleteModalOpen(false)}>
                  Cancel
                </Button>
                <Button color="red" onClick={handleDeleteSociety}>
                  Delete
                </Button>
              </Group>
            </Modal>

            {/* Delete Post Modal */}
            <Modal
              opened={deletePostModalOpen}
              onClose={() => setDeletePostModalOpen(false)}
              title="Delete Post"
              centered
            >
              <Text>Are you sure you want to delete this post?</Text>
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={() => setDeletePostModalOpen(false)}>
                  Cancel
                </Button>
                <Button color="red" onClick={handleDeletePost}>
                  Delete
                </Button>
              </Group>
            </Modal>
          </Box>
          <div style={{ width: 200 }} />
        </Flex>
      </Sidebar>
      <RightSidebar />
    </>
  );
};

export default SocietyDetail;
