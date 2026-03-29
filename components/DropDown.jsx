import ReadexProText from "@/components/ReadexProText";
import {
    FlatList,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

export default function DropDown({
	items,
	onSelect,
	initialIndex = 0,
	isActive,
	itemHeight = 48,
}) {
	return (
		<ScrollView style={styles.menu}>
			<FlatList
				data={items}
				keyExtractor={(item, index) =>
					item.id ?? item.value?.id ?? `${item.label}-${index}`
				}
				initialScrollIndex={initialIndex}
				getItemLayout={(_, index) => ({
					length: itemHeight,
					offset: itemHeight * index,
					index,
				})}
				// style={{maxHeight: 286}}
				contentContainerStyle={{ gap: 2.5 }}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				renderItem={({ item }) => {
					const active = isActive?.(item);

					return (
						<TouchableOpacity
							onPress={() => onSelect(item.value ?? item)}
							style={[styles.optionItem]}
						>
							<ReadexProText
								style={[styles.option, active && styles.activeItem]}
							>
								{item.label ?? item}
							</ReadexProText>
						</TouchableOpacity>
					);
				}}
			/>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	menu: {
		backgroundColor: "#fff",
		marginTop: 8,
		borderRadius: 10,
		overflow: "hidden",
		flexDirection: "column",
		gap: 2.5,
	},

	option: {
		backgroundColor: "#c9c9c954",
		fontSize: 16,
		padding: 16,
	},

	activeItem: {
		backgroundColor: "#0095b6",
		color: "#fff",
	},
});
