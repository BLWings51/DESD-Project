import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUpUser } from "./api/auth";
import "./App.css";

import { Card, Flex, Container, Grid, Group, Center, Title, TextInput, Button } from '@mantine/core';

interface SignUpProps {
    setAuth: (auth: boolean) => void;
}

const SignUp: React.FC<SignUpProps> = ({ setAuth }) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const SignUpCall = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        try {
            const data = await signUpUser(email, password);
            alert("SignUp successful!");
            localStorage.setItem("authToken", data.token);
            setAuth(true);
            navigate("/home");
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message); // Show precise error message
            } else {
                setError("An unexpected error occurred.");
            }
            console.error("SignUp error:", error);
        }

        navigate("/home");
    };


    return (
        <Flex justify={"center"} align={"center"} h={"100vh"} direction={"column"}>
            <Card p={50} bd={"2px solid gray.6"} radius={"lg"}>

                <Card.Section>
                    <Title>SignUp</Title>
                </Card.Section>

                <Card.Section mt={"lg"}>

                    <form onSubmit={SignUpCall}>
                        <TextInput
                            variant="filled"
                            radius={"md"}
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextInput
                            mt={"xs"}
                            variant="filled"
                            radius={"md"}
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
