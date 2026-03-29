import {
	View,
	StyleSheet,
	FlatList,
	ActivityIndicator,
	TouchableOpacity,
	Alert,
} from "react-native";
import ReadexProText from "@/components/ReadexProText";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";

import { useAuth } from "@/contexts/AuthContext";
import { CustomHeader } from "@/components/headers";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import { Feather } from "@expo/vector-icons";

/* ---------------- HEALTH RANGES ---------------- */

const HEALTH_RANGES = {
	Hemoglobin: { low: 13, high: 17, unit: "g/dL" },

	"Blood Sugar": { low: 70, high: 140, unit: "mg/dL" },

	"Blood Pressure": { low: 80, high: 120, unit: "mmHg" },

	"Total Cholesterol": { low: 125, high: 200, unit: "mg/dL" },
	LDL: { low: 0, high: 130, unit: "mg/dL" },
	HDL: { low: 40, high: 100, unit: "mg/dL" },

	Triglycerides: { low: 0, high: 150, unit: "mg/dL" },

	"Heart Rate": { low: 60, high: 100, unit: "bpm" },

	"Oxygen (SpO₂)": { low: 95, high: 100, unit: "%" },

	BMI: { low: 18.5, high: 24.9, unit: "" },

	Creatinine: { low: 0.7, high: 1.3, unit: "mg/dL" },

	HbA1c: { low: 4, high: 5.7, unit: "%" },

	"Uric Acid": { low: 3.5, high: 7.2, unit: "mg/dL" },

	"Vitamin D": { low: 20, high: 50, unit: "ng/mL" },

	"Vitamin B12": { low: 200, high: 900, unit: "pg/mL" },

	"TSH (Thyroid)": { low: 0.4, high: 4.0, unit: "mIU/L" },
};

/* ---------------- HELPERS ---------------- */

const getStatus = (name, value, fallbackStatus) => {
	const range = HEALTH_RANGES[name];

	// ✅ If no range → use Firebase status
	if (!range) {
		return fallbackStatus || "unknown";
	}

	if (value == null) return fallbackStatus || "unknown";

	if (value < range.low) return "low";
	if (value > range.high) return "high";
	return "normal";
};

const getColor = (status) => {
	if (status === "normal") return "#22c55e";
	if (status === "high") return "#ef4444";
	if (status === "low") return "#f59e0b";
	return "#999";
};

/* ---------------- METRIC CARD ---------------- */

const MetricCard = ({ item }) => {
	const status = getStatus(item.name, item.value, item.status);
	const color = getColor(status);

	const unit = item.unit || HEALTH_RANGES[item.name]?.unit || "";

	return (
		<View style={styles.card}>
			<ReadexProText style={styles.name}>{item.name}</ReadexProText>

			<ReadexProText style={[styles.value, { color }]}>
				{item.value ?? "--"} {unit}
			</ReadexProText>

			<ReadexProText style={{ color, fontSize: 12 }}>
				{status?.toUpperCase()}
			</ReadexProText>
		</View>
	);
};

/* ---------------- SECTION ---------------- */

const Section = ({ title, data }) => {
	if (!data.length) return null;

	return (
		<View style={{ marginBottom: 20,  }}>
			<ReadexProText weight="medium" style={styles.sectionTitle}>
				{title}
			</ReadexProText>

			<FlatList
				data={data}
                style={{borderWidth: 1, overflow: "hidden", borderColor: "#dcdcdc", borderRadius: 8}}
				keyExtractor={(item, i) => item.name + i}
				renderItem={({ item }) => <MetricCard item={item} />}
				numColumns={2}
				scrollEnabled={false}
			/>
		</View>
	);
};

/* ---------------- MAIN ---------------- */

export default function HealthScreen() {
	const { user } = useAuth();

	const [loading, setLoading] = useState(false);
	const [predicting, setPredicting] = useState(false);
	const [predictionResult, setPredictionResult] = useState(null);

	/* ---------------- SAMPLE DATA ---------------- */

	//   const [metrics] = useState([
	//     { name: "Hemoglobin", value: 11.2 },
	//     { name: "Blood Sugar", value: 145 },

	//     { name: "Blood Pressure (Systolic)", value: 135 },
	//     { name: "Blood Pressure (Diastolic)", value: 90 },

	//     { name: "Total Cholesterol", value: 210 },
	//     { name: "LDL", value: 140 },
	//     { name: "HDL", value: 38 },

	//     { name: "Triglycerides", value: 180 },

	//     { name: "Heart Rate", value: 78 },
	//     { name: "Oxygen (SpO₂)", value: 97 },

	//     { name: "BMI", value: 26.4 },

	//     { name: "Creatinine", value: 1.1 },
	//     { name: "HbA1c", value: 6.2 },
	//     { name: "Uric Acid", value: 6.5 },

	//     { name: "Vitamin D", value: 18 },
	//     { name: "Vitamin B12", value: 250 },

	//     { name: "TSH (Thyroid)", value: 3.5 },
	//   ]);

	const [metrics, setMetrics] = useState([]);
	const [profile, setProfile] = useState({
		allergies: [],
		conditions: [],
	});

	// fetch health metrics
	useEffect(() => {
		if (!user?.uid) return;

		fetchHealthData();
	}, [user]);

	const fetchHealthData = async () => {
		try {
			setLoading(true);

			const snap = await getDocs(
				collection(db, "users", user.uid, "health_metrics"),
			);

			const docs = snap.docs.map((d) => ({
				id: d.id,
				...d.data(),
			}));

			/* ---------------- SEPARATE DATA ---------------- */

			const metrics = docs.filter((d) => d.type === "metric");
			const allergies = docs.filter((d) => d.type === "allergy");
			const conditions = docs.filter((d) => d.type === "condition");

			/* ---------------- SET STATE ---------------- */

			setMetrics(metrics);
			setProfile({
				allergies: allergies.map((a) => a.name),
				conditions: conditions.map((c) => c.name),
			});
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	/* ---------------- GROUPING ---------------- */

	const vitals = metrics.filter((m) =>
		["Heart Rate", "Oxygen (SpO₂)", "Blood Pressure"].includes(m.name),
	);

	const body = metrics.filter((m) => ["BMI"].includes(m.name));

	const labs = metrics.filter(
		(m) =>
			!["Heart Rate", "Oxygen (SpO₂)", "Blood Pressure", "BMI"].includes(
				m.name,
			),
	);

	/* ---------------- HEALTH SCORE ---------------- */

	const getHealthScore = () => {
		let score = 0;

		metrics.forEach((m) => {
			const status = getStatus(m.name, m.value, m.status);

			if (status === "normal") score += 8;
			else if (status === "low") score += 6;
			else if (status === "high") score += 4;
		});

		return Math.min(score, 100);
	};

	/* ---------------- AI PREDICTION ---------------- */

	const handlePredict = async () => {
		if (!metrics || metrics.length === 0) {
			Alert.alert("Error", "No health metrics available to predict.");
			return;
		}

		try {
			setPredicting(true);

			// Map metrics array directly, sending all available data to Gemini
			const mapped = {};
			metrics.forEach((m) => {
				mapped[m.name] = String(m.value);
			});

			const API_URL = "http://10.203.174.221:8000/api/predict/health"; // For Android Emulator. Use localhost or your LAN IP if otherwise.
			
			const response = await fetch(API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(mapped),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(errorText);
			}

			const data = await response.json();
			setPredictionResult(data);
		} catch (error) {
			console.error(error);
			Alert.alert("Prediction Failed", error.message);
		} finally {
			setPredicting(false);
		}
	};

	/* ---------------- UI ---------------- */

	if (loading) {
		return (
			<View style={styles.loader}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<>
			<Stack.Screen
				options={{
					headerShown: true,
					header: () => (
						<CustomHeader
							title="My Health"
							onBack={() => {
								if (router.canGoBack()) router.back();
								else router.replace("index");
							}}
						/>
					),
				}}
			/>

			<View style={styles.container}>
				<FlatList
					data={[{ key: "content" }]}
					renderItem={() => (
						<>
							{/* HEALTH SCORE */}
							<View style={styles.scoreCard}>
								<ReadexProText style={styles.scoreTitle}>
									Health Score
								</ReadexProText>
								<ReadexProText weight="medium" style={styles.score}>
									{getHealthScore()}%
								</ReadexProText>
								<ReadexProText style={styles.scoreSub}>
									Based on latest metrics
								</ReadexProText>
								
								<TouchableOpacity 
									style={styles.predictBtn} 
									onPress={handlePredict}
									disabled={predicting}
								>
									{predicting ? (
										<ActivityIndicator color="#0095b6" size="small" />
									) : (
										<ReadexProText style={styles.predictBtnText}>Generate AI Analysis</ReadexProText>
									)}
								</TouchableOpacity>
							</View>

							{/* AI PREDICTION RESULT */}
							{predictionResult && (
								<View style={styles.predictionCard}>
									<ReadexProText weight="medium" style={styles.predictionSectionTitle}>
										AI Health Analysis
									</ReadexProText>

									{/* <ReadexProText style={styles.predictionLabel}>AI Score:</ReadexProText>
									<ReadexProText style={styles.predictionValue}>{predictionResult.health_score}/100</ReadexProText> */}

									<ReadexProText style={[styles.predictionLabel, {marginTop: 10}]}>Insights:</ReadexProText>
									<ReadexProText style={{fontSize: 14, color: "#166534", marginTop: 4}}>{predictionResult.insights}</ReadexProText>

									{predictionResult.risk_factors && predictionResult.risk_factors.length > 0 && (
										<>
											<ReadexProText style={[styles.predictionLabel, {marginTop: 10}]}>Risk Factors:</ReadexProText>
											{predictionResult.risk_factors.map((risk, idx) => (
												<ReadexProText key={idx} style={{fontSize: 14, color: "#166534", marginTop: 2, paddingLeft: 4}}>• {risk}</ReadexProText>
											))}
										</>
									)}

									{predictionResult.recommendations && predictionResult.recommendations.length > 0 && (
										<>
											<ReadexProText style={[styles.predictionLabel, {marginTop: 10}]}>Recommendations:</ReadexProText>
											{predictionResult.recommendations.map((rec, idx) => (
												<ReadexProText key={idx} style={{fontSize: 14, color: "#166534", marginTop: 2, paddingLeft: 4}}>• {rec}</ReadexProText>
											))}
										</>
									)}
								</View>
							)}

							<Section title="Vitals" data={vitals} />
							<Section title="Body" data={body} />
							<Section title="Lab Metrics" data={labs} />

							{/* PROFILE */}
							<View style={styles.profileCard}>
								<ReadexProText weight="medium" style={styles.sectionTitle}>
									Medical Profile
								</ReadexProText>

								<ReadexProText style={styles.profileLabel}>
									Allergies
								</ReadexProText>

								<View style={styles.pillContainer}>
									{profile.allergies.length > 0 ? (
										profile.allergies.map((item, index) => (
											<View key={index} style={[styles.pill, {backgroundColor: "#FEE2E2"}]}>
												<ReadexProText style={[styles.pillText, {color: "#991B1B"}]}>
													{item}
												</ReadexProText>
											</View>
										))
									) : (
										<ReadexProText style={styles.profileValue}>
											None
										</ReadexProText>
									)}
								</View>

								<ReadexProText style={styles.profileLabel}>
									Chronic Conditions
								</ReadexProText>

								<View style={styles.pillContainer}>
									{profile.conditions.length > 0 ? (
										profile.conditions.map((item, index) => (
											<View key={index} style={[styles.pill, {backgroundColor: "#ffffa9"}]}>
												<ReadexProText style={[styles.pillText, {color: "#8B8000"}]}>
													{item}
												</ReadexProText>
											</View>
										))
									) : (
										<ReadexProText style={styles.profileValue}>
											None
										</ReadexProText>
									)}
								</View>
							</View>
						</>
					)}
				/>

				{/* ACTION */}
				<View style={metrics && styles.floatingCont}>
					<TouchableOpacity
						onPress={() => router.push("/addHealthData")}
						style={metrics ? styles.floatingBtn : styles.addBtn}
					>
						{metrics ? (
							<Feather name="edit-3" size={24} color="white" />
						) : (
							<ReadexProText style={styles.addReadexProText}>
								<Feather name="plus" size={24} color="white" /> Add Health Data
							</ReadexProText>
						)}
					</TouchableOpacity>
				</View>
			</View>
		</>
	);
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
		backgroundColor: "#fff",
	},

	loader: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},

	scoreCard: {
		backgroundColor: "#0095b6",
		padding: 20,
		borderRadius: 16,
		marginVertical: 20,
	},

	scoreTitle: {
		color: "#fff",
		fontSize: 16,
	},

	score: {
		color: "#fff",
		fontSize: 36,
	},

	scoreSub: {
		color: "#e0f7fa",
	},

	predictBtn: {
		backgroundColor: "#fff",
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 24,
		marginTop: 20,
		alignSelf: "flex-start",
	},

	predictBtnText: {
		color: "#0095b6",
		fontWeight: "600",
		fontSize: 14,
	},

	predictionCard: {
		backgroundColor: "#f0fdf4",
		padding: 20,
		borderRadius: 16,
		marginBottom: 20,
		borderColor: "#bbf7d0",
		borderWidth: 1,
	},
	predictionSectionTitle: {
		fontSize: 18,
		marginBottom: 10,
		color: "#166534",
	},
	predictionLabel: {
		fontSize: 15,
		color: "#14532d",
		fontWeight: "bold",
	},
	predictionValue: {
		fontSize: 18,
		color: "#166534",
		fontWeight: "500",
		marginTop: 2,
	},

	sectionTitle: {
		fontSize: 18,
		marginBottom: 10,
		color: "#333",
	},

	card: {
		flex: 1,
		backgroundColor: "#fff",
		padding: 16,
		// borderRadius: 8,
		// margin: 6,
		borderColor: "#dcdcdc",
		borderWidth: 0,
	},

	name: {
		fontSize: 14,
		color: "#777",
	},

	value: {
		fontSize: 20,
		fontWeight: "600",
		marginVertical: 3,
	},

	profileCard: {
		marginBottom: 30,
		flex: 1,
		backgroundColor: "#fff",
		padding: 16,
		borderRadius: 8,
		// margin: 6,
		borderColor: "#dcdcdc",
		borderWidth: 1,
	},

	profileLabel: {
		fontSize: 14,
		color: "#777",
		// marginTop: 10,
	},

	profileValue: {
		fontSize: 15,
		fontWeight: "500",
		marginTop: 2,
	},

	pillContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
        gap: 8,
		marginTop: 6,
		marginBottom: 10,
	},

	pill: {
		borderRadius: 20,
		paddingVertical: 6,
		paddingHorizontal: 14,
		
	},

	pillText: {
		fontSize: 14,
	},

	floatingCont: {
		position: "absolute",
		bottom: 70,
		right: 40,
	},

	floatingBtn: {
		backgroundColor: "#0095b6",
		padding: 16,
		borderRadius: 10,
	},

	addBtn: {
		position: "absolute",
		bottom: 30,
		left: 20,
		right: 20,
		backgroundColor: "#0095b6",
		padding: 16,
		borderRadius: 12,
	},

	addReadexProText: {
		color: "#fff",
		textAlign: "center",
		fontSize: 16,
	},
});
