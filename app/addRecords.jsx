import {
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
	TextInput,
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { CustomHeader } from "@/components/headers";
import { db } from "@/firebase";
import {
	collection,
	addDoc,
	serverTimestamp,
	setDoc,
	doc,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Image as CompressImage } from "react-native-compressor";

/* ---------------- CONFIG ---------------- */

const BACKEND_URL = "http://10.203.174.221:8000/api/upload-document";

/* ---------------- SCREEN ---------------- */

export default function addRecords() {
	const [title, setTitle] = useState("");
	const [type, setType] = useState("Prescription");

	const [file, setFile] = useState(null);
	const [preview, setPreview] = useState(null);

	const [loading, setLoading] = useState(false);

	/* ---------------- IMAGE PICKER ---------------- */

	const pickImage = async () => {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (!permission.granted) {
			Alert.alert("Permission required");
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 1,
		});

		if (!result.canceled) {
			const asset = result.assets[0];

			setFile({
				uri: asset.uri,
				name: asset.fileName || "image.jpg",
				type: "image/jpeg",
			});

			setPreview(asset.uri);
		}
	};

	/* ---------------- PDF PICKER ---------------- */

	const pickPDF = async () => {
		const result = await DocumentPicker.getDocumentAsync({
			type: "application/pdf",
		});

		if (!result.canceled) {
			const asset = result.assets[0];

			setFile({
				uri: asset.uri,
				name: asset.name,
				type: "application/pdf",
			});

			setPreview(null);
		}
	};

	/* ---------------- COMPRESS IMAGE ---------------- */

	const compressIfNeeded = async (file) => {
		if (!file.type.includes("image")) return file;

		const compressedUri = await CompressImage.compress(file.uri, {
			compressionMethod: "auto",
		});

		return {
			...file,
			uri: compressedUri,
		};
	};

	/* ---------------- UPLOAD DOCUMENT ---------------- */

	const { user } = useAuth();

	const uploadRecord = async () => {
		if (!file || !title) {
			Alert.alert("Missing fields", "Add title and file");
			return;
		}

		try {
			setLoading(true);

			const compressed = await compressIfNeeded(file);

			const formData = new FormData();

			formData.append("file", {
				uri: compressed.uri,
				name: compressed.name,
				type: compressed.type,
			});

			formData.append("type", type);
			formData.append("title", title);

			const res = await fetch(BACKEND_URL, {
				method: "POST",
				body: formData,
			});

			const data = await res.json();
			console.log("BACKEND RESPONSE:", data);

			if (!res.ok || !data.file_url) {
				throw new Error(data?.error || "Upload failed");
			}

			/* ---------------- NORMALIZE FUNCTION ---------------- */

			const normalizeMetric = (name) => {
				const map = {
					hemoglobin: "hemoglobin",
					"blood sugar": "blood_sugar",
					glucose: "blood_sugar",
					"blood pressure": "blood_pressure",
					cholesterol: "total_cholesterol",
					"total cholesterol": "total_cholesterol",
					ldl: "ldl",
					hdl: "hdl",
					triglycerides: "triglycerides",
					"heart rate": "heart_rate",
					spo2: "oxygen",
					oxygen: "oxygen",
					bmi: "bmi",
					creatinine: "creatinine",
					hba1c: "hba1c",
					"uric acid": "uric_acid",
					"vitamin d": "vitamin_d",
					"vitamin b12": "vitamin_b12",
					tsh: "tsh",
					"tsh (thyroid)": "tsh",
				};

				const key = name.toLowerCase().trim();
				return map[key] || key.replace(/\s+/g, "_");
			};

			/* ---------------- SAVE DOCUMENT ---------------- */

			const docRef = await addDoc(
				collection(db, "users", user.uid, "documents"),
				{
					title,
					type: (data.type || type)?.trim().toLowerCase().replace(/\s+/g, "_"),
					file_url: data.file_url,
					summary: data.summary,
					important_notes: data.important_notes || [],
					created_at: serverTimestamp(),
				},
			);

			/* ---------------- SAVE HEALTH METRICS ---------------- */

			if (data.health_metrics?.length) {
				for (const metric of data.health_metrics) {
					const metricId = normalizeMetric(metric.name);

					await setDoc(
						doc(db, "users", user.uid, "health_metrics", metricId),
						{
							type: "metric",
							name: metric.name,

							value: metric.value ?? null,
							unit: metric.unit ?? null,
							status: metric.status ?? "unknown",

							source: "lab_report",

							document_id: docRef.id, // 🔥 link to report

							recorded_at: serverTimestamp(),
							updated_at: serverTimestamp(),
						},
						{ merge: true },
					);
				}
			}

			Alert.alert("Success", "Document uploaded and analyzed");

			router.replace("/(tabs)/records");
		} catch (err) {
			console.error(err);
			Alert.alert("Error", err.message || "Upload failed");
		} finally {
			setLoading(false);
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
							title="Add Records"
							onBack={() => {
								if (router.canGoBack()) router.back();
								else router.replace("/(tabs)/records");
							}}
						/>
					),
				}}
			/>

			<SafeAreaView style={styles.container}>
				<ScrollView>
					{/* TITLE */}

					<Text style={styles.label}>Document Title</Text>

					<TextInput
						style={styles.input}
						value={title}
						onChangeText={setTitle}
						placeholder="Eg: Blood Test Report"
					/>

					{/* TYPE */}

					<Text style={styles.label}>Document Type</Text>

					<View style={styles.row}>
						{["Prescription", "Lab Report", "Medical Bill"].map((t) => (
							<TouchableOpacity
								key={t}
								style={[styles.typeBtn, type === t && styles.activeType]}
								onPress={() => setType(t)}
							>
								<Text style={styles.typeText}>{t}</Text>
							</TouchableOpacity>
						))}
					</View>

					{/* FILE PICKERS */}

					<TouchableOpacity style={styles.button} onPress={pickImage}>
						<Text style={styles.btnText}>Upload Image</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.button} onPress={pickPDF}>
						<Text style={styles.btnText}>Upload PDF</Text>
					</TouchableOpacity>

					{/* PREVIEW */}

					{preview && (
						<Image source={{ uri: preview }} style={styles.preview} />
					)}

					{/* UPLOAD BUTTON */}

					<TouchableOpacity
						style={styles.uploadBtn}
						onPress={uploadRecord}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.uploadText}>Upload Record</Text>
						)}
					</TouchableOpacity>
				</ScrollView>
			</SafeAreaView>
		</>
	);
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},

	label: {
		fontSize: 16,
		fontWeight: "600",
		marginTop: 10,
	},

	input: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 10,
		padding: 12,
		marginTop: 6,
	},

	row: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 10,
	},

	typeBtn: {
		padding: 10,
		borderWidth: 1,
		borderRadius: 10,
		marginRight: 8,
		marginBottom: 8,
	},

	activeType: {
		backgroundColor: "#0095b6",
	},

	typeText: {
		color: "#000",
	},

	button: {
		padding: 14,
		backgroundColor: "#eee",
		borderRadius: 10,
		marginTop: 12,
	},

	btnText: {
		textAlign: "center",
	},

	preview: {
		height: 200,
		marginTop: 20,
		borderRadius: 12,
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
