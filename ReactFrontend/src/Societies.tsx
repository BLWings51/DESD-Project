import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./authContext";
import apiRequest from "./api/apiRequest";
import { Card, Title, Text, Loader, Flex, Button, SimpleGrid, Image, Group } from "@mantine/core";
import { Icon } from '@iconify/react';
import plus from '@iconify-icons/tabler/plus';
import users from '@iconify-icons/tabler/users';
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

interface Society {
    id: number;
    name: string;
    description: string;
    pfp: string;
    numOfInterestedPeople: number;
}

interface Is_Admin {
    admin: boolean;
}

const Societies = () => {
    const [societies, setSocieties] = useState<Society[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch societies
                const response = await apiRequest<Society[]>({
                    endpoint: '/Societies/',
                    method: 'GET',
                });
                // Sort societies by member count in descending order
                const sortedSocieties = (response.data || []).sort((a, b) => b.numOfInterestedPeople - a.numOfInterestedPeople);
                setSocieties(sortedSocieties);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load societies");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <>
            <Sidebar>
                <Flex justify="center" align="flex-start" gap="md" px="md">
                    {/* Left Sidebar Placeholder */}
                    <div style={{ width: "200px" }} />

                    {/* Main Content */}
                    <div style={{ flex: 1, maxWidth: "900px" }}>
                        <Flex justify="space-between" align="center" mb="md">
                            <Title order={2}>Societies</Title>
                            {isAuthenticated && (
                                <Button
                                    leftSection={<Icon icon={plus} width={16} height={16} />}
                                    component={Link}
                                    to="/Societies/CreateSociety"
                                >
                                    Create Society
                                </Button>
                            )}
                        </Flex>

                        {error && <Text color="red">{error}</Text>}

                        {loading ? (
                            <Loader size="xl" />
                        ) : (
                            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                                {societies.map((society) => (
                                    <Card
                                        key={society.id}
                                        component={Link}
                                        to={`/Societies/${society.name}`}
                                        shadow="sm"
                                        padding="lg"
                                        radius="md"
                                        withBorder
                                    >
                                        <Card.Section>
                                            <Image
                                                src={society.pfp || '/default-society-logo.png'}
                                                height={160}
                                                alt={society.name}
                                                fallbackSrc="https://placehold.co/160x160?text=No+Image"
                                            />
                                        </Card.Section>
                                        <Title order={4} mt="sm">{society.name}</Title>
                                        <Group gap="xs" mt="xs">
                                            <Icon icon={users} width={16} height={16} />
                                            <Text size="sm" c="dimmed">{society.numOfInterestedPeople} members</Text>
                                        </Group>
                                        <Text lineClamp={3} mt="xs">{society.description}</Text>
                                    </Card>
                                ))}
                            </SimpleGrid>
                        )}
                    </div>

                    {/* Right Sidebar Placeholder */}
                    <div style={{ width: "200px" }} />
                </Flex>
            </Sidebar>
            <RightSidebar />
        </>
    );
};

export default Societies;