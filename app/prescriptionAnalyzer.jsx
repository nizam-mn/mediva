import { useState } from "react";
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	ScrollView,
	ActivityIndicator,
	Alert,
    Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import { Feather } from "@expo/vector-icons";
import Groq from "groq-sdk";
import { router, Stack } from "expo-router";
import { CustomHeader } from "@/components/headers";

// /* ---------------- CONFIG ---------------- */

const groq = new Groq({
	apiKey: process.env.EXPO_PUBLIC_GROQ_API,
    dangerouslyAllowBrowser: true 
});

/* ---------------- SCREEN ---------------- */

export default function PrescriptionAnalyzer() {
	const [image, setImage] = useState(null);
	const [ocrText, setOcrText] = useState("");
	const [analysis, setAnalysis] = useState(null);
	const [loading, setLoading] = useState(false);

	/* ---------------- IMAGE PICKER ---------------- */

	const pickImage = async (fromCamera = false) => {
		if (Platform.OS === "web") {
			Alert.alert("Not supported", "OCR is not supported on web");
			return;
		}

		const permission = fromCamera
			? await ImagePicker.requestCameraPermissionsAsync()
			: await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (!permission.granted) {
			Alert.alert("Permission required");
			return;
		}

		const result = fromCamera
			? await ImagePicker.launchCameraAsync({ quality: 1 })
			: await ImagePicker.launchImageLibraryAsync({ quality: 1 });

		if (!result.canceled) {
			setImage(result.assets[0].uri);
			setOcrText("");
			setAnalysis(null);
		}
	};

	/* ---------------- OCR ---------------- */

	const runOCRAndAnalyze = async () => {
		if (!image) return;

		try {
			setLoading(true);

			const ocrResult = await TextRecognition.recognize(image);

			if (!ocrResult?.text || ocrResult.text.trim().length < 10) {
				throw new Error("Text not readable");
			}

			setOcrText(ocrResult.text);
			await analyzeWithGroq(ocrResult.text);
		} catch (err) {
			console.error(err);
			Alert.alert("Failed", "Could not read prescription clearly");
		} finally {
			setLoading(false);
		}
	};

    const safeJsonParse = (text) => {
	try {
		// remove any text before first {
		const start = text.indexOf("{");
		const end = text.lastIndexOf("}");

		if (start === -1 || end === -1) return null;

		const jsonString = text.slice(start, end + 1);
		return JSON.parse(jsonString);
	} catch (e) {
		console.warn("JSON parse failed:", text);
		return null;
	}
};


	/* ---------------- AI ANALYSIS ---------------- */

const analyzeWithGroq = async (text) => {
	const completion = await groq.chat.completions.create({
		model: "llama-3.3-70b-versatile",
		temperature: 0,
		messages: [
			{
				role: "system",
				content: `
You are a medical prescription extraction engine.

Rules:
- Output MUST be valid JSON
- NO markdown
- NO explanations
- NO backticks
- If data is unclear, use null
- If nothing found, return empty arrays
- Confidence must be a number (0–100)
`,
			},
			{
				role: "user",
				content: `
Extract structured data from this OCR text.
The text may be handwritten and noisy.

OCR TEXT:
${text}

Return EXACTLY this JSON shape:

{
  "medicines": [
    {
      "name": string | null,
      "dosage": string | null,
      "frequency": string | null,
      "duration": string | null
    }
  ],
  "doctor_notes": string | null,
  "warnings": string | null,
  "confidence": number
}
`,
			},
		],
	});

	const raw = completion.choices[0].message.content;

	const parsed = safeJsonParse(raw);
	if (!parsed) {
		throw new Error("AI returned invalid JSON");
	}

	setAnalysis(parsed);
};

    console.log(analysis)
	/* ---------------- UI ---------------- */

	return (
        <>
        <Stack.Screen
				options={{
					headerShown: true,
					header: () => (
						<CustomHeader
							title="Prescription Analyzer"
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
		<ScrollView contentContainerStyle={styles.container}>

			<View style={styles.row}>
				<TouchableOpacity style={styles.action} onPress={() => pickImage(true)}>
					<Feather name="camera" size={18} />
					<Text>Camera</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.action}
					onPress={() => pickImage(false)}
				>
					<Feather name="image" size={18} />
					<Text>Gallery</Text>
				</TouchableOpacity>
			</View>

			{image && <Image source={{ uri: image }} style={styles.preview} />}

			{image && !loading && (
				<TouchableOpacity style={styles.primaryBtn} onPress={runOCRAndAnalyze}>
					<Text style={styles.primaryText}>Analyze Prescription</Text>
				</TouchableOpacity>
			)}

			{loading && <ActivityIndicator size="large" />}

			{!!ocrText && (
				<View style={styles.card}>
					<Text style={styles.section}>Extracted Text</Text>
					<Text style={styles.mono}>{ocrText}</Text>
				</View>
			)}

			{analysis && (
				<View style={styles.card}>
					<Text style={styles.section}>Analysis</Text>

					{analysis.medicines?.map((m, i) => (
						<View key={i} style={styles.med}>
							<Text style={styles.bold}>{m.name}</Text>
							<Text>{m.dosage}</Text>
							<Text>{m.frequency}</Text>
							<Text>{m.duration}</Text>
						</View>
					))}

					{!!analysis.doctor_notes && (
						<Text>Notes: {analysis.doctor_notes}</Text>
					)}

					{!!analysis.warnings && (
						<Text style={{ color: "red" }}>Warnings: {analysis.warnings}</Text>
					)}

					<Text>Confidence: {analysis.confidence}%</Text>
				</View>
			)}
		</ScrollView>
        </>
	);
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
	container: {
		padding: 16,
		backgroundColor: "#fff",
	},
	title: {
		fontSize: 22,
		fontWeight: "600",
		marginBottom: 16,
	},
	row: {
		flexDirection: "row",
		gap: 12,
		marginBottom: 12,
	},
	action: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		padding: 10,
		borderWidth: 1,
		borderRadius: 8,
	},
	preview: {
		height: 240,
		borderRadius: 12,
		marginVertical: 12,
	},
	primaryBtn: {
		backgroundColor: "#0095b6",
		padding: 14,
		borderRadius: 10,
		alignItems: "center",
	},
	primaryText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	card: {
		marginTop: 16,
		padding: 14,
		borderWidth: 1,
		borderRadius: 10,
		borderColor: "#eee",
	},
	section: {
		fontWeight: "600",
		marginBottom: 8,
	},
	mono: {
		fontSize: 13,
		color: "#333",
	},
	med: {
		marginBottom: 8,
	},
	bold: {
		fontWeight: "600",
	},
});
