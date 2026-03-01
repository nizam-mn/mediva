import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import InterText from "@/components/InterText";

export default function Profile() {
	const { user, logout, profile } = useAuth();

	const [loading, setLoading] = useState(true);

	const blurhash =
		"|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

	// useEffect(() => {
	// 	if (!user) return;

	// 	const fetchProfile = async () => {
	// 		try {
	// 			const ref = doc(db, "users", user.uid);
	// 			const snap = await getDoc(ref);

	// 			if (snap.exists()) {
	// 				setProfile(snap.data());
	// 			}
	// 		} finally {
	// 			setLoading(false);
	// 		}
	// 	};

	// 	fetchProfile();
	// }, [user]);

	const handleLogout = () => {
		Alert.alert("Logout", "Are you sure you want to logout?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Logout",
				style: "destructive",
				onPress: async () => {
					await logout();
				},
			},
		]);
	};

	return (
		<ScrollView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.avatar}>
					<Image
						style={styles.profileImage}
						// source={currentUser?.profileImage}
						placeholder={{ blurhash }}
						// contentFit="cover"
						transition={500}
					/>
				</View>
				<InterText weight="semibold" style={styles.name}>{profile?.fullName || "Mediva User"}</InterText>
				{/* <Text style={styles.email}>{user?.email}</Text> */}
			</View>

			{/* Profile Info */}
			<View style={styles.card}>
				<ProfileRow label="Phone Number" value={profile?.phoneNumber} />
				<ProfileRow label="Email" value={user?.email} />
				<ProfileRow
					label="Date of Birth"
					value={
						profile?.dob
							? new Date(profile.dob.seconds * 1000).toLocaleDateString(
									"en-GB",
									{
										day: "numeric",
										month: "long",
										year: "numeric",
									},
								)
							: null
					}
				/>

				{/* <ProfileRow label="Role" value="Patient" /> */}
				<ProfileRow label="Gender" value={profile?.gender} />
				<ProfileRow label="Account Status" value="Active" />
			</View>

			{/* Actions */}
			<View style={styles.actions}>
				<TouchableOpacity style={styles.actionBtn}>
					<Feather name="edit-3" size={18} color="#0095b6" />
					<InterText style={styles.actionText}>Edit Profile</InterText>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.actionBtn, styles.logoutBtn]}
					onPress={handleLogout}
				>
					<Feather name="log-out" size={18} color="#FF3B30" />
					<InterText style={[styles.actionText, { color: "#FF3B30" }]}>Logout</InterText>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
}

/* ---------- Small reusable row ---------- */
function ProfileRow({ label, value }) {
	return (
		<View style={styles.row}>
			<InterText style={styles.rowLabel}>{label}</InterText>
			<InterText style={styles.rowValue}>{value || "-"}</InterText>
		</View>
	);
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#ffffff",
		paddingHorizontal: 20,
		paddingVertical: 24,
	},

	header: {
		alignItems: "center",
		// marginTop: 24,
		marginBottom: 32,
	},

	avatar: {
		width: 100,
		height: 100,
		borderRadius: 100,
		// backgroundColor: "#0095b6",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
		overflow: "hidden",
	},
	profileImage: {
		width: "100%",
		height: "100%",
		borderRadius: 100,
	},

	name: {
		fontSize: 22,
		// fontWeight: "600",
		color: "#111",
	},

	email: {
		fontSize: 14,
		color: "#666",
		marginTop: 4,
	},

	card: {
		backgroundColor: "#eee",
		borderRadius: 14,
		// padding: 16,
		marginBottom: 24,
		borderWidth: 1,
		borderColor: "#eee",
		overflow: "hidden",
		flexDirection: "column",
		gap: 1,
	},

	row: {
		paddingVertical: 12,
		paddingHorizontal: 16,

		backgroundColor: "#fff",
		// borderBottomWidth: 1,
		// borderBottomColor: "#eee",
	},

	rowLabel: {
		fontSize: 13,
		color: "#888",
		marginBottom: 4,
	},

	rowValue: {
		fontSize: 16,
		color: "#111",
		fontWeight: "500",
	},

	actions: {
		gap: 12,
	},

	actionBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		backgroundColor: "#fff",
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#eee",
	},

	actionText: {
		fontSize: 16,
		color: "#0095b6",
		fontWeight: "500",
	},

	logoutBtn: {
		borderColor: "#FFD6D3",
		backgroundColor: "#FFF5F4",
	},
});
