import { useState, useEffect } from "react";
import { useAuth } from './authContext';
import { Link, useNavigate } from 'react-router-dom';
import apiRequest from "./api/apiRequest";
import { Card, Flex, Title, TextInput, Button, Text, Alert, Loader } from "@mantine/core";

const SignUp = () => {
    const [formData, setFormData] = useState({
        accountID: "",
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: ""
    });
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            // Prepare data for API (excluding confirmPassword)
            const { confirmPassword, ...signupData } = formData;

            // 1. First make the signup request
            const response = await apiRequest<{ message: string }>({
                endpoint: "/signup/",
                method: "POST",
                data: signupData,
            });

            if (response.error) {
                throw new Error(response.message || "Signup failed");
            }

            // 2. If signup succeeds, automatically log the user in
            await login(formData.accountID, formData.password);

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
        <Flex
          justify="center"
          align="center"
          h="90vh"
          direction="column"
          px="md" // Add horizontal padding for mobile
        >
          <Card
            p="xl"
            withBorder
            radius="lg"
            w="100%"    // Responsive width
            maw={600}   // Max width on larger screens
          >
            <Card.Section p="md">
              <Flex justify="center" align="center">
                <Title order={2}>Sign Up</Title>
              </Flex>
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
                  name="accountID"
                  variant="filled"
                  radius="md"
                  type="number"
                  placeholder="#000000"
                  value={formData.accountID}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  mb="sm"
                />
      
                <TextInput
                  label="Email"
                  name="email"
                  variant="filled"
                  radius="md"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  mb="sm"
                />
      
                <Flex
                  gap="md"
                  mb="sm"
                  direction={{ base: 'column', sm: 'row' }} // Stack on small screens
                >
                  <TextInput
                    label="First Name"
                    name="firstName"
                    variant="filled"
                    radius="md"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    autoComplete="given-name"
                    style={{ flex: 1 }}
                  />
                  <TextInput
                    label="Last Name"
                    name="lastName"
                    variant="filled"
                    radius="md"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    autoComplete="family-name"
                    style={{ flex: 1 }}
                  />
                </Flex>
      
                <TextInput
                  label="Password"
                  name="password"
                  variant="filled"
                  radius="md"
                  type="password"
                  placeholder="Your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  mb="sm"
                />
      
                <TextInput
                  label="Confirm Password"
                  name="confirmPassword"
                  variant="filled"
                  radius="md"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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