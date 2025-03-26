import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiRequest from "./api/apiRequest"; // Ensure this uses `credentials: "include"`
import "./App.css";
import { Card, Flex, Title, TextInput, Button } from "@mantine/core";

const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const response = await apiRequest<{ message: string }>({
      endpoint: "/login/",
      method: "POST",
      data: { email, password },
    });

    if (response.error) {
      setError("Invalid email or password");
    } else {
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
              Login
            </Button>
          </form>
        </Card.Section>
      </Card>
    </Flex>
  );
};

export default Login;
