import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import apiRequest, { getMediaUrl } from "./api/apiRequest";
import {
  Card,
  Title,
  Text,
  Loader,
  Flex,
  Button,
  Image,
  Group,
  Badge,
  Stack,
  Container,
} from "@mantine/core";
import { Icon } from '@iconify/react';
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

interface Member {
  account: {
    id: number;
    accountID: string;
    email: string;
    firstName: string;
    lastName: string;
    pfp: string | null;
  };
  adminStatus: boolean;
}

interface SocietyDetail {
  name: string;
  description: string;
  members: Member[];
  numOfInterestedPeople: number;
}

const SocietyMembers = () => {
  const { society_name } = useParams<{ society_name: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [society, setSociety] = useState<SocietyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiRequest<SocietyDetail>({
          endpoint: `/Societies/${society_name}/members/`,
          method: 'GET',
        });
        if (response.data) {
          console.log('Members data:', response.data.members);
          setSociety(response.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load society members");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [society_name]);

  const handleMemberClick = (accountID: string) => {
    navigate(`/Profile/${accountID}`);
  };

  if (!society) return <Text>Society not found</Text>;
  if (loading || authLoading) return <Loader size="xl" />;

  return (
    <>
      <Sidebar>
        <Flex justify="center" align="flex-start" gap="md" px="md">
          <div style={{ width: 0 }} />
          <Container size="md" style={{ flex: 1 }}>
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={2}>{society.name} Members</Title>
                <Button component={Link} to={`/Societies/${society_name}`} variant="outline">
                  Back to Society
                </Button>
              </Group>

              <Text size="lg" c="dimmed">{society.description}</Text>
              <Text size="sm" c="dimmed">{society.numOfInterestedPeople} members</Text>

              <Stack gap="md">
                {society.members.map((member) => (
                  <Card 
                    key={member.account.id} 
                    shadow="sm" 
                    padding="lg" 
                    radius="md" 
                    withBorder
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleMemberClick(member.account.accountID)}
                  >
                    <Group>
                      <Image
                        src={getMediaUrl(member.account.pfp)}
                        width={60}
                        height={60}
                        radius="md"
                        alt={`${member.account.firstName} ${member.account.lastName}`}
                        fallbackSrc="https://placehold.co/60x60?text=No+Image"
                      />
                      <div style={{ flex: 1 }}>
                        <Group justify="space-between">
                          <Text fw={500}>{member.account.firstName} {member.account.lastName}</Text>
                          {member.adminStatus && (
                            <Badge color="blue">Admin</Badge>
                          )}
                        </Group>
                        <Text size="sm" c="dimmed">Member</Text>
                      </div>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Container>
        </Flex>
      </Sidebar>
      <RightSidebar />
    </>
  );
};

export default SocietyMembers; 