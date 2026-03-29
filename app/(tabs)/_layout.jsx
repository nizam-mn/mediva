import React from "react";
import { Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CustomHeader } from "@/components/headers";

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				
				tabBarLabelStyle: {
					fontFamily: "ReadexPro_400Regular",
				},

				// 🔴 ICON COLORS
				tabBarActiveTintColor: "#0095b6", // blue
				tabBarInactiveTintColor: "#999", // gray

				// ⚪ TAB BAR BACKGROUND
				tabBarStyle: {
					backgroundColor: "#fff",
                    height: 76,
                    paddingTop: 6,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",

					headerShown: false,
					tabBarIcon: ({ color }) => (
						<Feather name="home" size={24} color={color} />
					),
				}}
			/>

			<Tabs.Screen
				name="records"
				options={{
					title: "Records",
					header: ({ navigation }) => (
						<CustomHeader
							title={"Medical Records"}
							onBack={navigation.goBack}
						/>
					),
					tabBarIcon: ({ color }) => (
						<Feather name="file-text" size={24} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="reminders"
				options={{
					title: "Reminders",
					header: ({ navigation }) => (
						<CustomHeader
							title={"Medicine reminder"}
							onBack={navigation.goBack}
						/>
					),
					tabBarIcon: ({ color }) => (
						<Ionicons name="alarm-outline" size={28} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					header: ({ navigation }) => (
						<CustomHeader title={"Profile"} onBack={navigation.goBack} />
					),
					tabBarIcon: ({ color }) => (
						<Feather name="user" size={24} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
