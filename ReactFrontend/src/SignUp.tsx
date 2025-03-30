import { useState, useEffect } from "react";
import { useAuth } from './authContext';
import { Link, useNavigate } from 'react-router-dom';
import apiRequest from "./api/apiRequest";
import { Card, Flex, Title, TextInput, Button, Text, Alert, Loader } from "@mantine/core";

const SignUp = () => {
    const [accountID, setAccountID] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { login, isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/home');
        }
    }, [isAuthenticated, navigate]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // 1. First make the signup request
            const response = await apiRequest<{ message: string }>({
                endpoint: "/signup/",
                method: "POST",
                data: { accountID, password },
            });

            if (response.error) {
                throw new Error(response.message || "Signup failed");
            }

            // 2. If signup succeeds, automatically log the user in
            await login(accountID, password);

            // The useEffect will handle navigation when isAuthenticated changes

        } catch (err) {
            setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <Flex justify="center" align="center" h="100vh">
                <Loader size="xl" />
            </Flex>
        );
    }

    return (
        <Flex justify="center" align="center" h="100vh" direction="column">
            <Card p={50} withBorder radius="lg" w={400}>
                <Card.Section p="md">
                    <Title order={2}>Sign Up</Title>
                </Card.Section>

                <Card.Section p="md">
                    {error && (
                        <Alert color="red" mb="md">
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSignUp}>
                        <TextInput
                            label="Account ID"
                            variant="filled"
                            radius="md"
                            type="number"
                            placeholder="#000000"
                            value={accountID}
                            onChange={(e) => setAccountID(e.target.value)}
                            required
                            autoComplete="username"
                            mb="sm"
                        />

                        <TextInput
                            label="Password"
                            variant="filled"
                            radius="md"
                            type="password"
                            placeholder="Your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            mb="md"
                        />

                        <Button
                            fullWidth
                            color="blue"
                            type="submit"
                            loading={isLoading}
                            disabled={isLoading || authLoading}
                        >
                            Sign Up
                        </Button>
                    </form>
                </Card.Section>

                <Card.Section p="md" ta="center">
                    <Text size="sm">
                        Already have an account?{' '}
                        <Link to="/" style={{ color: 'var(--mantine-color-blue-6)' }}>
                            Login here
                        </Link>
                    </Text>
                </Card.Section>
            </Card>
        </Flex>
    );
};

export default SignUp;