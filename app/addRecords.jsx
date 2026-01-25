import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, router } from "expo-router";
import { CustomHeader } from "@/components/headers";

export default function addRecords() {
	return (
		<>
			<Stack.Screen
				options={{
					headerShown: true,
					header: () => (
						<CustomHeader
							title="Add Records"
							onBack={() => {
								if (router.canGoBack()) {
									router.back();
								} else {
									router.replace("/(tabs)/records");
								}
							}}
						/>
					),
				}}
			/>

			<SafeAreaView style={styles.container}>
				<View>
					<Text>addRecords</Text>
				</View>
			</SafeAreaView>
		</>
	);
}

const styles = StyleSheet.create({});
