import { useEffect, useState } from "react";
import apiRequest from "./api/apiRequest";
import { Card, Title, Button, Loader, Alert, Group, Text } from "@mantine/core";
import { Link } from "react-router-dom";

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
  };

  const handleDecline = async (accountID: number) => {
    await apiRequest({ endpoint: `/friends/decline/${accountID}/`, method: "POST" });
    setIncoming(incoming.filter(f => f.accountID !== accountID));
  };

  if (loading) return <Loader />;
  if (error) return <Alert color="red">{error}</Alert>;

  return (
    <Card>
      <Title order={3}>Friend Requests</Title>
      <Title order={5} mt="md">Incoming</Title>
      {incoming.length === 0 ? <Text>No incoming requests.</Text> : (
        incoming.map(req => (
          <Group key={req.accountID} gap="md" mt="md">
            <Text>
              <Link to={`/profile/${req.accountID}`}>
                {req.firstName} {req.lastName}
              </Link>
            </Text>
            <Button color="green" size="xs" onClick={() => handleAccept(req.accountID)}>Accept</Button>
            <Button color="red" size="xs" onClick={() => handleDecline(req.accountID)}>Decline</Button>
          </Group>
        ))
      )}
      <Title order={5} mt="md">Outgoing</Title>
      {outgoing.length === 0 ? <Text>No outgoing requests.</Text> : (
        outgoing.map(req => (
          <Group key={req.accountID} gap="md" mt="md">
            <Text>
              <Link to={`/profile/${req.accountID}`}>
                {req.firstName} {req.lastName}
              </Link>
            </Text>
            <Text color="gray">Pending</Text>
          </Group>
        ))
      )}
    </Card>
  );
};

export default FriendRequests;
