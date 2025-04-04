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

interface SidebarProps {
  children: ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  const [opened, { toggle, close }] = useDisclosure(false);

  const links = (
    <Stack gap="sm" mt="xl"> {/* Add top margin to push down a bit */}
      <NavLink
        label="Home"
        onClick={close}
        styles={{
          label: { fontSize: '1.2rem', padding: '12px 0' },
        }}
      />
      <NavLink
        label="Explore"
        onClick={close}
        styles={{
          label: { fontSize: '1.2rem', padding: '12px 0' },
        }}
      />
      <NavLink
        label="Societies"
        onClick={close}
        styles={{
          label: { fontSize: '1.2rem', padding: '12px 0' },
        }}
      />
      <NavLink
        label="Events"
        onClick={close}
        styles={{
          label: { fontSize: '1.2rem', padding: '12px 0' },
        }}
      />
      <NavLink
        label="Profile"
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
                position: "fixed",            // 🔒 sidebar stays in place
                top: 80,
                left: 0,
                borderRight: "1px solid #333",
                zIndex: 100,                  // makes sure it's above main content
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
