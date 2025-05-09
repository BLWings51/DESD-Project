import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import apiRequest from "./api/apiRequest";
import {
    Container,
    TextInput,
    Button,
    Card,
    Text,
    Group,
    Stack,
    Loader,
    ActionIcon,
    Flex,
    Badge,
} from "@mantine/core";
// import { IconSend, IconTrash } from "@tabler/icons-react";
import { Icon } from '@iconify/react';
import trash from '@iconify-icons/tabler/trash';
import send from '@iconify-icons/tabler/send';
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

interface ChatMessage {
    id: number;
    text: string;
    firstName: string;
    lastName: string;
    is_owner: boolean;
}

const ChatPage = () => {
    const { society_name, eventID } = useParams();
    const { isAuthenticated, loggedAccountID } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chatEnded, setChatEnded] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [eventStatus, setEventStatus] = useState<string>("");
    const [eventStartTime, setEventStartTime] = useState<string>("");

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const checkChatStatus = async () => {
            try {
                const response = await apiRequest<boolean>({
                    endpoint: `/${eventID}/hasChatEnded/`,
                    method: "GET",
                });
                if (!response.error) {
                    setChatEnded(response.data.data || false);
                    console.log("chat status response:", response);
                    console.log("data from response: ", response.data.data)
                }
            } catch (err) {
                console.error("Failed to check chat status:", err);
            }
        };

        const fetchEventDetails = async () => {
            try {
                const response = await apiRequest<{ status: string; startTime: string }>({
                    endpoint: `/Societies/${society_name}/${eventID}/`,
                    method: "GET",
                });
                if (!response.error && response.data) {
                    setEventStatus(response.data.status);
                    setEventStartTime(response.data.startTime);
                }
            } catch (err) {
                console.error("Failed to fetch event details:", err);
            }
        };

        const checkAdminStatus = async () => {
            if (!isAuthenticated || !loggedAccountID) return;
            try {
                const response = await apiRequest<{ adminStatus: boolean }>({
                    endpoint: `/Profile/${loggedAccountID}/`,
                    method: "GET",
                });
                if (!response.error && response.data) {
                    setIsAdmin(response.data.adminStatus);
                }
            } catch (err) {
                console.error("Failed to check admin status:", err);
            }
        };

        checkChatStatus();
        fetchEventDetails();
        checkAdminStatus();
    }, [society_name, eventID, isAuthenticated, loggedAccountID]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await apiRequest<ChatMessage[]>({
                    endpoint: `/${eventID}/liveChat/`,
                    method: "GET",
                });
                if (!response.error && response.data) {
                    setMessages(response.data);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load messages");
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [society_name, eventID]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        try {
            const response = await apiRequest({
                endpoint: `/${eventID}/liveChat/talk/`,
                method: "POST",
                data: { message: newMessage },
            });

            if (!response.error) {
                setNewMessage("");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send message");
        }
    };

    const handleEndChat = async () => {
        try {
            const response = await apiRequest({
                endpoint: `/Societies/${society_name}/Events/${eventID}/liveChat/sendFinalMessage/`,
                method: "POST",
            });

            if (!response.error) {
                setChatEnded(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to end chat");
        }
    };

    const handleDeleteMessage = async (messageId: number) => {
        try {
            const response = await apiRequest({
                endpoint: `/${society_name}/${eventID}/liveChat/${messageId}/delete/`,
                method: "DELETE",
            });

            if (!response.error) {
                setMessages(messages.filter(msg => msg.id !== messageId));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete message");
        }
    };

    const canChat = () => {
        if (!isAuthenticated) return false;
        const now = new Date();
        const startTime = new Date(eventStartTime);
        return now >= startTime && !chatEnded;
    };

    if (loading) {
        return <Loader size="xl" />;
    }

    if (error) {
        return <Text color="red">{error}</Text>;
    }

    return (
        <>
            <Sidebar>
                <Flex justify="center" align="flex-start" gap="md" px="md">
                    <div style={{ width: "200px" }} />
                    <Container size="xl" py="md" style={{ flex: 1, maxWidth: "900px" }}>
                        <Card shadow="sm" p="lg" radius="md" withBorder>
                            <Stack>
                                <Group justify="space-between">
                                    <Text size="xl" fw={500}>Event Chat</Text>
                                    <Badge color={chatEnded ? "red" : "green"}>
                                        {chatEnded ? "Chat Ended" : "Live Chat"}
                                    </Badge>
                                </Group>

                                <Card withBorder p="md" style={{ height: "500px", overflowY: "auto" }}>
                                    {messages.length === 0 ? (
                                        <Text c="dimmed" ta="center" mt="md">
                                            {chatEnded ? "Chat Ended" : "No messages yet"}
                                        </Text>
                                    ) : (
                                        messages.map((message) => (
                                            <Card
                                                key={message.id}
                                                p="xs"
                                                mb="xs"
                                                style={{
                                                    backgroundColor: message.is_owner ? "#e3f2fd" : "#f5f5f5",
                                                    marginLeft: message.is_owner ? "auto" : "0",
                                                    marginRight: message.is_owner ? "0" : "auto",
                                                    maxWidth: "80%",
                                                }}
                                            >
                                                <Group justify="space-between" mb="xs">
                                                    <Text size="sm" fw={500}>
                                                        {message.firstName} {message.lastName}
                                                    </Text>
                                                    {isAdmin && (
                                                        <ActionIcon
                                                            color="red"
                                                            onClick={() => handleDeleteMessage(message.id)}
                                                        >
                                                            <Icon icon={trash} width={16} height={16} />
                                                        </ActionIcon>
                                                    )}
                                                </Group>
                                                <Text>{message.text}</Text>
                                            </Card>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </Card>

                                {canChat() && (
                                    <Group>
                                        <TextInput
                                            placeholder="Type your message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            style={{ flex: 1 }}
                                            onKeyPress={(e) => {
                                                if (e.key === "Enter") {
                                                    handleSendMessage();
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={handleSendMessage}
                                            leftSection={<Icon icon={send} width={16} height={16} />}
                                        >
                                            Send
                                        </Button>
                                    </Group>
                                )}

                                {isAdmin && !chatEnded && (
                                    <Button
                                        color="red"
                                        onClick={handleEndChat}
                                        style={{ alignSelf: "flex-end" }}
                                    >
                                        End Chat
                                    </Button>
                                )}
                            </Stack>
                        </Card>
                    </Container>
                    <div style={{ width: "200px" }} />
                </Flex>
            </Sidebar>
            <RightSidebar />
        </>
    );
};

export default ChatPage; 