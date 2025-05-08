import { useState, useEffect } from "react";
import { useAuth } from './authContext';
import { Link, useNavigate } from 'react-router-dom';
import apiRequest from "./api/apiRequest";
import {
  Card,
  Flex,
  Title,
  TextInput,
  Button,
  Text,
  Alert,
  Loader,
} from "@mantine/core";

const SignUp = () => {
  const [formData, setFormData] = useState({
    accountID: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    // optional fields:
    address: "",
    course: "",
    dob: "",
    yearOfCourse: "",
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
      [name]: value,
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 0. Clear any existing tokens on the backend (deletes cookies)
      await apiRequest({ endpoint: "/logout/", method: "POST" });

      // 1. Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }

      // 2. Build sign-up payload, omitting blank optional fields
      const {
        confirmPassword,
        yearOfCourse,
        ...rest
      } = formData;
      const payload: Record<string, any> = { ...rest };

      if (yearOfCourse.trim() !== "") {
        payload.year_of_course = Number(yearOfCourse);
      }
      if (rest.dob.trim() === "") delete payload.dob;
      if (rest.address.trim() === "") delete payload.address;
      if (rest.course.trim() === "") delete payload.course;

      // 3. Create the new account
      const signupResp = await apiRequest<{ message: string }>({
        endpoint: "/signup/",
        method: "POST",
        data: payload,
      });
      if (signupResp.error) {
        throw new Error(signupResp.message || "Signup failed");
      }

      // 4. Auto-login the freshly created account
      await login(formData.accountID, formData.password);

      // 5. Redirect to home
      navigate('/home');
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
    <Flex justify="center" align="center" h="90vh" direction="column" px="md">
      <Card p="xl" withBorder radius="lg" w="100%" maw={600}>
        <Card.Section p="md">
          <Flex justify="center">
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
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              mb="sm"
            />

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
              mb="sm"
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
              mb="sm"
            />

            <TextInput
              label="Password"
              name="password"
              variant="filled"
              radius="md"
              type="password"
              placeholder="••••••••"
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
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              mb="md"
            />

            {/* Optional fields */}
            <TextInput
              label="Address (optional)"
              name="address"
              variant="filled"
              radius="md"
              placeholder="123 Main St"
              value={formData.address}
              onChange={handleChange}
              mb="sm"
            />

            <TextInput
              label="Course (optional)"
              name="course"
              variant="filled"
              radius="md"
              placeholder="Computer Science"
              value={formData.course}
              onChange={handleChange}
              mb="sm"
            />

            <TextInput
              label="Date of Birth (optional)"
              name="dob"
              variant="filled"
              radius="md"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              mb="sm"
            />

            <TextInput
              label="Year of Course (optional)"
              name="yearOfCourse"
              variant="filled"
              radius="md"
              type="number"
              placeholder="1, 2, 3..."
              value={formData.yearOfCourse}
              onChange={handleChange}
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
