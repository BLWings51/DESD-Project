import { useEffect, useState } from "react";
import apiRequest from "./api/apiRequest";
import { Card, Title, Button, Loader, Alert, Group, Text, Flex, Box, Stack, Badge } from "@mantine/core";
import { Link } from "react-router-dom";
import { Icon } from '@iconify/react';
import userPlus from '@iconify-icons/tabler/user-plus';
import userMinus from '@iconify-icons/tabler/user-minus';
import check from '@iconify-icons/tabler/check';
import x from '@iconify-icons/tabler/x';
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import { updateNotificationCount } from "./Navbar";

interface FriendRequest {
  accountID: number;
  firstName: string;
  lastName: string;
  email: string;
}

const FriendRequests = () => {
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const resIn = await apiRequest<FriendRequest[]>({ endpoint: "/friends/incoming/" });
      const resOut = await apiRequest<FriendRequest[]>({ endpoint: "/friends/outgoing/" });
      if (resIn.error || resOut.error) setError("Failed to load requests");
      else {
        setIncoming(resIn.data || []);
        setOutgoing(resOut.data || []);
      }
      setLoading(false);
    };
    fetchRequests();
  }, []);

  const handleAccept = async (accountID: number) => {
    await apiRequest({ endpoint: `/friends/accept/${accountID}/`, method: "POST" });
    setIncoming(incoming.filter(f => f.accountID !== accountID));
    updateNotificationCount();
  };

  const handleDecline = async (accountID: number) => {
    await apiRequest({ endpoint: `/friends/decline/${accountID}/`, method: "POST" });
    setIncoming(incoming.filter(f => f.accountID !== accountID));
    updateNotificationCount();
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
            <Title order={2} mb="xl">Friend Requests</Title>
            
            <Stack gap="xl">
              {/* Incoming Requests */}
              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Title order={3} mb="md">Incoming Requests</Title>
                {incoming.length === 0 ? (
                  <Text c="dimmed" ta="center">No incoming requests</Text>
                ) : (
                  <Stack gap="md">
                    {incoming.map(req => (
                      <Card key={req.accountID} shadow="sm" p="md" radius="md" withBorder>
                        <Group justify="space-between">
                          <Group>
                            <Icon icon={userPlus} width={24} height={24} />
                            <Box>
                              <Text fw={500} component={Link} to={`/profile/${req.accountID}`} style={{ textDecoration: 'none' }}>
                                {req.firstName} {req.lastName}
                              </Text>
                              <Text size="sm" c="dimmed">{req.email}</Text>
                            </Box>
                          </Group>
                          <Group>
                            <Button
                              variant="light"
                              color="green"
                              leftSection={<Icon icon={check} width={16} height={16} />}
                              onClick={() => handleAccept(req.accountID)}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="light"
                              color="red"
                              leftSection={<Icon icon={x} width={16} height={16} />}
                              onClick={() => handleDecline(req.accountID)}
                            >
                              Decline
                            </Button>
                          </Group>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Card>

              {/* Outgoing Requests */}
              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Title order={3} mb="md">Outgoing Requests</Title>
                {outgoing.length === 0 ? (
                  <Text c="dimmed" ta="center">No outgoing requests</Text>
                ) : (
                  <Stack gap="md">
                    {outgoing.map(req => (
                      <Card key={req.accountID} shadow="sm" p="md" radius="md" withBorder>
                        <Group justify="space-between">
                          <Group>
                            <Icon icon={userMinus} width={24} height={24} />
                            <Box>
                              <Text fw={500} component={Link} to={`/profile/${req.accountID}`} style={{ textDecoration: 'none' }}>
                                {req.firstName} {req.lastName}
                              </Text>
                              <Text size="sm" c="dimmed">{req.email}</Text>
                            </Box>
                          </Group>
                          <Badge color="gray" variant="light">Pending</Badge>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Card>
            </Stack>
          </Box>
          <div style={{ width: 200 }} />
        </Flex>
      </Sidebar>
      <RightSidebar />
    </>
  );
};

export default FriendRequests;
