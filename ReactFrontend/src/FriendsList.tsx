import { useEffect, useState } from "react";
import apiRequest, { getMediaUrl } from "./api/apiRequest";
import { Card, Title, Button, Loader, Alert, Group, Text, Flex, Box, Stack, ActionIcon, Image } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
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
  pfp: string | null;
}

const FriendsList = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const handleFriendClick = (accountID: number) => {
    navigate(`/Profile/${accountID}`);
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
                    <Card 
                      key={friend.accountID} 
                      shadow="sm" 
                      p="md" 
                      radius="md" 
                      withBorder
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleFriendClick(friend.accountID)}
                    >
                      <Group justify="space-between">
                        <Group>
                          <Image
                            src={getMediaUrl(friend.pfp)}
                            width={60}
                            height={60}
                            radius="md"
                            alt={`${friend.firstName} ${friend.lastName}`}
                            fallbackSrc="https://placehold.co/60x60?text=No+Image"
                          />
                          <Box>
                            <Text fw={500}>
                              {friend.firstName} {friend.lastName}
                            </Text>
                            <Text size="sm" c="dimmed">{friend.email}</Text>
                          </Box>
                        </Group>
                        <ActionIcon 
                          color="red" 
                          variant="subtle" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(friend.accountID);
                          }}
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
