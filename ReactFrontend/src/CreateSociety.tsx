import { useForm } from "@mantine/form";
import { Button, TextInput, Textarea, Loader, Card, Flex, Title, Alert, MultiSelect, Group } from "@mantine/core";
import apiRequest from "./api/apiRequest";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const CreateSociety = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm({
        initialValues: {
            name: '',
            description: '',
            interests: [] as string[],
        },
        validate: {
            name: (value) => (value.length < 3 ? 'Name must be at least 3 characters' : null),
            description: (value) => (value.length < 10 ? 'Description must be at least 10 characters' : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest<{ message: string }>({
                endpoint: '/Societies/CreateSociety/',
                method: 'POST',
                data: {
                    ...values,
                    numOfInterestedPeople: 0
                },
            });

            if (response.error) {
                throw new Error(response.message || "Failed to create society");
            }

            navigate('/Societies');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create society");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Flex justify="center" align="center" h="100vh" direction="column">
            <Card p={50} withBorder radius="lg" w={400}>
                <Card.Section p="md">
                    <Title order={2}>Create Society</Title>
                </Card.Section>

                <Card.Section p="md">
                    {error && (
                        <Alert color="red" mb="md">
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <TextInput
                            label="Society Name"
                            variant="filled"
                            radius="md"
                            placeholder="Society Name"
                            {...form.getInputProps('name')}
                            required
                            autoComplete="off"
                            mb="sm"
                        />

                        <Textarea
                            label="Description"
                            variant="filled"
                            radius="md"
                            placeholder="Society Description"
                            {...form.getInputProps('description')}
                            required
                            minRows={4}
                            mb="md"
                        />

                        <MultiSelect
                            label="Interest Tags"
                            placeholder="Select or create interest tags"
                            data={[]}
                            searchable
                            clearable
                            {...form.getInputProps('interests')}
                            mb="md"
                        />

                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="default"
                                onClick={() => navigate('/Societies')}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={loading}
                                disabled={loading}
                            >
                                Create Society
                            </Button>
                        </Group>
                    </form>
                </Card.Section>
            </Card>
        </Flex>
    );
};

export default CreateSociety;