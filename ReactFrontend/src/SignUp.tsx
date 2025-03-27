import { useState, useEffect } from "react";
import { useAuth } from './authContext';
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import apiRequest from "./api/apiRequest"; // Ensure `apiRequest.ts` uses `credentials: "include"`
import "./App.css";
import { Card, Flex, Title, TextInput, Button, Text } from "@mantine/core";

const SignUp = () => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/home');
        }
    }, [isAuthenticated, navigate]);

    const handleSignUp = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        const response = await apiRequest<{ message: string }>({
            endpoint: "/signup/",
            method: "POST",
            data: { email, password },
        });

        if (response.error) {
            setError(response.message || "Signup failed. Please try again.");
        } else {
            login(email, password);

        }
    };

    return (
        <Flex justify={"center"} align={"center"} h={"100vh"} direction={"column"}>
            <Card p={50} bd={"2px solid gray.6"} radius={"lg"}>
                <Card.Section>
                    <Title>Sign Up</Title>
                </Card.Section>

                <Card.Section mt={"lg"}>
                    <form onSubmit={handleSignUp}>
                        <TextInput
                            variant="filled"
                            radius={"md"}
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <TextInput
                            mt={"xs"}
                            variant="filled"
                            radius={"md"}
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {error && <p className="error">{error}</p>}
                        <Button color="secondary.5" mt={"md"} type="submit">
                            Sign Up
                        </Button>
                    </form>
                </Card.Section>
                <Card.Section mt={"md"}>
                    <Text>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
                            Sign up here
                        </Link>
                    </Text>
                </Card.Section>
            </Card>
        </Flex>
    );
};

export default SignUp;
