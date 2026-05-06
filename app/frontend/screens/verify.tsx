// import { Ionicons, MaterialIcons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";
// import { useState } from "react";
// import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
// import WaveBackground from "../components/waveBackground";
// import OtpInput from "../components/OtpInput";
// import styles from "../styles/LoginStyle";

// export default function VerifyScreen() {
//   const router = useRouter();
//   const [code, setCode] = useState(["", "", "", "", "", ""]);
//   const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
//   const [timer] = useState(24);

//   const correctCode = "402612";

//   const handleChange = (text: string, index: number) => {
//     const newCode = [...code];
//     newCode[index] = text;
//     setCode(newCode);

//     const fullCode = newCode.join("");
//     if (fullCode.length === 6) {
//       setStatus(fullCode === correctCode ? "success" : "error");
//     } else {
//       setStatus("idle");
//     }
//   };

//   const stars = [
//     { top: 10, left: 10, size: 20, opacity: 0.6 },
//     { top: 10, right: 10, size: 12, opacity: 0.4 },
//     { bottom: 10, left: 10, size: 15, opacity: 0.5 },
//     { bottom: 10, right: 10, size: 10, opacity: 0.35 },
//     { top: 30, left: 50, size: 8, opacity: 0.25 },
//     { bottom: 40, right: 60, size: 22, opacity: 0.7 },
//     { top: 40, right: 50, size: 22, opacity: 0.7 },
//     { top: 60, left: 150, size: 14, opacity: 0.45 },
//     { bottom: 80, left: 16, size: 18, opacity: 0.55 },
//   ];

//   return (
//     <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
//       <WaveBackground />

//       <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
//         <Ionicons name="arrow-back" size={20} color="#6949a8" />
//       </TouchableOpacity>

//       <View style={styles.header}>
//         <View style={styles.titleRow}>
//           <Text style={styles.title}>Verification Code</Text>
//         </View>
//         <Text style={styles.subtitle}>
//           Enter the 6 digit code sent to{"\n"} +213 6 **** ****
//         </Text>
//       </View>

//       <View style={styles.card}>
//         <OtpInput code={code} status={status} onChange={handleChange} />

//         {status === "error" && (
//           <Text style={localStyles.errorText}>Incorrect code. Try again</Text>
//         )}

//         {status === "success" && (
//           <Text style={localStyles.successText}>✔ Code verified</Text>
//         )}

//         <TouchableOpacity 
//           style={styles.buttonWrapper}
//           onPress={() => {
//             if (status === "success") {
//               router.push("/frontend/screens/NewPassword");
//             }
//           }}
//         >
//           <LinearGradient
//             colors={["#6949a8", "#9574e0", "#baaae7"]}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={styles.button}
//           >
//             <Text style={styles.buttonText}>Verify</Text>
//           </LinearGradient>
//         </TouchableOpacity>

//         <Text style={localStyles.resendText}>
//           Resend code in <Text style={localStyles.resendLink}>00:{timer}</Text>
//         </Text>
//       </View>

//       <View style={[styles.stars, { pointerEvents: "none" }]}>
//         {stars.map((star, i) => (
//           <MaterialIcons
//             key={i}
//             name="auto-awesome"
//             size={star.size}
//             color="#fff"
//             style={{
//               position: "absolute",
//               ...(star.top !== undefined ? { top: star.top } : {}),
//               ...(star.bottom !== undefined ? { bottom: star.bottom } : {}),
//               ...(star.left !== undefined ? { left: star.left } : {}),
//               ...(star.right !== undefined ? { right: star.right } : {}),
//               opacity: star.opacity,
//             }}
//           />
//         ))}
//       </View>
//     </LinearGradient>
//   );
// }

// const localStyles = StyleSheet.create({
//   errorText: {
//     color: "#EF4444",
//     marginBottom: 15,
//     fontWeight: "600",
//     textAlign: "center",
//   },
//   successText: {
//     color: "#22C55E",
//     marginBottom: 15,
//     fontWeight: "600",
//     textAlign: "center",
//   },
//   resendText: {
//     textAlign: "center",
//     marginTop: 15,
//     color: "#6949a8",
//     fontSize: 12,
//   },
//   resendLink: {
//     color: "#7B61FF",
//     fontWeight: "bold",
//   },
// });


// screens/verify.tsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useVerifyViewModel } from "../../../backend/viewmodels/useVerifyViewModel";
import OtpInput from "../components/OtpInput";
import WaveBackground from "../components/waveBackground";
import styles from "../styles/LoginStyle";

export default function VerifyScreen() {
  const router = useRouter();
  // Reçoit l'email depuis forget-password
  const { email } = useLocalSearchParams<{ email: string }>();

  const {
    code, status, userId, errorMsg,
    timer, timerLabel,
    handleChange, resend,
  } = useVerifyViewModel(email ?? "");

  const handleVerify = () => {
  console.log("status:", status, "userId:", userId); // ← ajoute ça
  if (status === "success" && userId) {
    router.push({
      pathname: "/frontend/screens/NewPassword",
      params: { userId },
    });
  }
};

  // Masque l'email : john@gmail.com → jo***@gmail.com
  const maskedEmail = email
    ? email.slice(0, 2) + "***@" + email.split("@")[1]
    : "votre email";

  const stars = [
    { top: 10,    left: 10,   size: 20, opacity: 0.6  },
    { top: 10,    right: 10,  size: 12, opacity: 0.4  },
    { bottom: 10, left: 10,   size: 15, opacity: 0.5  },
    { bottom: 10, right: 10,  size: 10, opacity: 0.35 },
    { top: 30,    left: 50,   size: 8,  opacity: 0.25 },
    { bottom: 40, right: 60,  size: 22, opacity: 0.7  },
    { top: 40,    right: 50,  size: 22, opacity: 0.7  },
    { top: 60,    left: 150,  size: 14, opacity: 0.45 },
    { bottom: 80, left: 16,   size: 18, opacity: 0.55 },
  ];

  return (
    <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
      <WaveBackground />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#6949a8" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Code de vérification</Text>
        </View>
        <Text style={styles.subtitle}>
          Entrez le code à 6 chiffres envoyé à{"\n"}
          <Text style={{ fontWeight: "600", color: "#6949a8" }}>{maskedEmail}</Text>
        </Text>
      </View>

      <View style={styles.card}>
        <OtpInput
          code={code}
          status={status === "loading" ? "idle" : status}
          onChange={handleChange}
        />

        {/* États */}
        {status === "loading" && (
          <View style={localStyles.centerRow}>
            <ActivityIndicator color="#6949a8" />
            <Text style={localStyles.loadingText}>Vérification...</Text>
          </View>
        )}
        {status === "error" && (
          <Text style={localStyles.errorText}>
            {errorMsg ?? "Code incorrect. Réessayez."}
          </Text>
        )}
        {status === "success" && (
          <Text style={localStyles.successText}>✔ Code vérifié</Text>
        )}

        {/* Bouton Vérifier */}
        <TouchableOpacity
          style={[
            styles.buttonWrapper,
            status !== "success" && { opacity: 0.45 },
          ]}
          onPress={handleVerify}
          disabled={status !== "success"}
        >
          <LinearGradient
            colors={["#6949a8", "#9574e0", "#baaae7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Continuer</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Timer / Renvoyer */}
        {timer > 0 ? (
          <Text style={localStyles.resendText}>
            Renvoyer le code dans{" "}
            <Text style={localStyles.resendLink}>{timerLabel}</Text>
          </Text>
        ) : (
          <TouchableOpacity onPress={resend} style={{ marginTop: 15 }}>
            <Text style={[localStyles.resendText, localStyles.resendLink]}>
              Renvoyer le code
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.stars, { pointerEvents: "none" }]}>
        {stars.map((star, i) => (
          <MaterialIcons
            key={i}
            name="auto-awesome"
            size={star.size}
            color="#fff"
            style={{
              position: "absolute",
              ...(star.top    !== undefined ? { top: star.top }       : {}),
              ...(star.bottom !== undefined ? { bottom: star.bottom } : {}),
              ...(star.left   !== undefined ? { left: star.left }     : {}),
              ...(star.right  !== undefined ? { right: star.right }   : {}),
              opacity: star.opacity,
            }}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const localStyles = StyleSheet.create({
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 15,
  },
  loadingText: {
    color: "#6949a8",
    fontSize: 13,
  },
  errorText: {
    color: "#EF4444",
    marginBottom: 15,
    fontWeight: "600",
    textAlign: "center",
    fontSize: 13,
  },
  successText: {
    color: "#22C55E",
    marginBottom: 15,
    fontWeight: "600",
    textAlign: "center",
    fontSize: 13,
  },
  resendText: {
    textAlign: "center",
    marginTop: 15,
    color: "#6949a8",
    fontSize: 12,
  },
  resendLink: {
    color: "#7B61FF",
    fontWeight: "bold",
  },
});
