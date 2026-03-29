import { useEffect, useMemo, useRef } from "react";
import {
	FlatList,
	Text,
	TouchableOpacity,
	StyleSheet,
	View,
} from "react-native";
import ReadexProText from "@/components/ReadexProText";

export default function HorizontalCalendar({
	currentMonth,
	selectedDate,
	onSelectDate,
}) {

	const listRef = useRef(null);
	const today = new Date();
	const ITEM_WIDTH = 64;

	/* ---------- generate current month dates ---------- */
	const calendarDates = useMemo(() => {
		const dates = [];
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();

		const daysInMonth = new Date(year, month + 1, 0).getDate();

		for (let day = 1; day <= daysInMonth; day++) {
			dates.push(new Date(year, month, day));
		}

		return dates;
	}, [currentMonth]);

	const todayIndex = calendarDates.findIndex(
		(d) => d.toDateString() === today.toDateString(),
	);

	const scrollIndex = useMemo(() => {
		// if current month = today’s month → scroll to today
		if (
			today.getMonth() === currentMonth.getMonth() &&
			today.getFullYear() === currentMonth.getFullYear()
		) {
			return today.getDate() - 1; // 0-based index
		}

		// otherwise scroll to first day
		return 0;
	}, [currentMonth]);

	useEffect(() => {
		if (listRef.current && calendarDates.length > 0) {
			listRef.current.scrollToIndex({
				index: scrollIndex,
				animated: false,
			});
		}
	}, [scrollIndex, calendarDates]);

	/* ---------- render ---------- */
	return (
		<View
			style={{
				paddingVertical: 14,
				position: "relative",
				backgroundColor: "#fff",
			}}
		>
			{/* <View style={{height: .7,  backgroundColor: "red", marginHorizontal: -16}} ></View> */}
			<FlatList
				ref={listRef}
				horizontal
				showsHorizontalScrollIndicator={false}
				data={calendarDates}
				keyExtractor={(item) => item.toDateString()}
				getItemLayout={(_, index) => ({
					length: ITEM_WIDTH,
					offset: ITEM_WIDTH * index,
					index,
				})}
				renderItem={({ item }) => {
					const isSelected =
						item.toDateString() === selectedDate.toDateString();

					const isToday = item.toDateString() === today.toDateString();

					return (
						<TouchableOpacity
							onPress={() => onSelectDate(item)}
							style={[styles.dayItem]}
						>
							<ReadexProText
								style={[styles.dayText, isSelected && { color: "#0095b6" }]}
							>
								{item.toLocaleDateString("en-US", { weekday: "short" })}
							</ReadexProText>
							<ReadexProText
								style={[
									styles.dateText,
									isSelected && styles.daySelected,
									isToday && styles.todayBorder,
								]}
							>
								{item.getDate()}
							</ReadexProText>
						</TouchableOpacity>
					);
				}}
			/>
			<View
				style={{
					height: 0.8,
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					backgroundColor: "#9b9b9b5b",
					marginHorizontal: -16,
				}}
			></View>
		</View>
	);
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
	dayItem: {
		width: 64,
		// height: 80,
		alignItems: "center",
		justifyContent: "center",
		// marginHorizontal: 6,
		paddingVertical: 2,
		// borderColor: "#000",
	},
	daySelected: {
		backgroundColor: "#0095b6",
		borderWidth: 1.5,
		borderColor: "#0095b6",
		color: "#fff",
	},
	todayBorder: {
		borderWidth: 1.5,
		borderColor: "#0095b6",
	},
	dayText: {
		fontSize: 16,
		color: "#444",
		marginBottom: 5,
	},
	dateText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#111",
		padding: 5,
		borderRadius: 48,
		borderWidth: 1.5,
		borderColor: "#fff",
		width: 40,
		height: 40,
		textAlign: "center",
	},
});
