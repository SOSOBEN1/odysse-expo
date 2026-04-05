
import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons"; // Pour Google et Apple
import UsernameInput from "../components/UsernameInput";
import WaveBackground from "../components/waveBackground";
import styles from "../styles/LoginStyle";
import { Link,useRouter } from "expo-router";


export default function LoginScreen() {
     const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    // Tableau des étoiles avec position, taille et opacité
    const stars = [
        { top: 10, left: 10, size: 20, opacity: 0.6 },
        { top: 10, right: 10, size: 12, opacity: 0.4 },
        { bottom: 10, left: 10, size: 15, opacity: 0.5 },
        { bottom: 10, right: 10, size: 10, opacity: 0.35 },
        { top: 30, left: 50, size: 8, opacity: 0.25 },
        { bottom: 40, right: 60, size: 22, opacity: 0.7 },
        { top: 40, right: 50, size: 22, opacity: 0.7 },
        { top: 60, left: 150, size: 14, opacity: 0.45 },
        { bottom: 80, left: 16, size: 18, opacity: 0.55 },
        // tu peux ajouter autant d'étoiles que tu veux
    ];

    return (
        <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
            <WaveBackground />

            {/* BACK */}
<<<<<<< HEAD
            <TouchableOpacity style={styles.backBtn}>
=======
            <TouchableOpacity style={styles.backBtn}  onPress={() => router.push("/frontend/screens/start")} >
>>>>>>> sonia
                <Ionicons name="arrow-back" size={20} color="#6949a8" />
            </TouchableOpacity>

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.titleRow}>

                    <Text style={styles.title}> Welcome</Text>
                </View>
                <Text style={styles.subtitle}>Let’s continue your journey</Text>
            </View>

            {/* CARD */}
            <View style={styles.card}>
                <Text style={styles.label}>Email</Text>
                <UsernameInput
                    value={email}
                    onChange={setEmail}
                    placeholder="Enter Email Address"
                    icon="mail"
                />

                <Text style={[styles.label, { marginTop: 15 }]}>Password</Text>
                <UsernameInput
                    value={password}
                    onChange={setPassword}
                    placeholder="Enter Password"
                    icon="lock"
                    secure
                />

                {/* Options */}
                <View style={styles.optionsRow}>
                    <TouchableOpacity
                        style={styles.remember}
                        onPress={() => setRemember(!remember)}
                    >
                        <View style={[styles.checkbox, remember && styles.checkboxActive, { marginRight: 4 }]}>
                            {remember && (
                                <Feather
                                    name="check"
                                    size={12}
                                    color="#fff"
                                    style={{ alignSelf: "center" }}
                                />
                            )}
                        </View>
                        <Text style={styles.rememberText}>Remember Password</Text>
                    </TouchableOpacity>

                    <TouchableOpacity>
                        <Text style={styles.forgot}>Forgot Password?</Text>
                    </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                    style={styles.buttonWrapper}
                    onPress={() => router.push("/frontend/screens/SetUpProfile")} // <-- navigation ici
                >
                    <LinearGradient
                        colors={["#6949a8", "#9574e0", "#baaae7"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        <Text style={styles.buttonText}>Sign In</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Register */}
                <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 15 }}>
                    <Text style={styles.registerText}>Don’t have an account? </Text>
                    <Link href="/frontend/screens/Register" style={[styles.registerLink, { textDecorationLine: "underline" }]}>
                        Register Now
                    </Link>
                </View>
                {/* Social Buttons */}
                <View style={styles.socialRow}>
                    <TouchableOpacity style={styles.socialBtn}>
                        <FontAwesome5 name="google" size={22} color="#EA4335" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.socialBtn}>
                        <FontAwesome5 name="apple" size={22} color="#000" />
                    </TouchableOpacity>
                </View>


            </View>
            {/* ✨ Stars */}
            <View style={[styles.stars, { pointerEvents: "none" }]}>
                {stars.map((star, i) => (
                    <MaterialIcons
                        key={i}
                        name="auto-awesome"
                        size={star.size}
                        color="#fff"
                        style={{
                            position: "absolute",
                            ...(star.top !== undefined ? { top: star.top } : {}),
                            ...(star.bottom !== undefined ? { bottom: star.bottom } : {}),
                            ...(star.left !== undefined ? { left: star.left } : {}),
                            ...(star.right !== undefined ? { right: star.right } : {}),
                            opacity: star.opacity,
                        }}
                    />
                ))}
            </View>
        </LinearGradient>
    );
}