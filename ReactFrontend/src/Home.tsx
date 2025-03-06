import "./App.css";
import { Stack, Group, Grid, Center } from '@mantine/core';
import CustomNavbar from "./Navbar"

const Home: React.FC = () => {
  return (
    <>
      <CustomNavbar />
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
