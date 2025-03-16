import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiRequest, { saveTokensToLocalStorage } from "./api/auth";
import "./App.css";
import { Card, Flex, Title, TextInput, Button } from '@mantine/core';

interface SignUpResponse {
    access: string; // Access token
    refresh: string; // Refresh token
}

async function signUpUser(email: string, password: string): Promise<SignUpResponse | null> {
    const response = await apiRequest<SignUpResponse>({
        endpoint: "/signup/", // Update this endpoint to match your backend
        method: "POST",
        data: { email, password },
    });

    if (response.error || !response.data) {
        console.error("Signup failed:", response.message);
        throw new Error(response.message || "Signup failed");
    }

    console.log("Signup successful, tokens received:", response.data);
    return response.data; // Return both tokens
}

interface SignUpProps {
    setAuth: (authToken: string) => void;
    setRefresh: (refreshToken: string) => void;
}

const SignUp: React.FC<SignUpProps> = ({ setAuth, setRefresh }) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSignUp = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        try {
            const response = await signUpUser(email, password);

            if (!response) {
                setError("Signup failed. Please try again.");
            } else {
                // Save tokens to local storage using the utility function
                saveTokensToLocalStorage(response.access, response.refresh);

                console.log("Access Token:", response.access); // Debugging line
                console.log("Refresh Token:", response.refresh); // Debugging line

                // Update state with tokens
                setAuth(response.access);
                setRefresh(response.refresh);

                alert("Signup successful!");
                navigate("/home");
            }
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message); // Show precise error message
            } else {
                setError("An unexpected error occurred.");
            }
            console.error("Signup error:", error);
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
                        <Button color="secondary.5" mt={"md"} type="submit">Sign Up</Button>
                    </form>
                </Card.Section>
            </Card>
        </Flex>
    );
};

export default SignUp;