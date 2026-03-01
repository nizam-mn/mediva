import InterText from "@/components/InterText";
import { useAuth } from "@/contexts/AuthContext";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import drMedu from "@/assets/images/drMedu.png"

export default function HomeScreen() {
	const { profile, logout } = useAuth();

	const handleLogout = async () => {
		Alert.alert("Logout", "Are you sure you want to logout?", [
			{ InterText: "Cancel", style: "cancel" },
			{
				InterText: "Logout",
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
			<View style={styles.featureBtn}>
				<View>
					<TouchableOpacity
						onPress={() => router.push("/prescriptionAnalyzer")}
						style={styles.ftrBtn}
					>
						<View style={styles.ftrBtnIcon} >
							<MaterialIcons name="document-scanner" size={36} color="#0095b6" />
						</View>
						<InterText>Analyzer</InterText>
					</TouchableOpacity>
				</View>
				<View>
					<TouchableOpacity
						onPress={() => router.push("/medicalChatbot")}
						style={styles.ftrBtn}
					>
						<View style={styles.ftrBtnIcon} >
							{/* <FontAwesome6 name="user-doctor" size={36} color="#0095b6" /> */}
                            <Image source={drMedu} style={{height: 44, width: 44}} />
						</View>
						<InterText>Dr. Medu</InterText>
					</TouchableOpacity>
				</View>
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
		alignItems: "center",
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

	featureBtn: {
		flexDirection: "row",
        paddingTop: 60,
        paddingHorizontal: 24,
        gap: 20
	},

    ftrBtn: {
        // borderWidth: .7,
        flexDirection: "column",
        alignItems: "center"
    },

    ftrBtnIcon: {
        borderWidth: 0.8, 
        height: 70,
        width: 70,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        borderColor: "#e7e7e7",
        marginBottom: 5
    }
});
