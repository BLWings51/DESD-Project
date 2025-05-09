import { useForm } from "@mantine/form";
import { Button, TextInput, Textarea, Loader, Card, Flex, Title, Alert, Image, Group } from "@mantine/core";
import apiRequest from "./api/apiRequest";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import TagDropdown from "./components/TagDropdown";

interface SocietyData {
    name: string;
    description: string;
    pfp: string;
    interests: string[];
}

const UpdateSociety = () => {
    const { society_name } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pfpFile, setPfpFile] = useState<File | null>(null);
    const [isUploadingPfp, setIsUploadingPfp] = useState(false);

    const form = useForm<SocietyData>({
        initialValues: {
            name: '',
            description: '',
            pfp: '',
            interests: [],
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
                        pfp: response.data.pfp,
                        interests: response.data.interests || [],
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
            // First update the society details
            const response = await apiRequest<{ message: string }>({
                endpoint: `/Societies/${society_name}/UpdateSociety/`,
                method: 'POST',
                data: {
                    name: values.name,
                    description: values.description,
                    interests: values.interests,
                },
            });

            if (response.error) {
                throw new Error(response.message || "Failed to update society");
            }

            // If there's a new profile picture, upload it
            if (pfpFile) {
                setIsUploadingPfp(true);
                const formData = new FormData();
                formData.append('pfp', pfpFile);

                await apiRequest({
                    endpoint: `/Societies/${values.name}/update_pfp/`,
                    method: 'POST',
                    data: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            }

            navigate(`/Societies/${values.name}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update society");
        } finally {
            setLoading(false);
            setIsUploadingPfp(false);
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
                        <Flex direction="column" align="center" mb="md">
                            <Image
                                src={form.values.pfp}
                                width={100}
                                height={100}
                                radius="md"
                                alt="Current profile picture"
                                fallbackSrc="https://placehold.co/100x100?text=No+Image"
                                mb="sm"
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setPfpFile(e.target.files?.[0] || null)}
                                style={{ display: 'none' }}
                                id="pfp-upload"
                            />
                            <label htmlFor="pfp-upload">
                                <Button
                                    component="span"
                                    variant="outline"
                                    size="sm"
                                    loading={isUploadingPfp}
                                    disabled={loading}
                                >
                                    Change Profile Picture
                                </Button>
                            </label>
                        </Flex>

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

                        <TagDropdown
                            label="Interest Tags"
                            placeholder="Select interest tags"
                            value={form.values.interests}
                            onChange={(tags) => form.setFieldValue('interests', tags)}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="default"
                                onClick={() => navigate(`/Societies/${society_name}`)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={loading || isUploadingPfp}
                                disabled={loading || isUploadingPfp}
                            >
                                Update Society
                            </Button>
                        </Group>
                    </form>
                </Card.Section>
            </Card>
        </Flex>
    );
};

export default UpdateSociety;