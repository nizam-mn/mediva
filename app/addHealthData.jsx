import {
	View,
	// ReadexProText,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import ReadexProText from "@/components/ReadexProText";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { doc, setDoc } from "firebase/firestore";

import { CustomHeader } from "@/components/headers";

/* ---------------- CONFIG ---------------- */

const TYPES = ["Metric", "Condition", "Allergy"];

const METRICS = [
	{ name: "Hemoglobin", unit: "g/dL", low: 13, high: 17 },
	{ name: "Blood Sugar", unit: "mg/dL", low: 70, high: 140 },
	{ name: "Blood Pressure", unit: "mmHg", low: 90, high: 120 },

	{ name: "Total Cholesterol", unit: "mg/dL", low: 125, high: 200 },
	{ name: "LDL", unit: "mg/dL", low: 0, high: 130 },
	{ name: "HDL", unit: "mg/dL", low: 40, high: 100 },
	{ name: "Triglycerides", unit: "mg/dL", low: 0, high: 150 },

	{ name: "Heart Rate", unit: "bpm", low: 60, high: 100 },
	{ name: "Oxygen (SpO₂)", unit: "%", low: 95, high: 100 },

	{ name: "BMI", unit: "", low: 18.5, high: 24.9 },

	{ name: "Creatinine", unit: "mg/dL", low: 0.7, high: 1.3 },
	{ name: "HbA1c", unit: "%", low: 4, high: 5.7 },
	{ name: "Uric Acid", unit: "mg/dL", low: 3.5, high: 7.2 },

	{ name: "Vitamin D", unit: "ng/mL", low: 20, high: 50 },
	{ name: "Vitamin B12", unit: "pg/mL", low: 200, high: 900 },

	{ name: "TSH (Thyroid)", unit: "mIU/L", low: 0.4, high: 4.0 },
];

/* ---------------- HELPERS ---------------- */

const getStatus = (metric, value) => {
	if (!metric) return "unknown";
	if (value < metric.low) return "low";
	if (value > metric.high) return "high";
	return "normal";
};

/* ---------------- SCREEN ---------------- */

export default function AddHealthData() {
	const { user } = useAuth();

	const [type, setType] = useState("Metric");

	const [selectedMetric, setSelectedMetric] = useState(METRICS[0]);
	const [value, setValue] = useState("");

	const [input, setInput] = useState("");
	const [items, setItems] = useState([]);

	const [notes, setNotes] = useState("");
	const [loading, setLoading] = useState(false);

	/* ---------------- NORMALIZE METRIC ---------------- */

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

	/* ---------------- ADD ITEM ---------------- */

	const addItem = () => {
		if (!input.trim()) return;

		if (items.includes(input.trim())) {
			setInput("");
			return;
		}

		setItems([...items, input.trim()]);
		setInput("");
	};

	const removeItem = (index) => {
		setItems(items.filter((_, i) => i !== index));
	};

	/* ---------------- SAVE ---------------- */

	const handleSave = async () => {
		try {
			setLoading(true);

			if (type === "Metric") {
				if (!value) return Alert.alert("Enter value");

				const numericValue = parseFloat(value);
				if (isNaN(numericValue)) return Alert.alert("Invalid number");

				const status = getStatus(selectedMetric, numericValue);

				const metricId = normalizeMetric(selectedMetric.name);

				await setDoc(
					doc(db, "users", user.uid, "health_metrics", metricId),
					{
						type: "metric",
						name: selectedMetric.name,
						value: numericValue,
						unit: selectedMetric.unit,
						status,
						notes: notes || null,

						source: "manual",

						recorded_at: serverTimestamp(), // when user entered
						updated_at: serverTimestamp(), // last update
					},
					{ merge: true }
				);
			} else {
				if (!items.length) return Alert.alert(`Add at least one ${type}`);

				for (const item of items) {
					const id = normalizeMetric(item);

					await setDoc(
						doc(db, "users", user.uid, "health_metrics", id),
						{
							type: type.toLowerCase(), // allergy / condition
							name: item,
							notes: notes || null,

							source: "manual",

							recorded_at: serverTimestamp(),
							updated_at: serverTimestamp(),
						},
						{ merge: true }
					);
				}
			}

			Alert.alert("Saved successfully");

			// reset fields
			setValue("");
			setInput("");
			setItems([]);
			setNotes("");
		} catch (err) {
			console.error(err);
			Alert.alert("Failed to save");
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
							title="Add Health Data"
							onBack={() => router.back()}
						/>
					),
				}}
			/>

			<View style={styles.container}>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : "height"}
					// keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} - test later
					style={styles.keyboardView}
				>
					<ScrollView
						// contentContainerStyle={{ flexGrow: 1 }}
						keyboardShouldPersistTaps="handled"
					>
						<View style={styles.content}>
							{/* TYPE SELECT */}
							<ReadexProText weight="medium" style={styles.label}>Type</ReadexProText>

							<View style={styles.row}>
								{TYPES.map((t) => (
									<TouchableOpacity
										key={t}
										style={[
											styles.metricBtn,
											type === t && styles.activeMetric,
										]}
										onPress={() => {
											setType(t);
											setItems([]);
											setInput("");
										}}
									>
										<ReadexProText  style={[ styles.metricText, type === t && styles.activeMetrictext]} >{t}</ReadexProText>
									</TouchableOpacity>
								))}
							</View>

							{/* METRIC INPUT */}
							{type === "Metric" && (
								<>
									<ReadexProText weight="medium" style={styles.label}>Metric</ReadexProText>

									<View style={styles.row}>
										{METRICS.map((m) => (
											<TouchableOpacity
												key={m.name}
												style={[
													styles.metricBtn,
													selectedMetric.name === m.name && styles.activeMetric,
												]}
												onPress={() => setSelectedMetric(m)}
											>
												<ReadexProText style={[ styles.metricText, selectedMetric.name === m.name && styles.activeMetrictext]} >{m.name}</ReadexProText>
											</TouchableOpacity>
										))}
									</View>

									<ReadexProText weight="medium" style={styles.label}>
										Value ({selectedMetric.unit})
									</ReadexProText>

									<TextInput
										style={styles.input}
										keyboardType="numeric"
										value={value}
										onChangeText={setValue}
										placeholder="Enter value"
                                        placeholderTextColor={"#878787"}
									/>

									{value ? (
										<ReadexProText style={styles.status}>
											Status:{" "}
											{getStatus(
												selectedMetric,
												parseFloat(value) || 0,
											).toUpperCase()}
										</ReadexProText>
									) : null}
								</>
							)}

							{/* CONDITION / ALLERGY */}
							{type !== "Metric" && (
								<>
									<ReadexProText weight="medium" style={styles.label}>{type}s</ReadexProText>

									<View style={styles.inputRow}>
										<TextInput
											style={[styles.input, {flex: 1}]}
											value={input}
											onChangeText={setInput}
											placeholder={`Add ${type.toLowerCase()}`}
                                            placeholderTextColor={"#878787"}
										/>

										<TouchableOpacity
											style={styles.addSmallBtn}
											onPress={addItem}
										>
											<ReadexProText style={{ color: "#fff" }}>
												Add
											</ReadexProText>
										</TouchableOpacity>
									</View>

									<View style={styles.pillContainer}>
										{items.map((item, index) => (
											<View key={index} style={styles.pill}>
												<ReadexProText style={styles.pillText}>
													{item}
												</ReadexProText>

												<TouchableOpacity onPress={() => removeItem(index)}>
													<ReadexProText style={styles.remove}>✕</ReadexProText>
												</TouchableOpacity>
											</View>
										))}
									</View>
								</>
							)}

							{/* NOTES */}
							<ReadexProText weight="medium" style={styles.label}>
								Notes (optional)
							</ReadexProText>

							<TextInput
								style={[styles.input, { height: 90 }]}
								value={notes}
                                placeholderTextColor={"#878787"}
								onChangeText={setNotes}
								placeholder="Optional notes"
								multiline
							/>

							{/* SAVE */}
							<TouchableOpacity
								style={styles.saveBtn}
								onPress={handleSave}
								disabled={loading}
							>
								{loading ? (
									<ActivityIndicator color="#fff" />
								) : (
									<ReadexProText style={styles.saveText}>Save</ReadexProText>
								)}
							</TouchableOpacity>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</View>
		</>
	);
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	keyboardView: {
		flex: 1,
	},
	content: {
		flex: 1,
		padding: 16,
		// paddingVertical: 24,
	},

	label: { fontSize: 18, marginTop: 12, fontWeight: "500" },

	row: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 8,
        gap :8
	},

	metricBtn: {
		padding: 10,
		borderWidth: 1,
		borderRadius: 10,
        minWidth: 70,
		textAlign: 'center',
        borderColor: '#adadad8f'
	},

	activeMetric: {
		backgroundColor: "#0095b6",
		borderColor: "#0095b6",
        color: "#fff"
	},

    metricText: {
        textAlign: 'center'
    },
    activeMetrictext: {
        color: "#fff"
	},

	input: {
		backgroundColor: "#cbcbcb34",
		fontSize: 16,
		padding: 18,
		borderRadius: 10,
        marginTop: 6
	},

	inputRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 6,
	},

	addSmallBtn: {
		marginLeft: 8,
		backgroundColor: "#0095b6",
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 8,
	},

	pillContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 10,
	},

	pill: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#e6f7fb",
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 20,
		marginRight: 8,
		marginBottom: 8,
	},

	pillText: {
		marginRight: 6,
	},

	remove: {
		color: "#ff4444",
		fontWeight: "bold",
	},

	status: {
		marginTop: 8,
		fontWeight: "600",
	},

	saveBtn: {
		marginTop: 30,
		backgroundColor: "#0095b6",
		padding: 14,
		borderRadius: 12,
	},

	saveText: {
		color: "#fff",
		textAlign: "center",
		fontSize: 18
	},
});
