import { useForm } from "@mantine/form";
import { Button, TextInput, Textarea, Loader, Card, Flex, Title, Alert, Image } from "@mantine/core";
import apiRequest from "./api/apiRequest";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

interface SocietyData {
    name: string;
    description: string;
    logo: string | null;
}

const UpdateSociety = () => {
    const { society_name } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<SocietyData>({
        initialValues: {
            name: '',
            description: '',
            logo: null,
        },
        validate: {
            name: (value) => (value.length < 3 ? 'Name must be at least 3 characters' : null),
        },
    });

    useEffect(() => {
        const fetchSociety = async () => {
            try {
                const response = await apiRequest<SocietyData>({
                    endpoint: `/Societies/${society_name}/`,
                    method: 'GET',
                });

                if (response.data) {
                    form.setValues({
                        name: response.data.name,
                        description: response.data.description,
                        logo: response.data.logo,
                    });
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load society");
            }
        };

        fetchSociety();
    }, [society_name]);

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest<{ message: string }>({
                endpoint: `/Societies/${society_name}/UpdateSociety/`,
                method: 'POST',
                data: values,
            });

            if (response.error) {
                throw new Error(response.message || "Failed to update society");
            }

            navigate(`/Societies/${values.name}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update society");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Flex justify="center" align="center" h="100vh" direction="column">
            <Card p={50} withBorder radius="lg" w={400}>
                <Card.Section p="md">
                    <Title order={2}>Update Society</Title>
                </Card.Section>

                <Card.Section p="md">
                    {error && (
                        <Alert color="red" mb="md">
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        {form.values.logo && (
                            <Flex justify="center" mb="md">
                                <Image
                                    src={form.values.logo}
                                    alt="Current logo"
                                    height={120}
                                    radius="md"
                                />
                            </Flex>
                        )}

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

                        <Button
                            fullWidth
                            color="blue"
                            type="submit"
                            loading={loading}
                            disabled={loading}
                        >
                            Update Society
                        </Button>
                    </form>
                </Card.Section>
            </Card>
        </Flex>
    );
};

export default UpdateSociety;