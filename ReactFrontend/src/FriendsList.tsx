import { useEffect, useState } from "react";
import apiRequest from "./api/apiRequest";
import { Card, Title, Button, Loader, Alert, Group, Text, Flex, Box, Stack, ActionIcon } from "@mantine/core";
import { Link } from "react-router-dom";
import { Icon } from '@iconify/react';
import trash from '@iconify-icons/tabler/trash';
import user from '@iconify-icons/tabler/user';
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

interface Friend {
  accountID: number;
  firstName: string;
  lastName: string;
  email: string;
}

const FriendsList = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      const res = await apiRequest<Friend[]>({ endpoint: "/friends/list/" });
      if (res.error) setError(res.message || "Failed to load friends");
      else setFriends(res.data || []);
      setLoading(false);
    };
    fetchFriends();
  }, []);

  const handleRemove = async (accountID: number) => {
    if (!window.confirm("Remove this friend?")) return;
    const res = await apiRequest({ endpoint: `/friends/remove/${accountID}/`, method: "POST" });
    if (!res.error) setFriends(friends.filter(f => f.accountID !== accountID));
    else alert(res.message);
  };

  if (loading) return (
    <>
      <Sidebar>
        <Flex justify="center" align="center" h="100vh">
          <Loader size="xl" />
        </Flex>
      </Sidebar>
      <RightSidebar />
    </>
  );

  if (error) return (
    <>
      <Sidebar>
        <Flex justify="center" align="center" h="100vh">
          <Alert color="red">{error}</Alert>
        </Flex>
      </Sidebar>
      <RightSidebar />
    </>
  );

  return (
    <>
      <Sidebar>
        <Flex justify="center" align="flex-start" gap="md" px="md">
          <div style={{ width: 200 }} />
          <Box style={{ flex: 1, maxWidth: 900 }}>
            <Title order={2} mb="xl">Friends</Title>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              {friends.length === 0 ? (
                <Text c="dimmed" ta="center">No friends yet.</Text>
              ) : (
                <Stack gap="md">
                  {friends.map(friend => (
                    <Card key={friend.accountID} shadow="sm" p="md" radius="md" withBorder>
                      <Group justify="space-between">
                        <Group>
                          <Icon icon={user} width={24} height={24} />
                          <Box>
                            <Text fw={500} component={Link} to={`/profile/${friend.accountID}`} style={{ textDecoration: 'none' }}>
                              {friend.firstName} {friend.lastName}
                            </Text>
                            <Text size="sm" c="dimmed">{friend.email}</Text>
                          </Box>
                        </Group>
                        <ActionIcon 
                          color="red" 
                          variant="subtle" 
                          onClick={() => handleRemove(friend.accountID)}
                          title="Remove friend"
                        >
                          <Icon icon={trash} width={18} height={18} />
                        </ActionIcon>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              )}
            </Card>
          </Box>
          <div style={{ width: 200 }} />
        </Flex>
      </Sidebar>
      <RightSidebar />
    </>
  );
};

export default FriendsList;
