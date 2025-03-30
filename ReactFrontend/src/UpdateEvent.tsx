import { useForm } from "@mantine/form";
import { Button, TextInput, Textarea } from "@mantine/core";
import { DateTimePicker } from '@mantine/dates';
import apiRequest from "./api/apiRequest";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

interface EventData {
    name: string;
    description: string;
    date: string;
    location: string;
}

const UpdateEvent = () => {
    const { society_name, eventID } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<EventData>({
        initialValues: {
            name: '',
            description: '',
            date: new Date().toISOString(),
            location: '',
        },
        validate: {
            name: (value) => (value.length < 3 ? 'Name must be at least 3 characters' : null),
        },
    });

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await apiRequest<EventData>({
                    endpoint: `/Societies/${society_name}/${eventID}/`,
                    method: 'GET',
                });
                if (response.data) {
                    form.setValues({
                        name: response.data.name,
                        description: response.data.description,
                        date: response.data.date,
                        location: response.data.location,
                    });
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load event");
            }
        };

        fetchEvent();
    }, [society_name, eventID]);

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        setError(null);

        try {
            await apiRequest({
                endpoint: `/Societies/${society_name}/${eventID}/`,
                method: 'PUT',
                data: {
                    ...values,
                    date: new Date(values.date).toISOString(),
                },
            });

            navigate(`/Societies/${society_name}/${eventID}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update event");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Update Event</h1>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <TextInput
                    label="Event Name"
                    {...form.getInputProps('name')}
                    required
                />
                <Textarea
                    label="Description"
                    {...form.getInputProps('description')}
                    required
                    minRows={4}
                />
                <DateTimePicker
                    label="Date and Time"
                    value={new Date(form.values.date)}
                    onChange={(date) => date && form.setFieldValue('date', date.toISOString())}
                    required
                />
                <TextInput
                    label="Location"
                    {...form.getInputProps('location')}
                    required
                />
                {error && <div style={{ color: 'red' }}>{error}</div>}
                <Button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Event'}
                </Button>
            </form>
        </div>
    );
};

export default UpdateEvent;