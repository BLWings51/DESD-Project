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
  Container,
  MultiSelect,
} from "@mantine/core";
import { Icon } from '@iconify/react';
import edit from '@iconify-icons/tabler/edit';
import trash from '@iconify-icons/tabler/trash';
import calendarEvent from '@iconify-icons/tabler/calendar-event';
import messageCircle from '@iconify-icons/tabler/message-circle';
import plus from '@iconify-icons/tabler/plus';
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

interface SocietyDetail {
  name: string;
  description: string;
  numOfInterestedPeople: number;
  logo?: string | null;
  is_member?: boolean;
  interests: string[];
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
  author_name: string;
  created_at: string;
}

interface Is_Admin {
  admin: boolean;
}

const SocietyDetail = () => {
  const { society_name } = useParams<{ society_name: string }>();
  const { isAuthenticated, loggedAccountID, isLoading: authLoading } = useAuth();
  const [society, setSociety] = useState<SocietyDetail | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSocietyAdmin, setIsSocietyAdmin] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [postPermissions, setPostPermissions] = useState<{ [key: number]: boolean }>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostInterests, setNewPostInterests] = useState<string[]>([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deletePostModalOpen, setDeletePostModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await apiRequest<Is_Admin>({
          endpoint: '/admin_check/',
          method: 'POST',
        });
        setIsAdmin(response.data?.admin || false);
      } catch (error) {
        console.error("Failed to check admin status:", error);
      }
    };
    checkAdminStatus();
  }, [isAuthenticated, loggedAccountID]);

  useEffect(() => {
    if (!isAuthenticated || !loggedAccountID) return;

    apiRequest<{ id: number; adminStatus: boolean }>({
      endpoint: `/Profile/${loggedAccountID}/`,
      method: 'GET',
    })
      .then(res => {
        if (res.data) {
          setUserId(res.data.id);
          setIsAdmin(res.data.adminStatus);
        }
      })
      .catch(err => console.error("Failed to get user details:", err));

    apiRequest<{ "Society Admin": boolean }>({
      endpoint: `/Societies/${society_name}/IsSocietyAdmin/`,
      method: 'POST',
    })
      .then(res => {
        if (res.data) setIsSocietyAdmin(res.data["Society Admin"]);
      })
      .catch(err => console.error("Failed to check society admin status:", err));
  }, [isAuthenticated, loggedAccountID, society_name]);

  useEffect(() => {
    if (!isAuthenticated || !society_name) return;
    (async () => {
      const perms: { [key: number]: boolean } = {};
      for (const post of posts) {
        try {
          const resp = await apiRequest<{ can_delete: boolean }>({
            endpoint: `/Societies/${society_name}/posts/can_delete/${post.id}/`,
            method: 'GET',
          });
          perms[post.id] = resp.data?.can_delete ?? false;
        } catch {
          perms[post.id] = false;
        }
      }
      setPostPermissions(perms);
    })();
  }, [isAuthenticated, society_name, posts]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await apiRequest<SocietyDetail>({
          endpoint: `/Societies/${society_name}/`,
          method: 'GET',
        });
        if (resp.data) {
          setSociety(resp.data);
          setAvailableTags(resp.data.interests || []);
          const ev = await apiRequest<Event[]>({
            endpoint: `/Societies/${resp.data.name}/Events/`,
            method: 'GET',
          });
          setEvents(ev.data || []);
        }
      } catch {
        setError('Failed to load society');
      } finally {
        setLoading(false);
      }
    })();
  }, [society_name]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await apiRequest<Post[]>({
          endpoint: `/Societies/${society_name}/posts/`,
          method: 'GET',
        });
        setPosts(resp.data || []);
      } catch {
        setPostsError('Failed to load posts');
      } finally {
        setPostsLoading(false);
      }
    })();
  }, [society_name]);

  const handleJoin = async () => {
    if (!society) return;
    try {
      await apiRequest({ endpoint: `/Societies/${society_name}/join/`, method: 'POST' });
      const updated = await apiRequest<SocietyDetail>({
        endpoint: `/Societies/${society_name}/`,
        method: 'GET',
      });
      if (updated.data) setSociety(updated.data);
    } catch {
      setError('Operation failed');
    }
  };

  const handleLeave = async () => {
    if (!society) return;
    try {
      await apiRequest({ endpoint: `/Societies/${society_name}/leave/`, method: 'POST' });
      const updated = await apiRequest<SocietyDetail>({
        endpoint: `/Societies/${society_name}/`,
        method: 'GET',
      });
      if (updated.data) setSociety(updated.data);
    } catch {
      setError('Operation failed');
    }
  };

  const handleDeleteSociety = async () => {
    try {
      await apiRequest({ endpoint: `/Societies/${society_name}/DeleteSociety/`, method: 'DELETE' });
      navigate('/Societies');
    } catch {
      setError('Failed to delete society');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setIsCreatingPost(true);
    try {
      await apiRequest({
        endpoint: `/Societies/${society_name}/posts/create/`,
        method: 'POST',
        data: {
          content: newPostContent,
          interests: newPostInterests,
        },
      });
      const resp = await apiRequest<Post[]>({
        endpoint: `/Societies/${society_name}/posts/`,
        method: 'GET',
      });
      setPosts(resp.data || []);
      setNewPostContent('');
      setNewPostInterests([]);
    } catch {
      setPostsError('Failed to create post');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await apiRequest({ endpoint: `/Societies/${society_name}/posts/delete/${postToDelete.id}/`, method: 'DELETE' });
      const resp = await apiRequest<Post[]>({
        endpoint: `/Societies/${society_name}/posts/`,
        method: 'GET',
      });
      setPosts(resp.data || []);
    } catch {
      setPostsError('Failed to delete post');
    } finally {
      setDeletePostModalOpen(false);
      setPostToDelete(null);
    }
  };

  const canDeletePost = (post: Post) => postPermissions[post.id] || false;

  const formatDateTime = (str: string) => {
    const d = new Date(str);
    return isNaN(d.getTime())
      ? 'Invalid date'
      : d.toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!society) return <Text>Society not found</Text>;
  if (loading || authLoading) return <Loader size="xl" />;

  return (
    <>
      <Sidebar>
        <Flex justify="center" align="flex-start" gap="md" px="md">
          <div style={{ width: 200 }} />
          <Box style={{ flex: 1, maxWidth: 900 }}>
            <Flex justify="space-between" align="center" mb="md">
              <Title order={2}>{society.name}</Title>
              {(isAdmin || isSocietyAdmin) && (
                <Group>
                  <Button leftSection={<Icon icon={edit} width={16} height={16} />} component={Link} to={`/Societies/${society_name}/UpdateSociety`}>
                    Edit
                  </Button>
                  {isAdmin && (
                    <ActionIcon color="red" variant="outline" onClick={() => setDeleteModalOpen(true)}>
                      <Icon icon={trash} width={16} height={16} />
                    </ActionIcon>
                  )}
                </Group>
              )}
            </Flex>

            {isAuthenticated && (
              <Group wrap="nowrap" mb="md">
                <Button color="blue" onClick={handleJoin}>Join ({society.numOfInterestedPeople})</Button>
                <Button color="red" onClick={handleLeave}>Leave</Button>
              </Group>
            )}

            <Card shadow="sm" p="lg" radius="md" withBorder mb="md">
              <Card.Section>
                <Image src={society.logo || "/default-society-logo.png"} height={300} alt={society.name} fit="cover" />
              </Card.Section>
              <Text mt="md">{society.description}</Text>
            </Card>

            <Tabs defaultValue="events">
              <Tabs.List>
                <Tabs.Tab value="events" leftSection={<Icon icon={calendarEvent} width={16} height={16} />}>Events</Tabs.Tab>
                <Tabs.Tab value="posts" leftSection={<Icon icon={messageCircle} width={16} height={16} />}>Posts</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="events" pt="md">
                <Flex direction="column" gap="md">
                  <Group>
                    {(isAdmin || isSocietyAdmin) && (
                      <>
                        <Button variant="outline" component={Link} to={`/Societies/${society_name}/CreateEvent`} leftSection={<Icon icon={plus} width={16} height={16} />}>
                          Create Event
                        </Button>
                        <Button variant="outline" component={Link} to={`/Societies/${society_name}/UpdateSociety`} leftSection={<Icon icon={edit} width={16} height={16} />}>
                          Edit Society
                        </Button>
                      </>
                    )}
                  </Group>
                  {events.length ? (
                    events.map(evt => (
                      <Card key={evt.id} shadow="sm" p="lg" radius="md" withBorder>
                        <Flex justify="space-between" align="center">
                          <Box>
                            <Title order={4}>{evt.name}</Title>
                            <Text>{formatDateTime(evt.startTime)} – {formatDateTime(evt.endTime)}</Text>
                            <Text>{evt.location}</Text>
                            <Badge mt="sm">{evt.status}</Badge>
                          </Box>
                          <Button component={Link} to={`/Societies/${society_name}/${evt.id}`} variant="outline">View Details</Button>
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
                      onChange={e => setNewPostContent(e.target.value)}
                      minRows={3}
                      mb="md"
                    />
                    <MultiSelect
                      label="Interest Tags"
                      placeholder="Select or create interest tags"
                      data={availableTags}
                      value={newPostInterests}
                      onChange={setNewPostInterests}
                      searchable
                      clearable
                      mb="md"
                    />
                    <Button
                      leftSection={<Icon icon={plus} width={16} height={16} />}
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
                    {posts.map(post => (
                      <Card key={post.id} shadow="xs" p="md" radius="md" withBorder>
                        <Flex justify="space-between" align="flex-start">
                          <Box>
                            <Text size="sm" color="dimmed">{post.author_name} • {formatDateTime(post.created_at)}</Text>
                            <Text mt="sm">{post.content}</Text>
                          </Box>
                          {canDeletePost(post) && (
                            <ActionIcon color="red" variant="subtle" onClick={() => { setPostToDelete(post); setDeletePostModalOpen(true); }}>
                              <Icon icon={trash} width={16} height={16} />
                            </ActionIcon>
                          )}
                        </Flex>
                      </Card>
                    ))}
                  </Flex>
                ) : (
                  <Text>No posts available</Text>
                )}
              </Tabs.Panel>
            </Tabs>

            <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Society" centered>
              <Text>Are you sure you want to delete this society?</Text>
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                <Button color="red" onClick={handleDeleteSociety}>Delete</Button>
              </Group>
            </Modal>

            <Modal opened={deletePostModalOpen} onClose={() => setDeletePostModalOpen(false)} title="Delete Post" centered>
              <Text>Are you sure you want to delete this post?</Text>
              <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={() => setDeletePostModalOpen(false)}>Cancel</Button>
                <Button color="red" onClick={handleDeletePost}>Delete</Button>
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