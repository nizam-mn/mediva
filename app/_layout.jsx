import { Redirect, router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";
import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useFonts } from "@expo-google-fonts/inter/useFonts";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { CustomHeader } from "@/components/headers";

function RootLayoutNav() {
	const { user, loading } = useAuth();
	const [profileCompleted, setProfileCompleted] = useState(null);

	const [fontsLoaded] = useFonts({
		Inter_400Regular,
		Inter_500Medium,
		Inter_600SemiBold,
		Inter_700Bold,
	});

	// 🔹 Listen to user profile
	useEffect(() => {
		if (!user) {
			setProfileCompleted(null);
			return;
		}

		const ref = doc(db, "users", user.uid);
		return onSnapshot(ref, (snap) => {
			setProfileCompleted(snap.data()?.profileCompleted ?? false);
		});
	}, [user]);

	// 🔄 Global loading (auth + profile)
	if (loading || (user && profileCompleted === null)) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	if (!fontsLoaded) return null;

	return (
		<>
			<Stack screenOptions={{ headerShown: false }}>
				{/* AUTH SCREENS */}
				<Stack.Protected guard={!user}>
					<Stack.Screen name="login" />
					<Stack.Screen name="register" />
				</Stack.Protected>

				{/* LOGGED IN BUT PROFILE INCOMPLETE */}
				<Stack.Protected guard={!!user && profileCompleted === false}>
					<Stack.Screen name="completeProfile" />
				</Stack.Protected>
				{/* <Stack.Protected guard={!!user && profileCompleted === true}>
					<Stack.Screen
						options={{
							header: ({ navigation }) => (
								<CustomHeader
									title={"Add Records"}
									onBack={() => router.push("/(tabs)/records")}
								/>
							),
							title: "Add Medical Record",
							headerShown: true,
							headerBackTitleVisible: false,
						}}
						name="addRecords"
					/>
				</Stack.Protected> */}

				{/* FULLY AUTHENTICATED */}
				<Stack.Protected guard={!!user && profileCompleted === true}>
					<Stack.Screen name="(tabs)" />
				</Stack.Protected>
			</Stack>

			<StatusBar style="auto" />
		</>
	);
}

export default function RootLayout() {
	return (
		<AuthProvider>
			<RootLayoutNav />
		</AuthProvider>
	);
}
