import { useEffect, useState } from "react";
import apiRequest from "./api/apiRequest";
import { Card, Title, Button, Loader, Alert, Group, Text } from "@mantine/core";
import { Link } from "react-router-dom";

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

  if (loading) return <Loader />;
  if (error) return <Alert color="red">{error}</Alert>;

  return (
    <Card>
      <Title order={3}>Your Friends</Title>
      {friends.length === 0 ? (
        <Text>No friends yet.</Text>
      ) : (
        friends.map(friend => (
          <Group key={friend.accountID} gap="md" mt="md">
            <Text>
              <Link to={`/profile/${friend.accountID}`}>
                {friend.firstName} {friend.lastName}
              </Link>
            </Text>
            <Button color="red" size="xs" onClick={() => handleRemove(friend.accountID)}>
              Remove
            </Button>
          </Group>
        ))
      )}
    </Card>
  );
};

export default FriendsList;
