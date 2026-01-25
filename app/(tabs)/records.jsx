import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from "expo-router";

export default function records() {
  return (
    <View style={styles.container}>

        <View style={styles.floatingCont}>
            <TouchableOpacity onPress={() => router.push("/addRecords")} style={styles.floatingBtn} >
                <Feather name="plus" size={30} color="#FFF" />
            </TouchableOpacity>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
    container: {
		flex: 1,
		backgroundColor: "#fff",
		padding: 24,
        position: "relative"
	},

    floatingCont: {
        position: "absolute",
        bottom: 30,
        right: 30,
        
    },

    floatingBtn: {
        backgroundColor: "#0095b6",
        padding: 14,
                borderRadius: 10,

    }
})