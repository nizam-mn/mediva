import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { CustomHeader } from "@/components/headers";
import InterText from "@/components/InterText";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DropDown from "@/components/DropDown";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function addReminders() {
	const [openDropDown, setOpenDropDown] = useState(null);
	const [loading, setLoading] = useState(false);
	const [medicine, setMedicine] = useState({
		name: "",
		form: "tablet",
		dose: 1,
		frequency: "once",
		durationDays: 3,
		intake: "before_meal",
		time: new Date(),
	});

	const { user } = useAuth();

	const updateMedicine = (key, value) => {
		setMedicine((prev) => ({ ...prev, [key]: value }));
	};

	const timeText = new Date(medicine.time).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});

	const FORM_LABEL = {
		tablet: "Tablet",
		capsule: "Capsule",
		syrup: "Syrup (ml)",
		drops: "Drops",
		injection: "Injection",
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

	const getTimeOnly = (date) => {
		const d = new Date();
		d.setHours(date.getHours(), date.getMinutes(), 0, 0);
		return d;
	};

	const getTimesForFrequency = (baseTime, frequency) => {
		const times = [];
		const base = getTimeOnly(baseTime);

		if (frequency === "once") {
			times.push(base);
		}

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

	const scheduleNotifications = async (medicine) => {
		const notifications = [];

		const times = getTimesForFrequency(medicine.time, medicine.frequency);

		const totalDays = medicine.durationDays;

		for (let day = 0; day < totalDays; day++) {
			for (const time of times) {
				const triggerDate = new Date();
				triggerDate.setDate(triggerDate.getDate() + day);
				triggerDate.setHours(time.getHours(), time.getMinutes(), 0, 0);

				if (triggerDate <= new Date()) continue;

				const id = await Notifications.scheduleNotificationAsync({
					content: {
						title: "Medicine Reminder 💊",
						body: `${medicine.name} (${medicine.dose})`,
						channelId: "default",
					},
					trigger: {
						type: Notifications.SchedulableTriggerInputTypes.DATE,
						date: triggerDate,
					},
				});

				notifications.push(id);
			}
		}

		return notifications;
	};

	const STORAGE_KEY = "MEDIVA_REMINDERS";
	const saveReminder = async (medicine, notificationIds) => {
		const existing = await AsyncStorage.getItem(STORAGE_KEY);
		const reminders = existing ? JSON.parse(existing) : [];

		const newReminder = {
			id: Date.now().toString(),
			...medicine,
			notificationIds,
			createdAt: new Date().toISOString(),
			active: true,
		};

		const updated = [newReminder, ...reminders];

		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

		return newReminder;
	};

	const saveReminderToFirebase = async (userId, reminder) => {
		const ref = collection(db, "users", userId, "reminders");

		const docRef = await addDoc(ref, {
			name: reminder.name,
			form: reminder.form,
			dose: reminder.dose,
			frequency: reminder.frequency,
			durationDays: reminder.durationDays,
			intake: reminder.intake,
			time: reminder.time,
			notificationIds: reminder.notificationIds,
			active: true,
			createdAt: serverTimestamp(),
		});

		// 🔑 return Firestore document ID
		return docRef.id;
	};

	const patchLocalReminder = async (localId, firestoreId) => {
		const data = await AsyncStorage.getItem(STORAGE_KEY);
		const reminders = data ? JSON.parse(data) : [];

		const updated = reminders.map((r) =>
			r.id === localId ? { ...r, firestoreId } : r,
		);

		await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
	};

	const handleSaveReminder = async () => {
		if (!medicine.name.trim()) {
			Alert.alert("Medicine name is required");
			return;
		}
		setLoading(true);
		try {
			const notificationIds = await scheduleNotifications(medicine);
			// 1️⃣ Save locally
			const localReminder = await saveReminder(medicine, notificationIds);
			// 2️⃣ Save to Firestore and get ID
			const firestoreId = await saveReminderToFirebase(user.uid, localReminder);
			// 3️⃣ Patch local reminder with firestoreId
			await patchLocalReminder(localReminder.id, firestoreId);

			Alert.alert("Reminder set successfully");
			router.back();
			setLoading(false);
		} catch (err) {
			console.error(err);
			Alert.alert("Failed to set reminder");
		}
	};

	// AsyncStorage.removeItem(STORAGE_KEY);

	return (
		<>
			<Stack.Screen
				options={{
					headerShown: true,
					header: () => (
						<CustomHeader
							title="Add Reminders"
							onBack={() => {
								if (router.canGoBack()) {
									router.back();
								} else {
									router.replace("/(tabs)/reminders");
								}
							}}
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
							<View style={styles.inputsCont}>
								<View>
									<InterText weight="medium" style={styles.inputLabel}>
										Medicine Name
									</InterText>
									<TextInput
										style={styles.inputBox}
										placeholderTextColor={"#a7a7a7"}
										placeholder="Medicine name"
										autoCapitalize="words"
										value={medicine.name}
										onChangeText={(text) => updateMedicine("name", text)}
									/>
								</View>
								<View style={{ position: "relative" }}>
									<InterText weight="medium" style={styles.inputLabel}>
										Medicine Form
									</InterText>
									<View style={styles.dropDown}>
										<InterText style={{ fontSize: 18 }}>
											{FORM_LABEL[medicine.form]}
										</InterText>
										<TouchableOpacity
											onPress={() =>
												setOpenDropDown((prev) => (prev === 1 ? null : 1))
											}
											style={{ padding: 18, margin: -18 }}
										>
											<Feather
												name={
													openDropDown === 1 ? "chevron-up" : "chevron-down"
												}
												size={24}
											></Feather>
										</TouchableOpacity>
									</View>
									{openDropDown === 1 && (
										<DropDown
											items={[
												{ label: "Tablet", value: "tablet" },
												{ label: "Capsule", value: "capsule" },
												{ label: "Syrup (ml)", value: "syrup" },
												{ label: "Drops", value: "drops" },
												{ label: "Injection", value: "injection" },
												{ label: "Cream / Ointment", value: "cream" },
											]}
											onSelect={(val) => {
												updateMedicine("form", val);
												setOpenDropDown(null);
											}}
										/>
									)}
								</View>

								<View>
									<InterText weight="medium" style={styles.inputLabel}>
										Schedule
									</InterText>
									<View style={styles.sheduleItemCont}>
										<View style={styles.sheduleItem}>
											<InterText style={{ fontSize: 18 }}>Dosage</InterText>
											<View
												style={{
													flexDirection: "row",
													justifyContent: "space-between",
													alignItems: "center",
													gap: 14,
												}}
											>
												<TouchableOpacity
													style={{
														backgroundColor: "#0095b6",
														padding: 4,
														borderRadius: 40,
													}}
													onPress={() =>
														setMedicine((prev) => ({
															...prev,
															dose: Math.max(1, prev.dose - 1),
														}))
													}
												>
													<Feather name="minus" size={20} color={"#fff"} />
												</TouchableOpacity>

												<InterText
													style={{
														fontSize: 18,
														width: 24,
														textAlign: "center",
													}}
												>
													{medicine.dose}
												</InterText>

												<TouchableOpacity
													style={{
														backgroundColor: "#0095b6",
														padding: 4,
														borderRadius: 40,
													}}
													onPress={() =>
														setMedicine((prev) => ({
															...prev,
															dose: prev.dose + 1,
														}))
													}
												>
													<Feather name="plus" size={20} color="#fff" />
												</TouchableOpacity>
											</View>
										</View>

										<View>
											<View style={styles.sheduleItem}>
												<InterText style={{ fontSize: 18 }}>
													Frequency
												</InterText>
												<View
													style={{
														flexDirection: "row",
														justifyContent: "space-between",
														alignItems: "center",
														gap: 20,
													}}
												>
													<TouchableOpacity
														style={{
															padding: 4,
															borderRadius: 40,
															flexDirection: "row",
															alignItems: "center",
															gap: 6,
														}}
														onPress={() =>
															setOpenDropDown((prev) => (prev === 2 ? null : 2))
														}
													>
														<InterText
															style={{ fontSize: 18, color: "#007d98" }}
														>
															{FREQ_LABEL[medicine.frequency]}
														</InterText>
														<Feather
															name={
																openDropDown === 2
																	? "chevron-up"
																	: "chevron-down"
															}
															size={24}
															color={"#0095b6"}
														/>
													</TouchableOpacity>
												</View>
											</View>
											{openDropDown === 2 && (
												<DropDown
													items={[
														{ label: "Once daily", value: "once" },
														{ label: "Twice daily", value: "twice" },
														{ label: "Thrice daily", value: "thrice" },
														{ label: "Every 6 hours", value: "6h" },
														{ label: "Every 8 hours", value: "8h" },
														{ label: "Every 12 hours", value: "12h" },
													]}
													onSelect={(val) => {
														updateMedicine("frequency", val);
														setOpenDropDown(null);
													}}
												/>
											)}
										</View>

										<View>
											<View style={styles.sheduleItem}>
												<InterText style={{ fontSize: 18 }}>Time</InterText>
												<View
													style={{
														flexDirection: "row",
														justifyContent: "space-between",
														alignItems: "center",
														gap: 20,
													}}
												>
													<TouchableOpacity
														style={{
															padding: 4,
															borderRadius: 40,
															flexDirection: "row",
															alignItems: "center",
															gap: 6,
														}}
														onPress={() =>
															setOpenDropDown((prev) => (prev === 3 ? null : 3))
														}
													>
														<InterText
															style={{ fontSize: 18, color: "#007d98" }}
														>
															{timeText}
														</InterText>
														<Feather name="clock" size={20} color={"#0095b6"} />
													</TouchableOpacity>
												</View>
											</View>
											{openDropDown === 3 && (
												<DateTimePicker
													value={medicine.time}
													mode="time"
													onChange={(event, selected) => {
														setOpenDropDown(null);

														if (selected) {
															setMedicine((prev) => ({
																...prev,
																time: selected,
															}));
														}
													}}
												/>
											)}
										</View>

										<View>
											<View style={styles.sheduleItem}>
												<InterText style={{ fontSize: 18 }}>Duration</InterText>
												<View
													style={{
														flexDirection: "row",
														justifyContent: "space-between",
														alignItems: "center",
														gap: 20,
													}}
												>
													<TouchableOpacity
														style={{
															padding: 4,
															borderRadius: 40,
															flexDirection: "row",
															alignItems: "center",
															gap: 6,
														}}
														onPress={() =>
															setOpenDropDown((prev) => (prev === 4 ? null : 4))
														}
													>
														<InterText
															style={{ fontSize: 18, color: "#007d98" }}
														>
															{medicine.durationDays === 30
																? "1 month"
																: `${medicine.durationDays} days`}
														</InterText>
														<Feather
															name={
																openDropDown === 4
																	? "chevron-up"
																	: "chevron-down"
															}
															size={24}
															color={"#0095b6"}
														/>
													</TouchableOpacity>
												</View>
											</View>
											{openDropDown === 4 && (
												<DropDown
													items={[
														{ label: "3 days", value: 3 },
														{ label: "5 days", value: 5 },
														{ label: "7 days", value: 7 },
														{ label: "10 days", value: 10 },
														{ label: "14 days", value: 14 },
														{ label: "1 month", value: 30 },
													]}
													onSelect={(val) => {
														updateMedicine("durationDays", val);
														setOpenDropDown(null);
													}}
												/>
											)}
										</View>

										<View>
											<View style={styles.sheduleItem}>
												<InterText style={{ fontSize: 18 }}>
													Intake Method
												</InterText>
												<View
													style={{
														flexDirection: "row",
														justifyContent: "space-between",
														alignItems: "center",
														gap: 20,
													}}
												>
													<TouchableOpacity
														style={{
															padding: 4,
															borderRadius: 40,
															flexDirection: "row",
															alignItems: "center",
															gap: 6,
														}}
														onPress={() =>
															setOpenDropDown((prev) => (prev === 5 ? null : 5))
														}
													>
														<InterText
															style={{ fontSize: 18, color: "#007d98" }}
														>
															{INTAKE_LABEL[medicine.intake]}
														</InterText>
														<Feather
															name={
																openDropDown === 5
																	? "chevron-up"
																	: "chevron-down"
															}
															size={24}
															color={"#0095b6"}
														/>
													</TouchableOpacity>
												</View>
											</View>
											{openDropDown === 5 && (
												<DropDown
													items={[
														{ label: "Before meal", value: "before_meal" },
														{ label: "After meal", value: "after_meal" },
														{ label: "With meal", value: "with_meal" },
														{ label: "Empty stomach", value: "empty_stomach" },
														{ label: "At bedtime", value: "bedtime" },
													]}
													onSelect={(val) => {
														updateMedicine("intake", val);
														setOpenDropDown(null);
													}}
												/>
											)}
										</View>
									</View>
								</View>
							</View>
							<View style={{ marginTop: 28 }}>
								<TouchableOpacity
									style={styles.saveBtn}
									onPress={handleSaveReminder}
									disabled={loading}
								>
									<InterText
										weight="medium"
										style={{ fontSize: 20, color: "#fff", textAlign: "center" }}
									>
										{loading ? "Saving..." : "Save"}
									</InterText>
								</TouchableOpacity>
							</View>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</View>
		</>
	);
}

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
		paddingVertical: 24,
	},

	inputsCont: {
		flexDirection: "column",
		gap: 20,
	},

	inputLabel: {
		fontSize: 16,
		marginBottom: 6,
		marginLeft: 6,
	},
	inputBox: {
		backgroundColor: "#cbcbcb34",
		fontSize: 18,
		padding: 18,
		borderRadius: 10,
	},

	dropDown: {
		backgroundColor: "#cbcbcb34",
		fontSize: 18,
		padding: 18,
		borderRadius: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		overflow: "hidden",
	},

	sheduleItemCont: {
		padding: 6,
		marginTop: 8,
		flexDirection: "column",
		gap: 30,
	},
	sheduleItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},

	saveBtn: {
		backgroundColor: "#0095b6",
		padding: 16,
		borderRadius: 10,
	},
});
