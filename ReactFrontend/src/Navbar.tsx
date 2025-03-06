import { Container, Group, Button, Text, Paper } from '@mantine/core';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {

    return (
        <Paper shadow="sm" p="md" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <Container fluid>
                <Group justify='space-between'>
                    {/* Logo or Title */}
                    <Text size="xl">UWEhub</Text>

                    {/* Desktop Navbar Links */}
                    <Group gap="lg" className="desktop-links">
                        <Button color='var(--mantine-color-secondary-5)' variant="subtle" component={Link} to="/home">Home</Button>
                        <Button variant="subtle" component={Link} to="/">Login</Button>
                        <Button variant="subtle" component={Link} to="/signUp">Sign Up</Button>
                        <Button variant="subtle">Contact</Button>
                    </Group>

                </Group>
            </Container>
        </Paper>
    );
};

export default Navbar;
