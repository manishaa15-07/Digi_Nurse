import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from "react-native";
import axios from "axios";

import { API_BASE_URL } from "../../config/api";

const TYPING_ID = "TYPING_INDICATOR_TEMP";
const API_URL = `${API_BASE_URL}/dialogflow`;

interface Message {
    id: string;
    sender: "user" | "bot";
    text: string;
}

const TypingIndicator = () => (
    <View style={styles.typingContainer}>
        <View style={styles.typingDot} />
        <View style={[styles.typingDot, { opacity: 0.7 }]} />
        <View style={[styles.typingDot, { opacity: 0.4 }]} />
    </View>
);

const MessageBubble: React.FC<{ item: Message }> = ({ item }) => {
    const isUser = item.sender === "user";
    if (item.id === TYPING_ID) {
        return (
            <View style={styles.messageContainer}>
                <TypingIndicator />
            </View>
        );
    }

    return (
        <View
            style={[
                styles.messageContainer,
                isUser ? styles.userMessageContainer : styles.botMessageContainer,
            ]}
        >
            <View
                style={[
                    styles.messageBubble,
                    isUser ? styles.userMessage : styles.botMessage,
                ]}
            >
                <Text
                    style={[
                        styles.messageText,
                        isUser ? styles.userMessageText : styles.botMessageText,
                    ]}
                >
                    {item.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                </Text>
            </View>
        </View>
    );
};

const ChatScreen = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            sender: "bot",
            text: "Namaste, I'm your DigiNurse Assistant, How can I help you today?",
        },
    ]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<ScrollView | null>(null);

    const isTyping = messages.some((msg) => msg.id === TYPING_ID);

    const [isInputFocused, setIsInputFocused] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollToEnd({ animated: true });
    };

    useEffect(scrollToBottom, [messages]);

    const sendMessage = async () => {
        const currentInput = input.trim();
        if (!currentInput || isTyping) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            sender: "user",
            text: currentInput,
        };
        const typingMessage: Message = {
            id: TYPING_ID,
            sender: "bot",
            text: "...",
        };

        setMessages((prev) => [...prev, userMessage, typingMessage]);
        setInput("");

        try {
            const response = await axios.post(API_URL, {
                message: currentInput,
                sessionId: "user-123",
            });
            const botReply = (response.data as { reply: string }).reply;

            setMessages((prev) => {
                const updatedMessages = prev.filter((msg) => msg.id !== TYPING_ID);
                return [
                    ...updatedMessages,
                    { id: Date.now().toString(), sender: "bot", text: botReply },
                ];
            });
        } catch (error: any) {
            setMessages((prev) => {
                const updatedMessages = prev.filter((msg) => msg.id !== TYPING_ID);
                return [
                    ...updatedMessages,
                    {
                        id: Date.now().toString(),
                        sender: "bot",
                        text: `⚠️ Connection failed. Please check your server.`,
                    },
                ];
            });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>DigiNurse Chat Assistant</Text>

            <ScrollView
                style={styles.messagesContainer}
                ref={messagesEndRef}
                keyboardShouldPersistTaps="handled"
            >
                {messages.map((item) => (
                    <MessageBubble key={item.id} item={item} />
                ))}
            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[
                            styles.textInput,
                            isInputFocused && styles.textInputFocused,
                        ]}
                        value={input}
                        onChangeText={setInput}
                        placeholder={isTyping ? "Please wait..." : "Type your message..."}
                        editable={!isTyping}
                        returnKeyType="send"
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        onSubmitEditing={() => {
                            sendMessage();
                            Keyboard.dismiss();
                        }}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !input.trim() || isTyping
                                ? styles.sendButtonDisabled
                                : styles.sendButtonEnabled,
                        ]}
                        onPress={() => {
                            sendMessage();
                            Keyboard.dismiss();
                        }}
                        disabled={!input.trim() || isTyping}
                    >
                        <Text style={styles.sendButtonText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        padding: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
        color: "#0077B6",
        marginBottom: 16,
        marginTop: 8,
    },
    messagesContainer: {
        flex: 1,
        backgroundColor: "#F9F9F9",
        borderRadius: 8,
        padding: 8,
        marginBottom: 10,
    },
    messageContainer: {
        marginVertical: 8,
    },
    userMessageContainer: {
        alignItems: "flex-end",
    },
    botMessageContainer: {
        alignItems: "flex-start",
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        maxWidth: "80%",
    },
    userMessage: {
        backgroundColor: "#90CFEF",
        borderBottomRightRadius: 4,
    },
    botMessage: {
        backgroundColor: "#EBF9FC",
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userMessageText: {
        color: "#000000",
    },
    botMessageText: {
        color: "#000000",
    },
    typingContainer: {
        flexDirection: "row",
        backgroundColor: "#EBF9FC",
        padding: 8,
        borderRadius: 16,
        width: 60,
        justifyContent: "space-between",
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#90CFEF",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 8,
        paddingBottom: 8,
    },
    textInput: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: "#0077B6",
        borderRadius: 24,
        paddingHorizontal: 18,
        backgroundColor: "#FFFFFF",
        fontSize: 15,
        marginRight: 10,
    },
    textInputFocused: {
        borderColor: "#00B4D8",
        backgroundColor: "#F0F8FF",
        borderWidth: 2,
    },
    sendButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
    },
    sendButtonEnabled: {
        backgroundColor: "#0077B6",
    },
    sendButtonDisabled: {
        backgroundColor: "#CBD5E1",
    },
    sendButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 15,
    },
});

export default ChatScreen;
