import { useState, useEffect } from "react";
import { useAuth } from './authContext'; // Make sure path is correct
import { Link, useNavigate } from 'react-router-dom';
import "./App.css";
import { Card, Flex, Title, TextInput, Button, Text, Alert } from "@mantine/core";
import CustomNavbar from "./Navbar"

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      // No need to navigate here - the useEffect will handle it
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (

    <>

      <Flex justify={"center"} align={"center"} h={"90vh"} direction={"column"}>
      <Card w={550} h={400} p={50} bd={"2px solid gray.6"} radius={"lg"} style={{ backgroundColor: 'var(--mantine-color-primary-6)' }}>
        
        
      <Card.Section style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Title style={{ color: 'var(--mantine-color-secondary-1)', fontSize: "32px" }}>Login</Title>
      </Card.Section>

        <Card.Section p="md">
          {error && (
            <Alert color="red" mb="md">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
          <TextInput

          mb="xl" // Adds margin-bottom to create space
          mt = "lg"
          variant="filled"
          radius={"md"}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}


          styles={{
            input: {
              
              backgroundColor: 'var(--mantine-color-primary-8)', // Background color
              border: "2px solid rgb(255, 255, 255)", // Border color
              padding: "24px", // Padding inside input box
              fontSize: "16px", // Font size
            },
          }}

          />

          <TextInput

            mb="xl" // Adds margin-bottom to create space
            mt = "xl"
            variant="filled"
            radius={"md"}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}


            styles={{
              input: {
                backgroundColor: 'var(--mantine-color-primary-8)', // Background color
                border: "2px solid rgb(255, 255, 255)", // Border color
                padding: "24px", // Padding inside input box
                fontSize: "16px", // Font size
              },
            }}
            />

          <Card.Section style={{ textAlign: "center" }}>
            <Button
              color= "tertiary.8"
              type="submit"
              loading={isLoading}
            >
              Login
            </Button>

            </Card.Section>
          </form>
        </Card.Section>

        <Card.Section p="md" ta="center">
          <Text size="sm">
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--mantine-color-blue-6)' }}>
              Sign up here
            </Link>
          </Text>
        </Card.Section>
      </Card>
    </Flex>


    </>

  );
};

export default Login;



///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

import { useState, useEffect } from "react";
import { useAuth } from './authContext'; // Make sure path is correct
import { Link, useNavigate } from 'react-router-dom';
import "./App.css";
import { Card, Flex, Title, TextInput, Button, Text, Alert } from "@mantine/core";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      // No need to navigate here - the useEffect will handle it
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex justify="center" align="center" h="100vh" direction="column">
      <Card p={50} withBorder radius="lg" w={400}>
        <Card.Section p="md">
          <Title order={2}>Login</Title>
        </Card.Section>

        <Card.Section p="md">
          {error && (
            <Alert color="red" mb="md">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextInput
              label="Email"
              variant="filled"
              radius="md"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              autoComplete="current-password"
              mb="md"
            />

            <Button
              fullWidth
              color="blue"
              type="submit"
              loading={isLoading}
            >
              Login
            </Button>
          </form>
        </Card.Section>

        <Card.Section p="md" ta="center">
          <Text size="sm">
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--mantine-color-blue-6)' }}>
              Sign up here
            </Link>
          </Text>
        </Card.Section>
      </Card>
    </Flex>
  );
};

export default Login;