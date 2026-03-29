import {
	View,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Modal,
	Linking,
    ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import ReadexProText from "@/components/ReadexProText";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { onSnapshot, query, orderBy } from "firebase/firestore";

export default function Records() {
	const { user } = useAuth();

	const [docs, setDocs] = useState([]);
	const [selected, setSelected] = useState(null);

	/* ---------------- FETCH ---------------- */

	useEffect(() => {
	if (!user?.uid) return;

	const q = query(
		collection(db, "users", user.uid, "documents"),
		orderBy("created_at", "desc") // 🔥 latest first
	);

	const unsubscribe = onSnapshot(
		q,
		(snapshot) => {
			const data = snapshot.docs.map((d) => ({
				id: d.id,
				...d.data(),
			}));

			setDocs(data);
		},
		(error) => {
			console.error("Realtime error:", error);
		}
	);

	// 🔥 cleanup (VERY IMPORTANT)
	return () => unsubscribe();

}, [user]);

	const formatDate = (timestamp) => {
		if (!timestamp) return "";

		let date;

		// 🔹 Firestore timestamp object
		if (timestamp.seconds) {
			date = new Date(timestamp.seconds * 1000);
		}
		// 🔹 JS Date already
		else if (timestamp instanceof Date) {
			date = timestamp;
		}
		// 🔹 String (ISO or normal)
		else if (typeof timestamp === "string") {
			date = new Date(timestamp);
		}
		// 🔹 Number (milliseconds)
		else if (typeof timestamp === "number") {
			date = new Date(timestamp);
		} else {
			return "Invalid date";
		}

		if (isNaN(date)) return "Invalid date";

		return date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	};


    const getIcon = (type) => {
	switch (type) {
		case "prescription":
			return "activity"; // medical feel
		case "lab_report":
			return "droplet"; // blood test vibe
		case "scan_report":
			return "image";
		case "bill":
			return "file-text";
		default:
			return "file";
	}
};

	/* ---------------- ITEM ---------------- */

	const renderItem = ({ item }) => (
	<TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
		<View style={styles.row}>
			
			{/* ICON */}
			<View style={styles.iconBox}>
				<Feather
					name={getIcon(item.type)}
					size={28}
					color="#0095b6"
				/>
			</View>

			{/* TEXT */}
			<View style={{ flex: 1 }}>
				<ReadexProText weight="medium" style={styles.title}>
					{item.title}
				</ReadexProText>

				<ReadexProText style={styles.typedate}>
					{item.type?.replace("_", " ").toUpperCase()} |{" "}
					{formatDate(item.created_at)}
				</ReadexProText>
			</View>

		</View>
	</TouchableOpacity>
);

    // console.log(selected)

	return (
		<View style={styles.container}>
			{/* LIST */}
			<FlatList
				data={docs}
				keyExtractor={(item) => item.id}
				renderItem={renderItem}
				contentContainerStyle={{ paddingBottom: 100 }}
			/>

			{/* FLOAT BUTTON */}
			<View style={styles.floatingCont}>
				<TouchableOpacity
					onPress={() => router.push("/addRecords")}
					style={styles.floatingBtn}
				>
					<Feather name="plus" size={30} color="#FFF" />
				</TouchableOpacity>
			</View>

			{/* MODAL */}
			<Modal
				backdropColor={"#00000069"}
				visible={!!selected}
				animationType="slide"
			>
				<View style={styles.modal}>
					{/* HEADER */}
					<View style={styles.modalHeader}>
						<ReadexProText style={styles.modalTitle}>
							{selected?.title}
						</ReadexProText>

						<TouchableOpacity onPress={() => setSelected(null)}>
							<Feather name="x" size={24} />
						</TouchableOpacity>
					</View>

					{/* TYPE */}
					<ReadexProText style={styles.modalType}>
						{selected?.type?.replace("_", " ").toUpperCase()}
					</ReadexProText>
                    <ScrollView>
					{/* SUMMARY */}
					{selected?.type === "prescription" ? (
						<>
							{/* ---------------- PRESCRIPTION ---------------- */}

							{selected?.analysis && (
								<View>
									<ReadexProText weight="medium" style={{fontSize: 16, marginBottom: 8}}>Prescripted Medicines</ReadexProText>

									{selected.analysis.medicines?.map((m, i) => (
										<View key={i} style={styles.med}>
											<ReadexProText style={styles.bold}>{m.name || "Unknown"}</ReadexProText>
											<ReadexProText>Dosage: {m.dosage || "-"}</ReadexProText>
											<ReadexProText>Frequency: {m.frequency || "-"}</ReadexProText>
											<ReadexProText>Duration: {m.duration || "-"}</ReadexProText>
											<ReadexProText>{m.instructions || ""}</ReadexProText>
										</View>
									))}

									{selected.analysis.doctor_notes && (
										<ReadexProText>Notes: {selected.analysis.doctor_notes}</ReadexProText>
									)}

									{!!selected.analysis.warnings && (
										<ReadexProText style={{ color: "red" }}>
											Warnings: {selected.analysis.warnings}
										</ReadexProText>
									)}
								</View>
							)}

                            <View style={{height: 1, width: "100%", backgroundColor: '#c1c1c1', marginVertical: 12}} ></View>
							{/* ---------------- MEDICINE DETAILS ---------------- */}

							{selected?.medicine_details?.length > 0 && (
								<View>
									<ReadexProText weight="medium" style={{fontSize: 16, marginBottom: 8}}>Medicine Information</ReadexProText>

									{selected.medicine_details.map((m, i) => (
										<View key={i} style={{marginBottom: 8}}>
											<ReadexProText weight="medium" style={{fontSize: 16}}>{m.name || "Unknown"}</ReadexProText>
											<ReadexProText>Use: {m.use || "-"}</ReadexProText>
											<ReadexProText>How it works: {m.how_it_works || "-"}</ReadexProText>
											<ReadexProText>Side effects: {m.side_effects || "-"}</ReadexProText>
											<ReadexProText>Precautions: {m.precautions || "-"}</ReadexProText>
										</View>
									))}
								</View>
							)}
						</>
					) : (
						<>
							<ReadexProText style={styles.sectionTitle}>Summary</ReadexProText>
							<ReadexProText style={styles.modalReadexProText}>
								{selected?.summary || "No summary"}
							</ReadexProText>

							{/* NOTES */}
							<ReadexProText style={styles.sectionTitle}>
								Important Notes
							</ReadexProText>
							{selected?.important_notes?.length ? (
								selected.important_notes.map((n, i) => (
									<ReadexProText key={i} style={styles.note}>
										• {n}
									</ReadexProText>
								))
							) : (
								<ReadexProText style={styles.modalReadexProText}>
									No notes
								</ReadexProText>
							)}
						</>
					)}

                    </ScrollView>

					{/* LINK */}
					<TouchableOpacity
						style={styles.openBtn}
						onPress={() => Linking.openURL(selected?.file_url)}
					>
						<ReadexProText style={styles.openReadexProText}>
							Open Document
						</ReadexProText>
					</TouchableOpacity>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		padding: 24,
		position: "relative",
	},
    row: {
	flexDirection: "row",
	alignItems: "center",
},

iconBox: {
	width: 55,
	height: 55,
	borderRadius: 12,
	backgroundColor: "#e6f7fb",
	justifyContent: "center",
	alignItems: "center",
	marginRight: 12,
},
	card: {
		backgroundColor: "#fff",
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#eee",
	},

	title: {
		fontSize: 18,
	},

	typedate: {
		fontSize: 14,
		color: "#989898",
		marginTop: 4,
	},

	/* MODAL */

	modal: {
		flex: 1,
		marginTop: 100,
		padding: 24,
		backgroundColor: "#fff",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
	},

	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},

	modalTitle: {
		fontSize: 18,
		fontWeight: "700",
	},

	modalType: {
		color: "#888",
		marginBottom: 10,
	},

	sectionTitle: {
		fontSize: 14,
		fontWeight: "600",
		marginTop: 16,
	},

	modalReadexProText: {
		marginTop: 6,
		color: "#444",
		lineHeight: 20,
	},

	note: {
		marginTop: 4,
		color: "#444",
	},

	openBtn: {
		marginTop: 20,
		backgroundColor: "#0095b6",
		padding: 14,
		borderRadius: 10,
	},

	openReadexProText: {
		color: "#fff",
		textAlign: "center",
		fontWeight: "600",
	},

	floatingCont: {
		position: "absolute",
		bottom: 50,
		right: 35,
	},

	floatingBtn: {
		backgroundColor: "#0095b6",
		padding: 14,
		borderRadius: 10,
	},
});
