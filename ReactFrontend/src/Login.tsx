import { useState, useEffect } from "react";
import { useAuth } from './authContext';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Flex, Title, TextInput, Button, Text, Alert } from "@mantine/core";

import Sidebar from "./Sidebar";

import "./static/stylesheet.css";

// import styles from "./static/login.module.css";

const Login = () => {
  const [accountID, setAccountID] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const {
    login,
    isAuthenticated,
    isLoading: authLoading
  } = useAuth();

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
  
    try {
      await login(accountID, password);
      // No need to navigate — useEffect handles it
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);  // Use message from backend
      } else {
        setError("Login failed");
      }
    }
  };
  

  return (


    <Flex justify="center" align="center" h="90vh" direction="column">
        <Card p={50} withBorder radius="lg" w={400}>
          <Card.Section p="md">
          <Flex justify="center" align="center">
      <Title order={2}>Login</Title>
    </Flex>
        </Card.Section>

        <Card.Section p="md">
          {error && (
            <Alert color="red" mb="md">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              mb="md"
            />

            <Button
              fullWidth
              color="blue"
              type="submit"
              loading={authLoading}
              disabled={authLoading}
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