import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "./api/auth";
import "./App.css";

import { Card, Flex, Container, Grid, Group, Center, Title, TextInput, Button } from '@mantine/core';

interface LoginProps {
  setAuth: (auth: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setAuth }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loginCall = async (event: React.FormEvent) => {
  event.preventDefault();
  setError(null);

  try {
    const response = await loginUser(email, password);
    if (!(response.status==200)) {
      const errorData = response;
      throw new Error(errorData.message || "Login failed");
    };

    const data = response;

    // Store tokens
    console.log(data)
    console.log(data.access)
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);

    alert("Login successful!");
    setAuth(true);
    navigate("/home");
  } catch (error) {
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError("An unexpected error occurred.");
    }
  }
};



  return (
    <Flex justify={"center"} align={"center"} h={"100vh"} direction={"column"}>
      <Card p={50} bd={"2px solid gray.6"} radius={"lg"}>

        <Card.Section>
          <Title>Login</Title>
        </Card.Section>

        <Card.Section mt={"lg"}>

          <form onSubmit={loginCall}>
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
            <Button color="secondary.5" mt={"md"} type="submit">Login</Button>
          </form>
        </Card.Section>
      </Card>
    </Flex>
  );
};

export default Login;
