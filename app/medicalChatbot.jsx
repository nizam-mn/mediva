import { useState, useRef } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
} from "react-native";
import Groq from "groq-sdk";
import { Feather } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { CustomHeader } from "@/components/headers";
import InterText from "@/components/InterText";

/* ---------------- CONFIG ---------------- */

const groq = new Groq({
	apiKey: process.env.EXPO_PUBLIC_GROQ_API,
    dangerouslyAllowBrowser: true 
});

/* ---------------- SYSTEM PROMPT ---------------- */

const SYSTEM_PROMPT = `
You are Mediva, a medical and health information assistant.

IMPORTANT ROLE DEFINITION:
- You provide GENERAL health information only.
- You are NOT a doctor.
- You must NEVER diagnose diseases.
- You must NEVER prescribe medicines.
- You must NEVER suggest medication dosages.
- You must NEVER override professional medical advice.

SCOPE CONTROL (VERY IMPORTANT):
- ONLY answer questions related to:
  - Health
  - Medical conditions (high-level explanation only)
  - Symptoms (educational, not diagnostic)
  - Medicines (what they are generally used for, NOT dosage)
  - Lifestyle, diet, exercise, mental well-being
- If the question is NOT related to medical or health topics:
  - Politely refuse and say:
    "I can only help with health and medical-related questions."

SAFETY RULES:
- Be conservative and factual.
- Do NOT hallucinate facts.
- If information is unclear or insufficient, say:
  "I am not sure based on the information provided."
- If symptoms sound serious or urgent (e.g. chest pain, severe bleeding, loss of consciousness):
  - Clearly advise seeking immediate medical attention.
- Always encourage consulting a qualified healthcare professional when appropriate.

ANSWER STYLE:
- Keep answers clear, calm, and easy to understand.
- Use simple language (no heavy medical jargon).
- Use short paragraphs or bullet points when helpful.
- Do NOT be verbose.
- Do NOT be alarmist unless necessary.

MANDATORY DISCLAIMER:
- End EVERY response with a short disclaimer such as:
  "This information is for educational purposes only and does not replace professional medical advice."

OUTPUT FORMAT:
- Plain text only.
- No markdown.
- No emojis.
- No role-play.
`;


/* ---------------- SCREEN ---------------- */

export default function MedicalChatbot() {
	const [messages, setMessages] = useState([
		{
			id: "system-welcome",
			role: "assistant",
			content:
				"Hi 👋 I’m Dr.Medu. I can help explain health topics and symptoms. I can’t diagnose or prescribe, but I’ll guide you safely.",
		},
	]);

	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const listRef = useRef(null);

	/* ---------------- SEND MESSAGE ---------------- */

	const sendMessage = async () => {
		if (!input.trim() || loading) return;

		const userMessage = {
			id: Date.now().toString(),
			role: "user",
			content: input.trim(),
		};

		const updatedMessages = [...messages, userMessage];
		setMessages(updatedMessages);
		setInput("");
		setLoading(true);

		try {
			const completion = await groq.chat.completions.create({
				model: "llama-3.3-70b-versatile",
				temperature: 0.2,
				messages: [
					{ role: "system", content: SYSTEM_PROMPT },
					...updatedMessages.map((m) => ({
						role: m.role,
						content: m.content,
					})),
				],
			});

			const reply = completion.choices?.[0]?.message?.content;

			if (!reply) throw new Error("No response");

			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString() + "-ai",
					role: "assistant",
					content: reply.trim(),
				},
			]);
		} catch (e) {
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString() + "-error",
					role: "assistant",
					content:
						"⚠️ Sorry, I couldn’t respond right now. Please try again.",
				},
			]);
		} finally {
			setLoading(false);
			setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
		}
	};

	/* ---------------- RENDER ---------------- */

	const renderItem = ({ item }) => {
		const isUser = item.role === "user";

		return (
			<View
				style={[
					styles.message,
					isUser ? styles.userMsg : styles.aiMsg,
				]}
			>
				<InterText style={[styles.msgText, isUser && {color: "#ffffff"}]}>{item.content}</InterText>
			</View>
		);
	};

	return (
        <>
        <Stack.Screen
				options={{
					headerShown: true,
					header: () => (
						<CustomHeader
							title="Dr. Medu"
							onBack={() => {
								if (router.canGoBack()) {
									router.back();
								} else {
									router.replace("index");
								}
							}}
						/>
					),
				}}
			/>
        
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<FlatList
				ref={listRef}
				data={messages}
				keyExtractor={(item) => item.id}
				renderItem={renderItem}
				contentContainerStyle={styles.chat}
			/>

			<View style={styles.inputBar}>
				<TextInput
					style={styles.input}
					placeholder="Ask about symptoms, health, medicine..."
					value={input}
					onChangeText={setInput}
                    placeholderTextColor={"#9e9e9e"}
					multiline
				/>

				<TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
					{loading ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Feather name="send" size={20} color="#fff" />
					)}
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
        </>
	);
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	chat: {
		padding: 16,
		paddingBottom: 40,
	},
	message: {
		maxWidth: "85%",
		padding: 12,
		borderRadius: 12,
		marginBottom: 10,
	},
	userMsg: {
		alignSelf: "flex-end",
		backgroundColor: "#0095b6",
	},
	aiMsg: {
		alignSelf: "flex-start",
		backgroundColor: "#f1f1f1",
        
	},
	msgText: {
		color: "#000",
		fontSize: 16,
	},
	inputBar: {
		flexDirection: "row",
		padding: 10,
		borderTopWidth: 1,
		borderColor: "#eee",
		alignItems: "flex-end",
	},
	input: {
		flex: 1,
		backgroundColor: "#f7f7f7",
		borderRadius: 12,
		padding: 16,
		maxHeight: 120,
	},
	sendBtn: {
		marginLeft: 8,
		backgroundColor: "#0095b6",
		borderRadius: 20,
		padding: 12,
		justifyContent: "center",
		alignItems: "center",
	},
});
