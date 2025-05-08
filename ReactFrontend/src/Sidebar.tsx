import React, { ReactNode } from "react";
import {
  Box,
  Flex,
  NavLink,
  Text,
  Stack,
  Burger,
  Drawer,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  children: ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const [opened, { toggle, close }] = useDisclosure(false);
  const location = useLocation();

  const links = (
    <Stack gap="sm" mt="xl">
      <NavLink
        label="Home"
        component={Link}
        to="/home"
        active={location.pathname === "/home"}
        onClick={close}
        styles={{
          label: { fontSize: '1.2rem', padding: '12px 0' },
        }}
      />

      <NavLink
        label="Societies"
        component={Link}
        to="/Societies"
        active={location.pathname.startsWith("/Societies")}
        onClick={close}
        styles={{
          label: { fontSize: '1.2rem', padding: '12px 0' },
        }}
      />
      <NavLink
        label="Events"
        component={Link}
        to="/events"
        active={location.pathname === "/events"}
        onClick={close}
        styles={{
          label: { fontSize: '1.2rem', padding: '12px 0' },
        }}
      />
      <NavLink
        label="Notifications"
        component={Link}
        to="/notifications"
        active={location.pathname === "/notifications"}
        onClick={close}
        styles={{
          label: { fontSize: '1.2rem', padding: '12px 0' },
        }}
      />
      <NavLink
        label="Profile"
        component={Link}
        to="/profile"
        active={location.pathname === "/profile"}
        onClick={close}
        styles={{
          label: { fontSize: '1.2rem', padding: '12px 0' },
        }}
      />
    </Stack>
  );

  return (
    <>
      <Flex>
        {/* Sidebar for desktop */}
        <Box
          w={250}
          h="100vh"
          p="md"
          visibleFrom="sm"
          style={{
            position: "fixed",
            top: 80,
            left: 0,
            borderRight: "1px solid #333",
            zIndex: 100,
          }}
        >
          {links}
        </Box>

        {/* Main Content */}
        <Box
          p="lg"
          style={{ flex: 1, minHeight: "100vh", overflowX: "hidden" }}
        >
          {children}
        </Box>
      </Flex>

      {/* Drawer for mobile */}
      <Drawer
        opened={opened}
        onClose={close}
        title="Menu"
        padding="md"
        size={250}
        withCloseButton
        hiddenFrom="sm"
      >
        {links}
      </Drawer>

      {/* Mobile Burger Button */}
      <Box
        visibleFrom="base"
        hiddenFrom="sm"
        style={{
          position: "fixed",
          left: 16,
          bottom: 16,
          zIndex: 1000,
        }}
      >
        <Burger
          opened={opened}
          onClick={toggle}
          aria-label="Toggle sidebar"
          styles={{ root: { backgroundColor: "#111", borderRadius: 8, padding: 6 } }}
        />
      </Box>
    </>
  );
};

export default Sidebar;
