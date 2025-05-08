import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./authContext";
import apiRequest from "./api/apiRequest";
import { Card, Title, Text, Loader, Flex, Button, SimpleGrid, Image } from "@mantine/core";
import { Icon } from '@iconify/react';
import plus from '@iconify-icons/tabler/plus';
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

interface Society {
    id: number;
    name: string;
    description: string;
    logo: string | null;
}

interface Is_Admin {
    admin: boolean;
}

const Societies = () => {
    const [societies, setSocieties] = useState<Society[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(true);

    useEffect(() => {
        const fetchData = async () => {

            try {
                // Check if user is admin
                const adminCheck = await apiRequest<Is_Admin>({
                    endpoint: '/admin_check/',
                    method: 'POST',
                });
                setIsAdmin(adminCheck.data?.admin || false);
            } catch (err) { }


            try {
                // Fetch societies
                const response = await apiRequest<Society[]>({
                    endpoint: '/Societies/',
                    method: 'GET',
                });
                setSocieties(response.data || []);
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
                            {isAdmin && (
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

                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
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
                                            src={society.logo || '/default-society-logo.png'}
                                            height={160}
                                            alt={society.name}
                                        />
                                    </Card.Section>
                                    <Title order={4} mt="sm">{society.name}</Title>
                                    <Text lineClamp={3} mt="xs">{society.description}</Text>
                                </Card>
                            ))}
                        </SimpleGrid>
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