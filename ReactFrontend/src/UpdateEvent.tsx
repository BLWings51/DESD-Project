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
    Group,
    Switch,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import apiRequest from "./api/apiRequest";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

interface EventData {
    id: number;
    name: string;
    details: string;
    startTime: string;
    endTime: string;
    location: string;
    status: string;
    online: boolean;
}

const UpdateEvent = () => {
    const { society_name, eventID } = useParams<{ society_name: string; eventID: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const form = useForm({
        initialValues: {
            name: "",
            details: "",
            startTime: new Date(),
            endTime: new Date(),
            location: "",
            online: false,
        },
        validate: {
            name: (v) => (v.length < 3 ? "Name must be at least 3 characters" : null),
            details: (v) => (v.length < 10 ? "Details should be at least 10 characters" : null),
            location: (v) => (v.length < 2 ? "Location must be at least 2 characters" : null),
            startTime: (v, vals) =>
                v >= vals.endTime ? "Start time must be before end time" : null,
            endTime: (v, vals) =>
                v <= vals.startTime ? "End time must be after start time" : null,
        },
    });

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const resp = await apiRequest<EventData[]>({
                    endpoint: `/Societies/${society_name}/Events/`,
                    method: "GET",
                });
                if (resp.data) {
                    const found = resp.data.find((e) => e.id.toString() === eventID);
                    if (found) {
                        form.setValues({
                            name: found.name,
                            details: found.details,
                            startTime: new Date(found.startTime),
                            endTime: new Date(found.endTime),
                            location: found.location,
                            online: found.online,
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [society_name, eventID]);

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest({
                endpoint: `/Societies/${society_name}/${eventID}/UpdateEvent/`,
                method: "POST",  // use POST against your custom UpdateEvent view
                data: {
                    ...values,
                    startTime: values.startTime.toISOString(),
                    endTime: values.endTime.toISOString(),
                },
            });
            if (response.error) {
                throw new Error(response.message || "Failed to update event");
            }
            // on success, navigate back to the event detail page
            navigate(`/Societies/${society_name}/${eventID}`);
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
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <TextInput
                            label="Event Name"
                            {...form.getInputProps("name")}
                            required
                            mb="sm"
                        />
                        <Textarea
                            label="Details"
                            {...form.getInputProps("details")}
                            required
                            minRows={4}
                            mb="sm"
                        />
                        <Group grow mb="sm">
                            <DateTimePicker
                                label="Start Time"
                                value={form.values.startTime}
                                onChange={(d) => d && form.setFieldValue("startTime", d)}
                                required
                                withAsterisk
                            />
                            <DateTimePicker
                                label="End Time"
                                value={form.values.endTime}
                                onChange={(d) => d && form.setFieldValue("endTime", d)}
                                required
                                withAsterisk
                            />
                        </Group>
                        <TextInput
                            label="Location"
                            {...form.getInputProps("location")}
                            required
                            mb="sm"
                        />
                        <Switch
                            label="Online Event"
                            {...form.getInputProps("online", { type: "checkbox" })}
                            mb="md"
                        />
                        <Button type="submit" loading={loading} fullWidth>
                            Update Event
                        </Button>
                    </form>
                </Card.Section>
            </Card>
        </Flex>
    );
};

export default UpdateEvent;
