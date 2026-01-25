import InterText from "@/components/InterText";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
	const { profile, logout } = useAuth();

    const handleLogout = async () => {
		Alert.alert("Logout", "Are you sure you want to logout?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Logout",
				style: "destructive",
				onPress: async () => {
					try {
						await logout();
						// router.replace("/login");
					} catch (error) {
						Alert.alert("Error", "Logout failed");
					}
				},
			},
		]);
	};

	return (
		<View style={styles.container}>
			<View style={styles.card}>
                <SafeAreaView>
				<InterText weight="semibold" style={styles.title}>
					{profile?.fullName}
				</InterText>
				</SafeAreaView>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",

	},
	card: {
        height: 240,
		backgroundColor: "#0095b6",
		borderBottomLeftRadius: 42,
		borderBottomRightRadius: 42,
		padding: 24,
		gap: 20,
        flexDirection: "row",
        alignItems: "center"
	},
	title: {
		fontSize: 28,
		color: "#ffffff",
	},
	infoRow: {
		gap: 4,
	},
	label: {
		fontSize: 14,
		color: "#666",
	},
	value: {
		fontSize: 16,
		color: "#111",
		// fontWeight: "600",
	},
	logoutButton: {
		marginTop: 16,
		backgroundColor: "#FF3B30",
		paddingVertical: 14,
		borderRadius: 8,
		alignItems: "center",
	},
	logoutButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});
