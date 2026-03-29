import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
} from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ReadexProText from "@/components/ReadexProText";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "MEDIVA_REMINDERS";

/* ---------- Label helpers ---------- */

const FORM_LABEL = {
	tablet: "Tablet",
	capsule: "Capsule",
	syrup: "Syrup",
	drops: "Drops",
	injection: "Injection",
	cream: "Cream / Ointment",
};

const INTAKE_LABEL = {
	before_meal: "Before meal",
	after_meal: "After meal",
	with_meal: "With meal",
	empty_stomach: "Empty stomach",
	bedtime: "At bedtime",
};

/* ---------- reuse helpers ---------- */

const toDate = (value) => {
	if (!value) return null;
	if (typeof value.toDate === "function") return value.toDate();
	if (typeof value === "string") return new Date(value);
	if (value instanceof Date) return value;
	return null;
};

const getTimeOnly = (value) => {
	const date = toDate(value);
	if (!date) return null;
	const d = new Date();
	d.setHours(date.getHours(), date.getMinutes(), 0, 0);
	return d;
};

const getTimesForFrequency = (baseTime, frequency) => {
	const base = getTimeOnly(baseTime);
	if (!base) return [];

	const times = [];

	if (frequency === "once") times.push(base);

	if (frequency === "twice") {
		times.push(base);
		times.push(new Date(base.getTime() + 12 * 60 * 60 * 1000));
	}

	if (frequency === "thrice") {
		times.push(base);
		times.push(new Date(base.getTime() + 8 * 60 * 60 * 1000));
		times.push(new Date(base.getTime() + 16 * 60 * 60 * 1000));
	}

	return times;
};

const isSameDay = (d1, d2) => d1.toDateString() === d2.toDateString();

/* ---------- component ---------- */

export default function TodayReminders() {
	const [reminders, setReminders] = useState([]);
	const [loading, setLoading] = useState([]);
	const { user } = useAuth();

	const isEmpty = (arr) => !arr || arr.length === 0;

	useEffect(() => {
		const loadReminders = async () => {
			try {
				setLoading(true);

				// 1️⃣ Load from local storage
				const local = await getReminders(); // your existing function

				if (!isEmpty(local)) {
					setReminders(local);
					setLoading(false);
					return;
				}

				// 2️⃣ Fallback → Firestore
				if (user?.uid) {
					const remote = await fetchRemindersFromFirestore(user.uid);

					setReminders(remote);
				}
			} catch (err) {
				console.error("Reminder load error:", err);
			} finally {
				setLoading(false);
			}
		};

		loadReminders();
	}, [user]);

	const getReminders = async () => {
		const data = await AsyncStorage.getItem(STORAGE_KEY);
		if (data) setReminders(JSON.parse(data));
	};

	const fetchRemindersFromFirestore = async (userId) => {
		const snap = await getDocs(collection(db, "users", userId, "reminders"));

		return snap.docs.map((doc) => ({
			firestoreId: doc.id,
			...doc.data(),
		}));
	};

	const getTodayReminders = () => {
		const today = new Date();
		const result = [];

		reminders.forEach((reminder) => {
			const startDate = toDate(reminder.createdAt);
			if (!startDate) return;

			const times = getTimesForFrequency(reminder.time, reminder.frequency);

			for (let day = 0; day < reminder.durationDays; day++) {
				times.forEach((t) => {
					const occurrence = new Date(startDate);
					occurrence.setDate(occurrence.getDate() + day);
					occurrence.setHours(t.getHours(), t.getMinutes(), 0, 0);

					if (isSameDay(occurrence, today)) {
						result.push({
							...reminder,
							occurrenceTime: occurrence,
						});
					}
				});
			}
		});

		return result.sort((a, b) => a.occurrenceTime - b.occurrenceTime);
	};

	const getOccurrenceKey = (date) => date.toISOString();
	const getDoseStatus = (reminder, occurrenceTime) => {
		const key = getOccurrenceKey(occurrenceTime);
		const taken = reminder.takenLog?.[key] === true;

		if (taken) return "taken";
		if (occurrenceTime < new Date()) return "missed";
		return "upcoming";
	};

	const todayReminders = getTodayReminders();

	const renderItem = ({ item }) => {
		const time = item.occurrenceTime;
		const isPast = time <= new Date();
		const status = getDoseStatus(item, item.occurrenceTime);

		// console.log(item);
		return (
			<View>
				<View style={styles.card}>
					{/* <View style={styles.medFormIcon}>
						<FontAwesome6
							name={FORM_LABEL_ICON[item.form]}
							size={20}
							color="#0095b6"
						/>
					</View> */}

					<View style={{ flex: 1 }}>
						<ReadexProText weight="medium" style={styles.name}>
							{item.name}
						</ReadexProText>

						<ReadexProText style={styles.secondary}>
							{/* {FREQ_LABEL[item.frequency]} */}
							{item.dose} {FORM_LABEL[item.form]} • {INTAKE_LABEL[item.intake]}{" "}
							• {/* {item.durationDays} days */}
							{time
								.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
									hour12: true,
								})
								.toUpperCase()}
						</ReadexProText>
					</View>

					<View
						style={{
							borderWidth: 0.8,
							borderColor:
								status === "taken"
									? "#14ff1c40"
									: status === "missed"
										? "#ff675f39"
										: "#3cdbff38",
							height: 28,
							width: 28,
							borderRadius: 48,
							flexDirection: "row",
							justifyContent: "center",
							alignItems: "center",
							backgroundColor:
								status === "taken"
									? "#14ff1c40"
									: status === "missed"
										? "#ff675f39"
										: "#3cdbff38",
						}}
					>
						{status === "taken" && (
							<Feather name="check" size={20} color="#4CAF50" />
						)}

						{status === "missed" && (
							<Feather name="x-circle" size={20} color="#FF3B30" />
						)}

						{status === "upcoming" && (
							<Feather name="clock" size={20} color="#0095b6" />
						)}
					</View>
				</View>
			</View>
		);
	};

	return (
		<View style={styles.container}>
			<View style={styles.contheadlink}>
				<ReadexProText weight="medium" style={styles.title}>
					Today's Medicines
				</ReadexProText>
				<TouchableOpacity
					onPress={() => router.push("/(tabs)/reminders")}
					style={styles.floatingBtn}
				>
					<ReadexProText style={{ color: "#0095b6" }}>See all</ReadexProText>
				</TouchableOpacity>
			</View>

			<FlatList
				contentContainerStyle={{
					borderWidth: 0.7,
					borderColor: "#e7e7e7",
					borderRadius: 16,
					overflow: "hidden",
					gap: 1,
					backgroundColor: "#eee",
				}}
				data={todayReminders}
				keyExtractor={(item, i) => item.id + i}
				renderItem={renderItem}
				scrollEnabled={false} // important for home page
				ListEmptyComponent={
					<Text style={styles.empty}>No medicines today</Text>
				}
			/>
		</View>
	);
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
	container: {
		marginTop: 10,
		paddingTop: 20,
		paddingHorizontal: 18,
	},

	contheadlink: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},

	title: {
		fontSize: 18,
	},

	card: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		backgroundColor: "#ffffff",
		borderColor: "#e7e7e7",
		gap: 12,
	},

	medFormIcon: {
		backgroundColor: "#0095b645",
		height: 44,
		width: 44,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 48,
	},

	name: {
		fontSize: 18,
		color: "#111",
	},
	primary: {
		marginTop: 4,
		fontSize: 15,
		color: "#333",
	},
	secondary: {
		marginTop: 4,
		fontSize: 13,
		color: "#666",
	},
	empty: {
		textAlign: "center",
		marginTop: 60,
		fontSize: 16,
		color: "#999",
	},
});
