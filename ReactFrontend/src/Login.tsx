import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiRequest from "./api/auth";
import "./App.css";

import { Card, Flex, Container, Grid, Group, Center, Title, TextInput, Button } from '@mantine/core';

interface LoginProps {
  setAuth: (authToken: string) => void;
  setRefresh: (refreshToken: string) => void;
}

interface LoginResponse {
  authToken: string;
  refreshToken: string;
}

async function loginUser(username: string, password: string) {
  const response = await apiRequest<LoginResponse>({
    endpoint: "/login/",
    method: "POST",
    data: { username, password },
  });

  if (response.error) {
    console.error("Login failed:", response.message);
    return null;
  }

  console.log("Login successful, tokens received:", response.data);
  return response.data; // Return both tokens
}

const Login: React.FC<LoginProps> = ({ setAuth, setRefresh }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const response = await loginUser(email, password);

    if (!response) {
      setError("Invalid username or password");
    } else {
      setAuth(response.authToken);
      setRefresh(response.refreshToken);

      localStorage.setItem("authToken", response.authToken);
      localStorage.setItem("refreshToken", response.refreshToken);

      alert("Login successful!");
      navigate("/home");
    }
  };


  return (
    <Flex justify={"center"} align={"center"} h={"100vh"} direction={"column"}>
      <Card p={50} bd={"2px solid gray.6"} radius={"lg"}>

        <Card.Section>
          <Title>Login</Title>
        </Card.Section>

        <Card.Section mt={"lg"}>

          <form onSubmit={handleLogin}>
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
