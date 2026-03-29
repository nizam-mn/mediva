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
import { useAuth } from "@/contexts/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import Groq from "groq-sdk";
import { router, Stack } from "expo-router";
import { CustomHeader } from "@/components/headers";
import { uploadToImageKit } from "../utils/upload";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";

/* ---------------- CONFIG ---------------- */

const groq = new Groq({
	apiKey: process.env.EXPO_PUBLIC_GROQ_API,
	dangerouslyAllowBrowser: true,
});

/* ---------------- HELPER ---------------- */

const imageToBase64 = async (uri) => {
	const response = await fetch(uri);
	const blob = await response.blob();

	return await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			const base64data = reader.result.split(",")[1];
			resolve(base64data);
		};
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
};

/* ---------------- SCREEN ---------------- */

export default function PrescriptionAnalyzer() {
	const [image, setImage] = useState(null);
	const [analysis, setAnalysis] = useState(null);
	const [medicineDetails, setMedicineDetails] = useState([]);
	const [loading, setLoading] = useState(false);

	const { user } = useAuth();

	/* ---------------- IMAGE PICKER ---------------- */

	const pickImage = async (fromCamera = false) => {
		if (Platform.OS === "web") {
			Alert.alert("Not supported", "Feature not supported on web");
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
			? await ImagePicker.launchCameraAsync({ quality: 0.8 })
			: await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

		if (!result.canceled) {
			setImage(result.assets[0].uri);
			setAnalysis(null);
			setMedicineDetails([]);
		}
	};

	/* ---------------- MEDICINE EXPLAINER ---------------- */

	const fetchMedicineDetails = async (medicines) => {
		const completion = await groq.chat.completions.create({
			model: "llama-3.3-70b-versatile",
			temperature: 0,
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content: `
You are a pharmacist AI.

Explain medicines in simple terms.

Rules:
- Do NOT give medical advice
- Only explain medicine information
- Be concise
`,
				},
				{
					role: "user",
					content: `
Give information about these medicines:

${medicines.join(", ")}

Return JSON:

{
 "medicines":[
  {
   "name":"",
   "use":"",
   "how_it_works":"",
   "side_effects":"",
   "precautions":""
  }
 ]
}
`,
				},
			],
		});

		return JSON.parse(completion.choices[0].message.content);
	};

	/* ---------------- PRESCRIPTION ANALYSIS ---------------- */

	const analyzePrescription = async () => {
		if (!image) return;

		try {
			setLoading(true);

			const base64 = await imageToBase64(image);

			const completion = await groq.chat.completions.create({
				model: "meta-llama/llama-4-scout-17b-16e-instruct",
				temperature: 0,
				response_format: { type: "json_object" },

				messages: [
					{
						role: "system",
						content: `
You are a medical prescription analyzer.

Extract structured data from prescriptions.

Understand abbreviations:

OD = once daily
BD = twice daily
TDS = three times daily
SOS = when required
HS = before sleep
1-0-1 = morning & night
0-1-0 = afternoon
1-1-1 = morning afternoon night

Return JSON only.
`,
					},
					{
						role: "user",
						content: [
							{
								type: "text",
								text: `
Analyze this prescription.

Return:

{
 "medicines":[
  {
   "name":string|null,
   "dosage":string|null,
   "frequency":string|null,
   "duration":string|null,
   "instructions":string|null
  }
 ],
 "doctor_notes":string|null,
 "warnings":string|null,
 "confidence":number
}
`,
							},
							{
								type: "image_url",
								image_url: {
									url: `data:image/jpeg;base64,${base64}`,
								},
							},
						],
					},
				],
			});

			const parsed = JSON.parse(completion.choices[0].message.content);

			setAnalysis(parsed);

			const names = parsed.medicines?.map((m) => m.name).filter(Boolean);

			if (names.length) {
				const details = await fetchMedicineDetails(names);
				setMedicineDetails(details.medicines);
			}
		} catch (err) {
			console.error(err);
			Alert.alert("Failed", "Could not analyze prescription");
		} finally {
			setLoading(false);
		}
	};

	/* ------------------ saving to firebase------------- */

	const handleSavePrescription = async (parsed, medicineDetails) => {
		try {
			// 1️⃣ Upload image
			const uploadedUrl = await uploadToImageKit(
				{ uri: image, mimeType: "image/jpeg" },
				user.uid,
				"prescriptions",
			);

			if (!uploadedUrl) {
				throw new Error("Image upload failed");
			}

			// 2️⃣ Clean data (🔥 IMPORTANT)
			const safeAnalysis = JSON.parse(JSON.stringify(parsed));
			const safeMedicineDetails = JSON.parse(
				JSON.stringify(medicineDetails || []),
			);

			// 3️⃣ Save to Firestore
			await addDoc(collection(db, "users", user.uid, "documents"), {
				title: "Prescription",
				type: "prescription",

				file_url: uploadedUrl,

				// 🔥 AI extracted structured data
				analysis: safeAnalysis,

				// 🔥 Medicine explanation data
				medicine_details: safeMedicineDetails,

				created_at: serverTimestamp(),
			});

			Alert.alert("Saved", "Prescription saved successfully");
		} catch (err) {
			console.error(err);
			Alert.alert("Error", "Failed to save prescription");
		}
	};

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
								if (router.canGoBack()) router.back();
								else router.replace("index");
							}}
						/>
					),
				}}
			/>

			<ScrollView contentContainerStyle={styles.container}>
				<View style={styles.row}>
					<TouchableOpacity
						style={styles.action}
						onPress={() => pickImage(true)}
					>
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
					<TouchableOpacity
						style={styles.primaryBtn}
						onPress={analyzePrescription}
					>
						<Text style={styles.primaryText}>Analyze Prescription</Text>
					</TouchableOpacity>
				)}

				{loading && <ActivityIndicator size="large" />}

				{/* Prescription Result */}

				{analysis && (
					<View style={styles.card}>
						<Text style={styles.section}>Prescription</Text>

						{analysis.medicines?.map((m, i) => (
							<View key={i} style={styles.med}>
								<Text style={styles.bold}>{m.name}</Text>
								<Text>Dosage: {m.dosage}</Text>
								<Text>Frequency: {m.frequency}</Text>
								<Text>Duration: {m.duration}</Text>
								<Text>{m.instructions}</Text>
							</View>
						))}

						{!!analysis.doctor_notes && (
							<Text>Notes: {analysis.doctor_notes}</Text>
						)}

						{!!analysis.warnings && (
							<Text style={{ color: "red" }}>
								Warnings: {analysis.warnings}
							</Text>
						)}
					</View>
				)}

				{/* Medicine Explanation */}

				{medicineDetails.length > 0 && (
					<View style={styles.card}>
						<Text style={styles.section}>Medicine Information</Text>

						{medicineDetails.map((m, i) => (
							<View key={i} style={styles.med}>
								<Text style={styles.bold}>{m.name}</Text>
								<Text>Use: {m.use}</Text>
								<Text>How it works: {m.how_it_works}</Text>
								<Text>Side effects: {m.side_effects}</Text>
								<Text>Precautions: {m.precautions}</Text>
							</View>
						))}
					</View>
				)}

				{analysis && (
					<TouchableOpacity
						style={styles.uploadBtn}
						onPress={() => handleSavePrescription(analysis, medicineDetails)}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.uploadText}>Save</Text>
						)}
					</TouchableOpacity>
				)}
			</ScrollView>
		</>
	);
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
	container: { padding: 20 },

	row: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 20,
	},

	action: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		padding: 10,
		borderWidth: 1,
		borderRadius: 10,
	},

	preview: {
		width: "100%",
		height: 250,
		borderRadius: 12,
		marginBottom: 20,
	},

	primaryBtn: {
		backgroundColor: "#0095b6",
		padding: 14,
		borderRadius: 10,
		alignItems: "center",
		marginBottom: 20,
	},

	primaryText: {
		color: "#fff",
		fontWeight: "600",
	},

	card: {
		padding: 16,
		borderRadius: 12,
		backgroundColor: "#f5f5f5",
		marginBottom: 20,
	},

	section: {
		fontWeight: "700",
		marginBottom: 10,
		fontSize: 16,
	},

	med: {
		marginBottom: 12,
	},

	bold: {
		fontWeight: "700",
		fontSize: 15,
	},

	uploadBtn: {
		marginTop: 30,
		backgroundColor: "#0095b6",
		padding: 16,
		borderRadius: 12,
	},

	uploadText: {
		color: "#fff",
		textAlign: "center",
		fontWeight: "600",
	},
});
