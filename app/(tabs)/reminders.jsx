import DropDown from "@/components/DropDown";
import HorizontalCalendar from "@/components/HorizontalCalender";
import ReadexProText from "@/components/ReadexProText";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { Feather } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { router, useFocusEffect } from "expo-router";
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    updateDoc,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
});

const STORAGE_KEY = "MEDIVA_REMINDERS";

/* ---------------- LABEL MAPS ---------------- */

const FORM_LABEL = {
	tablet: "Tablet",
	capsule: "Capsule",
	syrup: "Syrup",
	drops: "Drops",
	injection: "Injection",
	cream: "Cream / Ointment",
};

const FORM_LABEL_ICON = {
	tablet: "tablets",
	capsule: "capsules",
	syrup: "prescription-bottle",
	drops: "eye-dropper",
	injection: "syringe",
	cream: "Cream / Ointment",
};

const FREQ_LABEL = {
	once: "Once daily",
	twice: "Twice daily",
	thrice: "Thrice daily",
	"6h": "Every 6 hours",
	"8h": "Every 8 hours",
	"12h": "Every 12 hours",
};

const INTAKE_LABEL = {
	before_meal: "Before meal",
	after_meal: "After meal",
	with_meal: "With meal",
	empty_stomach: "Empty stomach",
	bedtime: "At bedtime",
};

/* ---------------- TIME HELPERS ---------------- */

const toDate = (value) => {
	if (!value) return null;

	// Firestore Timestamp
	if (typeof value.toDate === "function") {
		return value.toDate();
	}

	// ISO string
	if (typeof value === "string") {
		return new Date(value);
	}

	// Already Date
	if (value instanceof Date) {
		return value;
	}

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

	if (frequency === "6h") {
		for (let i = 0; i < 4; i++) {
			times.push(new Date(base.getTime() + i * 6 * 60 * 60 * 1000));
		}
	}

	if (frequency === "8h") {
		for (let i = 0; i < 3; i++) {
			times.push(new Date(base.getTime() + i * 8 * 60 * 60 * 1000));
		}
	}

	if (frequency === "12h") {
		times.push(base);
		times.push(new Date(base.getTime() + 12 * 60 * 60 * 1000));
	}

	return times;
};

/* ---------------- SCREEN ---------------- */

export default function Reminders() {
	const [reminders, setReminders] = useState([]);

	const [currentMonth, setCurrentMonth] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState(new Date());

	const [showMonthDropDown, setShowMonthDropDown] = useState(false);

	const { user } = useAuth();

	useEffect(() => {
		Notifications.requestPermissionsAsync();
	}, []);

	// fetch reminders and resheduling (if local storage is empty (null) )

	const fetchRemindersFromFirestore = async (userId) => {
		const snap = await getDocs(collection(db, "users", userId, "reminders"));

		return snap.docs.map((doc) => ({
			firestoreId: doc.id,
			...doc.data(),
		}));
	};

	const scheduleNotificationsFromReminder = async (reminder) => {
		// ✅ Web guard
		if (Platform.OS === "web") {
			console.warn("Notifications not supported on web");
			return [];
		}

		const notificationIds = [];

		const times = getTimesForFrequency(reminder.time, reminder.frequency);

		for (let day = 0; day < reminder.durationDays; day++) {
			for (const t of times) {
				const triggerDate = new Date(t);
				triggerDate.setDate(triggerDate.getDate() + day);

				if (triggerDate <= new Date()) continue;

				const id = await Notifications.scheduleNotificationAsync({
					content: {
						title: "Medicine Reminder 💊",
						body: `${reminder.name} (${reminder.dose})`,
						channelId: "default",
					},
					trigger: {
						type: Notifications.SchedulableTriggerInputTypes.DATE,
						date: triggerDate,
					},
				});

				notificationIds.push(id);
			}
		}

		return notificationIds;
	};

	const hydrateLocalFromFirestore = async () => {
		if (Platform.OS === "web") return;

		if (!user) return;

		const existing = await AsyncStorage.getItem(STORAGE_KEY);
		if (existing) {
			setReminders(JSON.parse(existing));
			return;
		}

		// 1️⃣ Fetch cloud reminders
		const cloudReminders = await fetchRemindersFromFirestore(user.uid);

		if (!cloudReminders.length) {
			setReminders([]);
			return;
		}

		const hydrated = [];

		for (const reminder of cloudReminders) {
			// 2️⃣ Schedule notifications on THIS device
			const notificationIds = await scheduleNotificationsFromReminder(reminder);

			// 3️⃣ Save locally
			hydrated.push({
				id: Date.now().toString() + Math.random(), // local id
				...reminder,
				notificationIds,
			});
		}

		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
		setReminders(hydrated);
	};

	// const loadReminders = async () => {
	// 	const data = await AsyncStorage.getItem(STORAGE_KEY);

	// 	if (data) {
	// 		setReminders(JSON.parse(data));
	// 		return;
	// 	}

	// 	await hydrateLocalFromFirestore();
	// };

	const loadReminders = async () => {
		// 🌐 WEB: fetch only from Firestore
		if (Platform.OS === "web") {
			if (!user) return;

			const cloudReminders = await fetchRemindersFromFirestore(user.uid);

			setReminders(
				cloudReminders.map((r) => ({
					...r,
					id: r.firestoreId, // stable key for lists
				})),
			);

			return;
		}

		// 📱 MOBILE: try local storage first
		const data = await AsyncStorage.getItem(STORAGE_KEY);

		if (data) {
			setReminders(JSON.parse(data));
			return;
		}

		// fallback (new device)
		await hydrateLocalFromFirestore();
	};

	useFocusEffect(
		useCallback(() => {
			loadReminders();
		}, []),
	);

	// console.log(JSON.stringify(reminders, null, 2));

	const isSameDay = (d1, d2) => d1.toDateString() === d2.toDateString();

	const getRemindersForDate = (date) => {
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

					if (isSameDay(occurrence, date)) {
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

	const dailyReminders = useMemo(() => {
		return getRemindersForDate(selectedDate, reminders);
	}, [selectedDate, reminders]);

	const generateMonthOptions = ({ startYear, endYear }) => {
		const months = [];

		for (let year = startYear; year <= endYear; year++) {
			for (let month = 0; month < 12; month++) {
				months.push({
					label: new Date(year, month).toLocaleDateString("en-US", {
						month: "long",
						year: "numeric",
					}),
					value: { year, month },
				});
			}
		}

		return months;
	};

	const now = new Date();

	const MONTH_OPTIONS = useMemo(() => {
		return generateMonthOptions({
			startYear: now.getFullYear() - 1,
			endYear: now.getFullYear() + 1,
		});
	}, []);

	const currentMonthIndex = MONTH_OPTIONS.findIndex(
		(m) =>
			m.value.year === currentMonth.getFullYear() &&
			m.value.month === currentMonth.getMonth(),
	);

	// reminder deletion
	const cancelReminderNotifications = async (notificationIds = []) => {
		for (const id of notificationIds) {
			try {
				await Notifications.cancelScheduledNotificationAsync(id);
			} catch (e) {
				console.warn("Failed to cancel notification:", id);
			}
		}
	};

	const deleteReminderLocal = async (reminderId) => {
		const data = await AsyncStorage.getItem(STORAGE_KEY);
		const reminders = data ? JSON.parse(data) : [];

		const updated = reminders.filter((r) => r.id !== reminderId);

		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
	};

	const deleteReminderFromFirebase = async (userId, firestoreId) => {
		await deleteDoc(doc(db, "users", userId, "reminders", firestoreId));
	};

	const handleDeleteReminder = async (reminder) => {
		try {
			// 1️⃣ cancel notifications
			await cancelReminderNotifications(reminder.notificationIds);

			// 2️⃣ remove locally
			await deleteReminderLocal(reminder.id);

			// 3️⃣ remove from firestore (background-safe)
			if (reminder.firestoreId) {
				deleteReminderFromFirebase(user.uid, reminder.firestoreId).catch(
					console.error,
				);
			}
			Alert.alert("Reminder Deleted");
		} catch (err) {
			console.error("Delete reminder failed", err);
		}
	};

	const handleDeleteConfirm = (reminder) => {
		Alert.alert(
			"Delete Reminder",
			`Are you sure you want to delete "${reminder.name}"?`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => handleDeleteReminder(reminder),
				},
			],
		);
	};

	const getOccurrenceKey = (date) => date.toISOString();
	const getDoseStatus = (reminder, occurrenceTime) => {
		const key = getOccurrenceKey(occurrenceTime);
		const taken = reminder.takenLog?.[key] === true;

		if (taken) return "taken";
		if (occurrenceTime < new Date()) return "missed";
		return "upcoming";
	};

	const updateReminderLocal = async (reminderId, patch) => {
		const data = await AsyncStorage.getItem(STORAGE_KEY);
		const reminders = data ? JSON.parse(data) : [];

		const updated = reminders.map((r) =>
			r.id === reminderId ? { ...r, ...patch } : r,
		);

		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		setReminders(updated); // IMPORTANT: refresh UI instantly
	};

	const updateReminderFirestore = async (firestoreId, patch) => {
		if (!firestoreId) return;

		try {
			await updateDoc(
				doc(db, "users", user.uid, "reminders", firestoreId),
				patch,
			);
		} catch (e) {
			console.warn("Firestore sync failed", e);
		}
	};

	const toggleTaken = async (reminder, occurrenceTime) => {
		const key = getOccurrenceKey(occurrenceTime);

		// Prevent future doses
		if (occurrenceTime > new Date()) return;

		const updatedLog = {
			...(reminder.takenLog || {}),
			[key]: !reminder.takenLog?.[key],
		};

		/* ---------- WEB ---------- */
		if (Platform.OS === "web") {
			// 1️⃣ update UI state directly
			setReminders((prev) =>
				prev.map((r) =>
					r.firestoreId === reminder.firestoreId
						? { ...r, takenLog: updatedLog }
						: r,
				),
			);

			// 2️⃣ sync to Firestore
			updateReminderFirestore(reminder.firestoreId, {
				[`takenLog.${key}`]: updatedLog[key],
			});

			return;
		}

		// 1️⃣ Update locally (instant UX)
		await updateReminderLocal(reminder.id, {
			takenLog: updatedLog,
		});

		// 2️⃣ Sync to Firestore (best effort)
		updateReminderFirestore(reminder.firestoreId, {
			[`takenLog.${key}`]: updatedLog[key],
		});
	};

	const renderItem = ({ item }) => {
		const time = item.occurrenceTime;
		const isPast = time <= new Date();
		const status = getDoseStatus(item, item.occurrenceTime);

		// console.log(item);
		return (
			<TouchableOpacity
				activeOpacity={0.9}
				onLongPress={() => handleDeleteConfirm(item)}
				delayLongPress={400}
			>
				<View style={styles.card}>
					<View style={styles.medFormIcon}>
						<FontAwesome6
							name={FORM_LABEL_ICON[item.form]}
							size={20}
							color="#0095b6"
						/>
					</View>

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

					<TouchableOpacity
						onPress={() => toggleTaken(item, item.occurrenceTime)}
						disabled={status === "upcoming"}
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
					</TouchableOpacity>
				</View>
			</TouchableOpacity>
		);
	};

	// AsyncStorage.removeItem(STORAGE_KEY);

	return (
		<View style={styles.container}>
			{/* */}
			<View style={{ position: "relative", backgroundColor: "#fff" }}>
				<TouchableOpacity
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
						width: 160,
					}}
					onPress={() => setShowMonthDropDown((prev) => !prev)}
				>
					<ReadexProText weight="medium" style={{ fontSize: 18 }}>
						{currentMonth.toLocaleDateString("en-US", {
							month: "long",
							year: "numeric",
						})}
					</ReadexProText>
					<Feather
						name={showMonthDropDown ? "chevron-up" : "chevron-down"}
						size={22}
					/>
				</TouchableOpacity>
				{
					<View
						style={{
							maxHeight: showMonthDropDown ? 286 : 0,
							opacity: showMonthDropDown ? 1 : 0,
							overflow: "hidden",
							pointerEvents: showMonthDropDown ? "" : "none",
							transitionDuration: "150ms",
							marginTop: 8,
							position: "absolute",
							zIndex: 20,
							top: 18,
							left: 0,
							right: 0,
						}}
					>
						<DropDown
							items={MONTH_OPTIONS}
							initialIndex={currentMonthIndex}
							onSelect={(val) => {
								const d = new Date(val.year, val.month, 1);
								setCurrentMonth(d);
								setSelectedDate(d);
								setShowMonthDropDown(false);
							}}
							isActive={(item) =>
								item.value.year === currentMonth.getFullYear() &&
								item.value.month === currentMonth.getMonth()
							}
						/>
					</View>
				}
				<HorizontalCalendar
					currentMonth={currentMonth}
					selectedDate={selectedDate}
					onSelectDate={setSelectedDate}
				/>
			</View>

			<FlatList
				data={dailyReminders}
				keyExtractor={(item, index) => item.id + index}
				renderItem={renderItem}
				ListEmptyComponent={
					<View style={{ height: 200 }}>
						<Text
							style={{
								position: "absolute",
								bottom: 0,
								left: 0,
								right: 0,
								textAlign: "center",
							}}
						>
							No reminders for this day
						</Text>
					</View>
				}
				contentContainerStyle={{ paddingTop: 16, position: "relative" }}
			/>
			{Platform.OS != "web" && (
				<View style={styles.floatingCont}>
					<TouchableOpacity
						onPress={() => router.push("/addReminders")}
						style={styles.floatingBtn}
					>
						<Feather name="plus" size={30} color="#FFF" />
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: "#ffffff",
		position: "relative",
	},

	card: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		borderRadius: 12,
		backgroundColor: "#ffffff",
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#eee",
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

	// add Reminder btn
	floatingCont: {
		position: "absolute",
		bottom: 50,
		right: 35,
	},

	floatingBtn: {
		backgroundColor: "#0095b6",
		padding: 14,
		borderRadius: 12,
	},

	dayItem: {
		width: 64,
		height: 80,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		marginHorizontal: 6,
	},
	daySelected: {
		backgroundColor: "#0095b6",
	},
	todayBorder: {
		borderWidth: 1.5,
		borderColor: "#0095b6",
	},
	dayText: {
		fontSize: 12,
		color: "#444",
	},
	dateText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#111",
	},
});
