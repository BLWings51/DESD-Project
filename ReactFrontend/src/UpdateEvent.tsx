import { useForm } from "@mantine/form";
import {
    Button,
    TextInput,
    Textarea,
    Loader,
    Card,
    Flex,
    Title,
    Alert,
    Group
} from "@mantine/core";
import { DateTimePicker } from '@mantine/dates';
import apiRequest from "./api/apiRequest";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { IconCalendar } from "@tabler/icons-react";

interface EventData {
    id: number;
    name: string;
    details: string;
    startTime: string;
    endTime: string;
    location: string;
    status: string;
}

const UpdateEvent = () => {
    const { society_name, eventID } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<Omit<EventData, 'id' | 'status'>>({
        initialValues: {
            name: '',
            details: '',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Default 1 hour duration
            location: '',
        },
        validate: {
            name: (value) => (value.length < 3 ? 'Name must be at least 3 characters' : null),
            location: (value) => (value.length < 2 ? 'Location must be at least 2 characters' : null),
            details: (value) => (value.length < 10 ? 'Details should be at least 10 characters' : null),
        },
    });

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                // First get all events for the society
                const allEventsResponse = await apiRequest<EventData[]>({
                    endpoint: `/Societies/${society_name}/Events/`,
                    method: 'GET',
                });

                if (allEventsResponse.data) {
                    // Find the specific event by ID
                    const foundEvent = allEventsResponse.data.find(e => e.id.toString() === eventID);
                    if (foundEvent) {
                        form.setValues({
                            name: foundEvent.name,
                            details: foundEvent.details,
                            startTime: foundEvent.startTime,
                            endTime: foundEvent.endTime,
                            location: foundEvent.location,
                        });
                    } else {
                        setError("Event not found");
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load event");
            } finally {
                setInitialLoading(false);
            }
        };

        fetchEvent();
    }, [society_name, eventID]);

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest({
                endpoint: `/Societies/${society_name}/Events/${eventID}/`,
                method: 'PUT',
                data: {
                    ...values,
                    // Ensure dates are properly formatted
                    startTime: new Date(values.startTime).toISOString(),
                    endTime: new Date(values.endTime).toISOString(),
                },
            });

            if (response.error) {
                throw new Error(response.message || "Failed to update event");
            }

            navigate(`/Societies/${society_name}/Events/${eventID}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update event");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Loader size="xl" />
            </Flex>
        );
    }

    if (error) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Alert color="red" title="Error" w={400}>
                    {error}
                </Alert>
            </Flex>
        );
    }

    return (
        <Flex justify="center" align="center" h="100vh" direction="column">
            <Card p={50} withBorder radius="lg" w={500}>
                <Card.Section p="md">
                    <Title order={2}>Update Event</Title>
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
                            label="Details"
                            variant="filled"
                            radius="md"
                            placeholder="Event Details"
                            {...form.getInputProps('details')}
                            required
                            minRows={4}
                            mb="sm"
                        />

                        <Group grow mb="sm">
                            <DateTimePicker
                                label="Start Time"
                                variant="filled"
                                radius="md"
                                value={new Date(form.values.startTime)}
                                onChange={(date) => date && form.setFieldValue('startTime', date.toISOString())}
                                required
                                withAsterisk
                            />

                            <DateTimePicker
                                label="End Time"
                                variant="filled"
                                radius="md"
                                value={new Date(form.values.endTime)}
                                onChange={(date) => date && form.setFieldValue('endTime', date.toISOString())}
                                minDate={new Date(form.values.startTime)}
                                required
                                withAsterisk
                            />
                        </Group>

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
                            Update Event
                        </Button>
                    </form>
                </Card.Section>
            </Card>
        </Flex>
    );
};

export default UpdateEvent;