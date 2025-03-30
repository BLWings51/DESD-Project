import { useForm } from "@mantine/form";
import { Button, TextInput, Textarea, Loader, Card, Flex, Title, Alert, Text } from "@mantine/core";
import { DateTimePicker } from '@mantine/dates';
import apiRequest from "./api/apiRequest";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import 'dayjs/locale/en-gb';

interface SocietyInfo {
    name: string;
    description: string;
    numOfInterestedPeople: number;
}

const CreateEvent = () => {
    const { society_name } = useParams<{ society_name: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [societyLoading, setSocietyLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [societyInfo, setSocietyInfo] = useState<SocietyInfo | null>(null);

    const form = useForm({
        initialValues: {
            name: '',
            details: '',
            startTime: new Date(Date.now() + 3600000),
            endTime: new Date(Date.now() + 7200000), // 1 hour later by default
            location: '',
        },
        validate: {
            name: (value) => (value.length < 3 ? 'Name must be at least 3 characters' : null),
            startTime: (value, values) => (value >= values.endTime ? 'Start time must be before end time' : null),
            endTime: (value, values) => (value <= values.startTime ? 'End time must be after start time' : null),
        },
    });

    // Fetch society info using the number (society_name in URL)
    useEffect(() => {
        const fetchSocietyInfo = async () => {
            try {
                const response = await apiRequest<SocietyInfo>({
                    endpoint: `/Societies/${society_name}/`,
                    method: 'GET',
                });
                setSocietyInfo(response.data || null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load society information");
            } finally {
                setSocietyLoading(false);
            }
        };

        fetchSocietyInfo();
    }, [society_name]);

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        setError(null);

        try {
            // Use the actual society name from the fetched info for the endpoint
            const response = await apiRequest({
                endpoint: `/Societies/${societyInfo?.name}/CreateEvent/`,
                method: 'POST',
                data: {
                    name: values.name,
                    details: values.details,
                    startTime: values.startTime.toISOString(),
                    endTime: values.endTime.toISOString(),
                    location: values.location,
                },
            });

            if (response.error) {
                throw new Error(response.message || "Failed to create event");
            }

            // Navigate back using the society number (original param)
            navigate(`/Societies/${society_name}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create event");
        } finally {
            setLoading(false);
        }
    };

    if (societyLoading) {
        return <Loader size="xl" />;
    }

    if (!societyInfo) {
        return <Text>Society not found</Text>;
    }

    return (
        <Flex justify="center" align="center" h="100vh" direction="column">
            <Card p={50} withBorder radius="lg" w={400}>
                <Card.Section p="md">
                    <Title order={2}>Create Event for {societyInfo.name}</Title>
                </Card.Section>

                <Card.Section p="md">
                    {error && (
                        <Alert color="red" mb="md">
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <TextInput
                            label="Event Name"
                            variant="filled"
                            radius="md"
                            placeholder="Event Name"
                            {...form.getInputProps('name')}
                            required
                            autoComplete="off"
                            mb="sm"
                        />

                        <Textarea
                            label="Description"
                            variant="filled"
                            radius="md"
                            placeholder="Event Description"
                            {...form.getInputProps('details')}
                            required
                            minRows={4}
                            mb="sm"
                        />

                        <DateTimePicker
                            label="Start Time"
                            variant="filled"
                            radius="md"
                            valueFormat="DD MMM YYYY hh:mm A"
                            {...form.getInputProps('startTime')}
                            required
                            mb="sm"
                            clearable={false}
                        />

                        <DateTimePicker
                            label="End Time"
                            variant="filled"
                            radius="md"
                            valueFormat="DD MMM YYYY hh:mm A"
                            {...form.getInputProps('endTime')}
                            required
                            mb="md"
                            clearable={false}
                            minDate={new Date(form.values.startTime.getTime() + 60000)} // 1 minute after start
                        />

                        <TextInput
                            label="Location"
                            variant="filled"
                            radius="md"
                            placeholder="Event Location"
                            {...form.getInputProps('location')}
                            required
                            mb="md"
                        />

                        <Button
                            fullWidth
                            color="blue"
                            type="submit"
                            loading={loading}
                            disabled={loading}
                        >
                            Create Event
                        </Button>
                    </form>
                </Card.Section>
            </Card>
        </Flex>
    );
};

export default CreateEvent;