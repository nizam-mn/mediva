import { Text, StyleSheet } from "react-native";

export default function InterText({ style, weight = "regular", ...props }) {
	return <Text {...props} style={[styles.base, styles[weight], style]} />;
}

const styles = StyleSheet.create({
	base: {
		fontSize: 14,
		color: "#000",
	},
	regular: {
		fontFamily: "Inter_400Regular",
	},
	medium: { fontFamily: "Inter_500Medium" },
	semibold: {
		fontFamily: "Inter_600SemiBold",
	},
	bold: {
		fontFamily: "Inter_700Bold",
	},
});
