// components/CustomHeader.js
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import InterText from "@/components/InterText"

export function CustomHeader({ title, onBack }) {
	const { top } = useSafeAreaInsets();

	return (
		// <SafeAreaView st>
		<View
			style={[styles.container, { paddingTop: top + 20, paddingBottom: 20 }]}
		>
			<TouchableOpacity onPress={onBack}>
				<Feather name="arrow-left" size={26} color="#000" />
			</TouchableOpacity>

			<InterText weight="semibold" style={styles.title}>{title}</InterText>

			<View style={{ width: 24 }} />
		</View>
		// </SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		backgroundColor: "#fff",
		elevation: 4,
	},
	title: {
		flex: 1,
		fontSize: 24,
		marginLeft: 14,
	},
});
