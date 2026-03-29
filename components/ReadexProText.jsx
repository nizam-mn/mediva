import { Text, StyleSheet } from "react-native";

export default function ReadexProText({ style, weight = "regular", ...props }) {
	return <Text {...props} style={[styles.base, styles[weight], style]} />;
}

const styles = StyleSheet.create({
	base: {
		fontSize: 14,
		color: "#3b3b3b",
	},
	regular: {
		fontFamily: "ReadexPro_400Regular",
	},
	medium: { fontFamily: "ReadexPro_500Medium" },
	semibold: {
		fontFamily: "ReadexPro_600SemiBold",
	},
	bold: {
		fontFamily: "ReadexPro_700Bold",
	},
});
