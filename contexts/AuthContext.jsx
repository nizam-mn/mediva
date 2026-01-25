import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import {
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	const [profile, setProfile] = useState(null);
	const [profileLoading, setProfileLoading] = useState(true);

	/**
	 * Firebase Auth state listener
	 */
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
			setUser(firebaseUser);
			setLoading(false);
		});

		return unsubscribe;
	}, []);

	// Email/password login
	const login = async (email, password) => {
		await signInWithEmailAndPassword(auth, email, password);
	};

	// Email/password registration
	const register = async (email, password) => {
		return await createUserWithEmailAndPassword(auth, email, password);
	};

	// Logout
	const logout = async () => {
		await signOut(auth);
	};

	useEffect(() => {
		if (!user) {
			setProfile(null);
			setProfileLoading(false);
			return;
		}

		const fetchProfile = async () => {
			try {
				const ref = doc(db, "users", user.uid);
				const snap = await getDoc(ref);

				if (snap.exists()) {
					setProfile(snap.data());
				}
			} finally {
				setProfileLoading(false);
			}
		};

		fetchProfile();
	}, [user]);

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				profile,
				profileLoading,
				login,
				register,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

/**
 * useAuth hook
 */
export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
