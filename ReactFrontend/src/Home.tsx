import "./App.css";
import { Stack, Group, Grid, Center } from '@mantine/core';

const Home: React.FC = () => {
  return (
    <>
      <Group justify="center" align="center">

        <Stack align="center">
          <h1>Welcome to the Home Page!</h1>
          <p>You are successfully logged in.</p>
        </Stack>
      </Group>
    </>

  );
};

export default Home;
