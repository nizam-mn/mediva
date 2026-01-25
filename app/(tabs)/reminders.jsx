import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
// import * as Notifications from "expo-notifications";

const STORAGE_KEY = "MEDIVA_REMINDERS";

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//   }),
// });

export default function reminders() {
	const [medicine, setMedicine] = useState("");
	const [time, setTime] = useState(new Date());
	const [showPicker, setShowPicker] = useState(false);
	//   const [reminders, setReminders] = useState([]);

	//   /* -------------------- PERMISSION -------------------- */
	//   useEffect(() => {
	//     Notifications.requestPermissionsAsync();
	//     loadReminders();
	//   }, []);

	//   /* -------------------- STORAGE -------------------- */
	//   const loadReminders = async () => {
	//     const data = await AsyncStorage.getItem(STORAGE_KEY);
	//     if (data) setReminders(JSON.parse(data));
	//   };

	//   const saveReminders = async (data) => {
	//     setReminders(data);
	//     await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	//   };

	//   /* -------------------- SCHEDULE -------------------- */
	//   const scheduleReminder = async () => {
	//     if (!medicine.trim()) {
	//       Alert.alert("Enter medicine name");
	//       return;
	//     }

	//     const triggerDate = new Date(time);

	//     if (triggerDate <= new Date()) {
	//       Alert.alert("Time must be in the future");
	//       return;
	//     }

	//     const notificationId =
	//       await Notifications.scheduleNotificationAsync({
	//         content: {
	//           title: "Medicine Reminder 💊",
	//           body: medicine,
	//         },
	//         trigger: triggerDate,
	//       });

	//     const newReminder = {
	//       id: Date.now().toString(),
	//       medicine,
	//       time: triggerDate.toISOString(),
	//       notificationId,
	//       taken: false,
	//     };

	//     const updated = [newReminder, ...reminders];
	//     await saveReminders(updated);

	//     setMedicine("");
	//   };

	//   /* -------------------- MARK AS TAKEN -------------------- */
	//   const markTaken = async (id) => {
	//     const updated = reminders.map((r) =>
	//       r.id === id ? { ...r, taken: true } : r
	//     );
	//     await saveReminders(updated);
	//   };

	//   /* -------------------- DELETE -------------------- */
	//   const deleteReminder = async (item) => {
	//     await Notifications.cancelScheduledNotificationAsync(
	//       item.notificationId
	//     );
	//     const updated = reminders.filter((r) => r.id !== item.id);
	//     await saveReminders(updated);
	//   };

	//   /* -------------------- UI -------------------- */
	//   const renderItem = ({ item }) => {
	//     const timeText = new Date(item.time).toLocaleTimeString([], {
	//       hour: "2-digit",
	//       minute: "2-digit",
	//     });

	//     return (
	//       <View style={styles.card}>
	//         <View style={{ flex: 1 }}>
	//           <Text style={styles.medName}>{item.medicine}</Text>
	//           <Text style={styles.medSub}>{timeText}</Text>
	//         </View>

	//         {!item.taken ? (
	//           <TouchableOpacity
	//             style={styles.check}
	//             onPress={() => markTaken(item.id)}
	//           >
	//             <Feather name="check" size={18} color="#fff" />
	//           </TouchableOpacity>
	//         ) : (
	//           <Text style={styles.done}>Taken</Text>
	//         )}

	//         <TouchableOpacity onPress={() => deleteReminder(item)}>
	//           <Feather name="trash" size={18} color="#FF3B30" />
	//         </TouchableOpacity>
	//       </View>
	//     );
	//   };

	return (
		<View style={styles.container}>
			{/* HEADER */}
			<Text style={styles.title}>Medicine Reminder</Text>

			{/* INPUT */}
			{/* <TextInput
        style={styles.input}
        placeholder="Medicine name"
        value={medicine}
        onChangeText={setMedicine}
      />

      <TouchableOpacity
        style={styles.timeBtn}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.timeText}>
          {time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <Feather name="clock" size={18} />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={time}
          mode="time"
          onChange={(e, selected) => {
            setShowPicker(false);
            if (selected) setTime(selected);
          }}
        />
      )}

      <TouchableOpacity style={styles.addBtn}> onPress={scheduleReminder}
        <Text style={styles.addText}>Add Reminder</Text>
      </TouchableOpacity>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No reminders yet</Text>
        }
        contentContainerStyle={{ paddingTop: 20 }}
      /> */}
		</View>
	);
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: "#F9FAFB",
	},
	title: {
		fontSize: 24,
		fontWeight: "600",
		marginBottom: 20,
	},
	input: {
		backgroundColor: "#fff",
		padding: 14,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		marginBottom: 12,
	},
	timeBtn: {
		flexDirection: "row",
		justifyContent: "space-between",
		backgroundColor: "#fff",
		padding: 14,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		marginBottom: 12,
	},
	timeText: {
		fontSize: 16,
	},
	addBtn: {
		backgroundColor: "#2563EB",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
		marginBottom: 20,
	},
	addText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
	card: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#fff",
		padding: 14,
		borderRadius: 12,
		marginBottom: 10,
		gap: 12,
	},
	medName: {
		fontSize: 16,
		fontWeight: "500",
	},
	medSub: {
		fontSize: 13,
		color: "#6B7280",
	},
	check: {
		backgroundColor: "#22C55E",
		padding: 6,
		borderRadius: 20,
	},
	done: {
		color: "#22C55E",
		fontWeight: "600",
	},
	empty: {
		textAlign: "center",
		color: "#9CA3AF",
		marginTop: 40,
	},
});
