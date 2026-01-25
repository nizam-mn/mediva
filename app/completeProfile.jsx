import {
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	Alert,
	ScrollView,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { Image } from "expo-image";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";

export default function CompleteProfile() {
	const { user, logout } = useAuth();

	const [name, setName] = useState("");
	const [phoneNum, setPhoneNum] = useState("");
	const [showPicker, setShowPicker] = useState(false);
	const [dob, setDob] = useState(null);
	const [gender, setGender] = useState(null);

	const handleCompleteProfile = async () => {
		if (!name.trim()) {
			Alert.alert("Error", "Please enter your full name");
			return;
		}

		if (!dob) {
			Alert.alert("Error", "Please select your date of birth");
			return;
		}

		if (!gender) {
			Alert.alert("Error", "Please select your gender");
			return;
		}

		try {
			await updateDoc(doc(db, "users", user.uid), {
				fullName: name.trim(),
				phoneNumber: phoneNum.trim() || null,
				dob, // Firestore will store as Timestamp
				gender,
				profileCompleted: true,
				updatedAt: serverTimestamp(),
			});
		} catch (error) {
			Alert.alert("Error", "Failed to save profile. Try again.");
		}
	};

	return (
		<SafeAreaView style={styles.container}>
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
						{/* <Text>completeProfile</Text>
					<Text>{user.email}</Text> */}

						<View style={styles.imagecont}>
							<Image style={styles.image} />
						</View>

						<View style={styles.inputsCont}>
							<View>
								<Text style={styles.inputLabel}>Full Name</Text>
								<TextInput
									style={styles.inputBox}
									placeholderTextColor={"#a7a7a7"}
									placeholder="Full name"
									autoCapitalize="words"
									value={name}
									onChangeText={setName}
								/>
							</View>
							<View>
								<Text style={styles.inputLabel}>Email</Text>
								<TextInput
									style={styles.inputBox}
									placeholderTextColor={"#a7a7a7"}
									editable={false}
									value={user.email}
									autoCapitalize="words"
								/>
							</View>
							<View>
								<Text style={styles.inputLabel}>Phone Number</Text>
								<TextInput
									style={styles.inputBox}
									placeholder="Phone number"
									placeholderTextColor={"#a7a7a7"}
									keyboardType="phone-pad"
									maxLength={10}
									value={phoneNum}
									onChangeText={setPhoneNum}
								/>
							</View>

							<View>
								<Text style={styles.inputLabel}>Date of Birth</Text>
								<TouchableOpacity
									style={styles.dateInput}
									onPress={() => setShowPicker(true)}
								>
									<Text style={{ fontSize: 16 }}>
										{dob ? dob.toDateString() : "Select Date of Birth"}
									</Text>
									<Feather name="calendar" size={22} color="#515151" />
								</TouchableOpacity>
								{showPicker && (
									<DateTimePicker
										value={dob || new Date(2000, 0, 1)}
										mode="date"
										display="calendar"
										maximumDate={new Date()} // prevents future DOB
										onChange={(event, selectedDate) => {
											setShowPicker(false);
											if (selectedDate) setDob(selectedDate);
										}}
									/>
								)}
							</View>
							<View>
								<Text style={styles.inputLabel}>Gender</Text>
								<View style={{ flexDirection: "row", gap: 20 }}>
									<TouchableOpacity
										onPress={() => setGender("Female")}
										style={[
											styles.genderOpt,
											{
												borderColor:
													gender === "Female" ? "#0095b6" : "#cbcbcb34",
											},
										]}
									>
										<Text
											style={{
												fontSize: 16,
												color: gender === "Female" ? "#0095b6" : "black",
											}}
										>
											Female
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => setGender("Male")}
										style={[
											styles.genderOpt,
											{
												borderColor:
													gender === "Male" ? "#0095b6" : "#cbcbcb34",
											},
										]}
									>
										<Text
											style={{
												fontSize: 16,
												color: gender === "Male" ? "#0095b6" : "black",
											}}
										>
											Male
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => setGender("Other")}
										style={[
											styles.genderOpt,
											{
												borderColor:
													gender === "Female" ? "#0095b6" : "#cbcbcb34",
											},
										]}
									>
										<Text
											style={{
												fontSize: 16,
												color: gender === "Other" ? "#0095b6" : "black",
											}}
										>
											Other
										</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>
						<View style={{ marginTop: 28 }}>
							<TouchableOpacity
								style={styles.completeBtn}
								onPress={handleCompleteProfile}
							>
								<Text
									style={{ fontSize: 18, color: "#fff", textAlign: "center" }}
								>
									Complete Profile
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
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
	},

	imagecont: {
		padding: 30,
		flexDirection: "row",
		justifyContent: "center",
	},

	image: {
		height: 160,
		width: 160,
		resizeMode: "contain",
		backgroundColor: "#ededed",
		borderRadius: 50,
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

	dateInput: {
		backgroundColor: "#cbcbcb34",
		padding: 18,
		borderRadius: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	genderOpt: {
		backgroundColor: "#cbcbcb34",
		padding: 16,
		borderRadius: 10,
		borderWidth: 1,
	},

	completeBtn: {
		backgroundColor: "#0095b6",
		padding: 16,
		borderRadius: 10,
	},
});
