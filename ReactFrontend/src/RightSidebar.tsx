import React from "react";
import { Box, Stack, Text, Title, Button } from "@mantine/core";
import { Link } from "react-router-dom";
import { useAuth } from "./authContext";
import apiRequest from "./api/apiRequest";
import { useEffect, useState } from "react";
import { Icon } from '@iconify/react';
import users from '@iconify-icons/tabler/users';

interface UserProfile {
  accountID: number;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  pfp: string | null;
  is_owner: boolean;
  societies: string[];
  events: string[];
  [key: string]: any;
}

const RightSidebar: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, loggedAccountID } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated || !loggedAccountID) return;

      setLoading(true);
      try {
        const response = await apiRequest<UserProfile>({
          endpoint: `/Profile/${loggedAccountID}/`,
          method: "GET",
        });

        if (response.error) {
          throw new Error(response.message);
        }

        if (response.data) {
          setUser(response.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, loggedAccountID]);

  if (authLoading || loading) {
    return (
      <Box
        w={250}
        h="100vh"
        p="md"
        visibleFrom="sm"
        style={{
          position: "fixed",
          top: 80,
          right: 0,
          borderLeft: "1px solid #333",
          zIndex: 100,
        }}
      >
        <Stack gap="xs">
          <Title order={4} size="h5">
            <Icon icon={users} width={18} height={18} style={{ marginRight: "8px" }} />
            My Societies
          </Title>
          <Text size="sm" c="dimmed">Loading...</Text>
        </Stack>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Box
      w={250}
      h="100vh"
      p="md"
      visibleFrom="sm"
      style={{
        position: "fixed",
        top: 80,
        right: 0,
        borderLeft: "1px solid #333",
        zIndex: 100,
      }}
    >
      <Stack gap="xs">
        <Title order={4} size="h5">
          <Icon icon={users} width={18} height={18} style={{ marginRight: "8px" }} />
          My Societies
        </Title>

        {error && <Text c="red" size="sm">{error}</Text>}

        {user?.societies && user.societies.length > 0 ? (
          <Stack gap="xs">
            {user.societies.map((society) => (
              <Button
                key={society}
                variant="light"
                fullWidth
                size="sm"
                component={Link}
                to={`/Societies/${society}`}
                style={{ justifyContent: "flex-start" }}
              >
                {society}
              </Button>
            ))}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            Join societies to see them here
          </Text>
        )}
      </Stack>
    </Box>
  );
};

export default RightSidebar; 