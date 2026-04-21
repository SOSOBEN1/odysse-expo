
// import { Ionicons, MaterialIcons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";
// import { useState } from "react";
// import {
//   DimensionValue,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import Svg, {
//   Circle,
//   Defs,
//   Ellipse,
//   FeDropShadow,
//   Filter,
//   RadialGradient,
//   Stop,
//   Text as SvgText,
// } from "react-native-svg";
// import BackButton from "../components/BackButton";
// import BadgeUnlockedModal from "../components/BadgeUnlockedModel";
// import Navbar from "../components/Navbar";
// import WaveBackground from "../components/waveBackground";
// import { COLORS } from "../constants/theme";

// // ── Interfaces ───────────────────────────────────────────────
// interface UnlockedBadgeProps {
//   id: number;
//   emoji: string;
//   label: string;
//   date: string;
//   bg: string;
//   color: string;
//   onPress: () => void;
// }

// interface LockedBadgeProps {
//   emoji: string;
//   label: string;
//   condition: string;
//   condColor: string;
// }

// interface StarItem {
//   top?: number;
//   bottom?: number;
//   left?: number;
//   right?: number;
//   size: number;
//   opacity: number;
// }

// // ── Données ─────────────────────────────────────────────────
// const TOTAL_BADGES = 40;
// const UNLOCKED_COUNT = 8;

// const UNLOCKED_BADGES = [
//   { id: 1,  label: "Premiers Pas",      emoji: "👣", color: "#f9c74f", date: "12 mars 2026",    bg: "#fff8e1" },
//   { id: 2,  label: "Série de 7 jours",  emoji: "🔥", color: "#f8961e", date: "05 janvier 2026", bg: "#fff3e0" },
//   { id: 3,  label: "Vision master",     emoji: "👁️", color: "#4cc9f0", date: "05 janvier 2026", bg: "#e0f7fa" },
//   { id: 4,  label: "Missionnaire",      emoji: "🎯", color: "#f9c74f", date: "12 mars 2026",    bg: "#fff8e1" },
//   { id: 5,  label: "Organisé(e)",       emoji: "📅", color: "#90be6d", date: "05 janvier 2026", bg: "#f1f8e9" },
//   { id: 6,  label: "Concentration Pro", emoji: "⚡", color: "#7c50f0", date: "15 janvier 2026", bg: "#ede7f6" },
// ];

// const LOCKED_BADGES = [
//   { id: 7,  label: "Discipline",    emoji: "⭐", condition: "Condition: 90%\nOrganisation",    condColor: "#555" },
//   { id: 8,  label: "Stressed? Non!",emoji: "❤️", condition: "Condition: <30%\nStress",          condColor: "#e53935" },
//   { id: 9,  label: "Expert",        emoji: "🎓", condition: "Condition:\nNiv.10",               condColor: "#555" },
//   { id: 10, label: "Marathonien",   emoji: "🏃", condition: "Condition: 90%\n30 missions",      condColor: "#555" },
//   { id: 11, label: "Légende",       emoji: "🏆", condition: "Condition: 100%\ncompétences",     condColor: "#555" },
//   { id: 12, label: "Zen Attitude",  emoji: "🌸", condition: "Condition: 7 jours\n<20% stress",  condColor: "#555" },
// ];

// const stars: StarItem[] = [
//   { top: 10,    left: 10,   size: 20, opacity: 0.6  },
//   { top: 10,    right: 10,  size: 12, opacity: 0.4  },
//   { bottom: 10, left: 10,   size: 15, opacity: 0.5  },
//   { bottom: 10, right: 10,  size: 10, opacity: 0.35 },
//   { top: 30,    left: 50,   size: 8,  opacity: 0.25 },
//   { bottom: 40, right: 60,  size: 22, opacity: 0.7  },
//   { top: 40,    right: 50,  size: 22, opacity: 0.7  },
// ];

// const xpPct: DimensionValue = `${(UNLOCKED_COUNT / TOTAL_BADGES) * 100}%`;

// // ── Helper : assombrir une couleur hex ───────────────────────
// function darkenHex(hex: string, factor: number): string {
//   const clean = hex.replace("#", "");
//   const r = Math.round(parseInt(clean.slice(0, 2), 16) * factor);
//   const g = Math.round(parseInt(clean.slice(2, 4), 16) * factor);
//   const b = Math.round(parseInt(clean.slice(4, 6), 16) * factor);
//   return (
//     "#" +
//     [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")
//   );
// }

// // ── Badge 3D SVG — débloqué ──────────────────────────────────
// function Badge3DUnlocked({ emoji, color, uid }: { emoji: string; color: string; uid: string }) {
//   const dark = darkenHex(color, 0.65);
//   const gradId = `grad_${uid}`;
//   const shadowId = `sh_${uid}`;
//   const filterId = `f_${uid}`;

//   return (
//     <Svg width={72} height={76} viewBox="0 0 72 76">
//       <Defs>
//         <RadialGradient id={gradId} cx="40%" cy="32%" rx="58%" ry="58%">
//           <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
//           <Stop offset="100%" stopColor={color} stopOpacity="1" />
//         </RadialGradient>
//         <RadialGradient id={shadowId} cx="50%" cy="50%" rx="50%" ry="50%">
//           <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
//           <Stop offset="100%" stopColor={color} stopOpacity="0" />
//         </RadialGradient>
//         <Filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
//           <FeDropShadow dx="0" dy="4" stdDeviation="4" floodColor={color} floodOpacity="0.4" />
//         </Filter>
//       </Defs>

//       {/* ombre portée au sol */}
//       <Ellipse cx="36" cy="73" rx="24" ry="5" fill={`url(#${shadowId})`} />

//       {/* rebord 3D bas */}
//       <Circle cx="36" cy="40" r="30" fill={dark} filter={`url(#${filterId})`} />

//       {/* face principale */}
//       <Circle cx="36" cy="36" r="30" fill={`url(#${gradId})`} />

//       {/* anneau intérieur */}
//       <Circle cx="36" cy="36" r="23" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.45" />

//       {/* reflet luisant */}
//       <Ellipse
//         cx="26"
//         cy="23"
//         rx="10"
//         ry="5"
//         fill="white"
//         opacity="0.28"
//         rotation="-30"
//         originX="26"
//         originY="23"
//       />

//       {/* emoji */}
//       <SvgText
//         x="36"
//         y="47"
//         textAnchor="middle"
//         fontSize="26"
//       >
//         {emoji}
//       </SvgText>
//     </Svg>
//   );
// }

// // ── Badge 3D SVG — verrouillé ────────────────────────────────
// function Badge3DLocked({ emoji, uid }: { emoji: string; uid: string }) {
//   const base = "#b8a9e8";
//   const dark = "#7a6cb8";
//   const gradId = `gradL_${uid}`;
//   const shadowId = `shL_${uid}`;
//   const filterId = `fL_${uid}`;

//   return (
//     <Svg width={72} height={76} viewBox="0 0 72 76">
//       <Defs>
//         <RadialGradient id={gradId} cx="40%" cy="32%" rx="58%" ry="58%">
//           <Stop offset="0%" stopColor="#e8e0ff" stopOpacity="0.85" />
//           <Stop offset="100%" stopColor={base} stopOpacity="1" />
//         </RadialGradient>
//         <RadialGradient id={shadowId} cx="50%" cy="50%" rx="50%" ry="50%">
//           <Stop offset="0%" stopColor={base} stopOpacity="0.2" />
//           <Stop offset="100%" stopColor={base} stopOpacity="0" />
//         </RadialGradient>
//         <Filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
//           <FeDropShadow dx="0" dy="3" stdDeviation="3" floodColor={base} floodOpacity="0.18" />
//         </Filter>
//       </Defs>

//       <Ellipse cx="36" cy="73" rx="24" ry="5" fill={`url(#${shadowId})`} />
//       <Circle cx="36" cy="40" r="30" fill={dark} filter={`url(#${filterId})`} />
//       <Circle cx="36" cy="36" r="30" fill={`url(#${gradId})`} opacity={0.7} />
//       <Circle cx="36" cy="36" r="23" fill="none" stroke="#d4c9ff" strokeWidth="1.5" opacity="0.5" />
//       <Ellipse
//         cx="26"
//         cy="23"
//         rx="10"
//         ry="5"
//         fill="white"
//         opacity="0.12"
//         rotation="-30"
//         originX="26"
//         originY="23"
//       />

//       {/* emoji en opacité réduite */}
//       <SvgText x="36" y="47" textAnchor="middle" fontSize="23" opacity="0.45">
//         {emoji}
//       </SvgText>

//       {/* pastille cadenas */}
//       <Circle cx="57" cy="57" r="11" fill="#7f5af0" stroke="white" strokeWidth="1.5" />
//       <SvgText x="57" y="61" textAnchor="middle" fontSize="11">🔒</SvgText>
//     </Svg>
//   );
// }

// // ── Carte badge débloqué ─────────────────────────────────────
// function UnlockedBadge({ id, emoji, label, date, bg, color, onPress }: UnlockedBadgeProps) {
//   return (
//     <TouchableOpacity
//       style={[unlockedStyles.card, { backgroundColor: bg }]}
//       activeOpacity={0.85}
//       onPress={onPress}
//     >
//       <Text style={unlockedStyles.label} numberOfLines={1}>{label}</Text>
//       <Badge3DUnlocked emoji={emoji} color={color} uid={`u${id}`} />
//       <Text style={unlockedStyles.obtained}>Obtenu le</Text>
//       <Text style={unlockedStyles.date}>{date}</Text>
//     </TouchableOpacity>
//   );
// }

// const unlockedStyles = StyleSheet.create({
//   card:     { width: "30%", borderRadius: 16, padding: 8, alignItems: "center", marginBottom: 10 },
//   label:    { fontSize: 11, fontWeight: "800", color: "#2d1a6e", marginBottom: 4, textAlign: "center" },
//   obtained: { fontSize: 9, color: "#9b87c9", fontWeight: "500", marginTop: 4 },
//   date:     { fontSize: 9, color: "#5c3ca8", fontWeight: "700", textAlign: "center" },
// });

// // ── Carte badge verrouillé ───────────────────────────────────
// function LockedBadge({ emoji, label, condition, condColor, id }: LockedBadgeProps & { id: number }) {
//   return (
//     <View style={lockedStyles.card}>
//       <Text style={lockedStyles.label} numberOfLines={1}>{label}</Text>
//       <Badge3DLocked emoji={emoji} uid={`l${id}`} />
//       <Text style={[lockedStyles.condition, { color: condColor }]}>{condition}</Text>
//     </View>
//   );
// }

// const lockedStyles = StyleSheet.create({
//   card:      { width: "30%", borderRadius: 16, padding: 8, alignItems: "center", marginBottom: 10, backgroundColor: "#f0ecff" },
//   label:     { fontSize: 11, fontWeight: "800", color: "#2d1a6e", marginBottom: 4, textAlign: "center" },
//   condition: { fontSize: 9, fontWeight: "700", textAlign: "center", lineHeight: 13, marginTop: 4 },
// });

// // ── Écran principal ──────────────────────────────────────────
// export default function BadgesScreen() {
//   const router = useRouter();
//   const [modalVisible, setModalVisible] = useState(false);
//   const [selectedBadge, setSelectedBadge] = useState({ label: "", emoji: "" });

//   const openModal = (label: string, emoji: string) => {
//     setSelectedBadge({ label, emoji });
//     setModalVisible(true);
//   };

//   return (
//     <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
//       <WaveBackground />

//       {/* Étoiles décoratives */}
//       <View style={styles.stars} pointerEvents="none">
//         {stars.map((s, i) => (
//           <MaterialIcons
//             key={i}
//             name="auto-awesome"
//             size={s.size}
//             color="#fff"
//             style={{
//               position: "absolute",
//               ...(s.top    !== undefined ? { top: s.top }       : {}),
//               ...(s.bottom !== undefined ? { bottom: s.bottom } : {}),
//               ...(s.left   !== undefined ? { left: s.left }     : {}),
//               ...(s.right  !== undefined ? { right: s.right }   : {}),
//               opacity: s.opacity,
//             }}
//           />
//         ))}
//       </View>

//       {/* Header */}
//       <View style={styles.header}>
//         <BackButton />
//         <Text style={styles.title}>Mes Badges</Text>
//         <TouchableOpacity style={styles.helpBtn}>
//           <Text style={styles.helpText}>?</Text>
//         </TouchableOpacity>
//       </View>

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scroll}
//       >
//         {/* Carte trophée */}
//         <View style={styles.card}>
//           <Text style={styles.trophyEmoji}>🏆</Text>
//           <Text style={styles.xpLabel}>{UNLOCKED_COUNT}/{TOTAL_BADGES} badges débloqués</Text>
//           <View style={styles.xpTrack}>
//             <LinearGradient
//               colors={["#7f5af0", "#bbaaff"]}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 0 }}
//               style={[styles.xpFill, { width: xpPct }]}
//             />
//           </View>
//         </View>

//         {/* Badges débloqués */}
//         <View style={styles.sectionHeader}>
//           <View style={styles.sectionLeft}>
//             <Text style={styles.sectionTitle}>Badges débloqués</Text>
//             <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} style={{ marginLeft: 6 }} />
//           </View>
//           <TouchableOpacity style={styles.voirTout}>
//             <Text style={styles.voirToutText}>Voir tout</Text>
//             <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.badgesGrid}>
//           {UNLOCKED_BADGES.map((b) => (
//             <UnlockedBadge
//               key={b.id}
//               {...b}
//               onPress={() => openModal(b.label, b.emoji)}
//             />
//           ))}
//         </View>

//         {/* Badges à débloquer */}
//         <View style={styles.sectionHeader}>
//           <View style={styles.sectionLeft}>
//             <Ionicons name="lock-closed" size={15} color={COLORS.primary} style={{ marginRight: 6 }} />
//             <Text style={styles.sectionTitle}>Badges à débloquer</Text>
//           </View>
//           <TouchableOpacity style={styles.voirTout}>
//             <Text style={styles.voirToutText}>Voir tout</Text>
//             <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
//           </TouchableOpacity>
//         </View>

//         <View style={styles.badgesGrid}>
//           {LOCKED_BADGES.map((b) => (
//             <LockedBadge key={b.id} id={b.id} {...b} />
//           ))}
//         </View>

//         <View style={{ height: 100 }} />
//       </ScrollView>

//       {/* Navbar */}
//       <Navbar active="badges" onChange={() => {}} />

//       {/* Modal badge débloqué */}
//       <BadgeUnlockedModal
//         visible={modalVisible}
//         badgeName={selectedBadge.label}
//         badgeEmoji={selectedBadge.emoji}
//         onClose={() => setModalVisible(false)}
//       />
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container:     { flex: 1 },
//   stars:         { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
//   header:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 10, zIndex: 10 },
//   title:         { fontSize: 22, fontWeight: "900", color: "#2d1a6e", letterSpacing: 0.5 },
//   helpBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f0ecff", justifyContent: "center", alignItems: "center", shadowColor: COLORS.primary, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
//   helpText:      { fontSize: 16, fontWeight: "800", color: COLORS.primary },
//   scroll:        { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
//   card:          { backgroundColor: "#fff", borderRadius: 20, padding: 16, alignItems: "center", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
//   trophyEmoji:   { fontSize: 44, marginBottom: 6 },
//   xpLabel:       { fontSize: 13, color: "#9b87c9", fontWeight: "600", marginBottom: 10 },
//   xpTrack:       { width: "100%", height: 8, backgroundColor: "#e0d9ff", borderRadius: 8, overflow: "hidden" },
//   xpFill:        { height: "100%", borderRadius: 8 },
//   sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
//   sectionLeft:   { flexDirection: "row", alignItems: "center" },
//   sectionTitle:  { fontSize: 15, fontWeight: "800", color: "#2d1a6e" },
//   voirTout:      { flexDirection: "row", alignItems: "center" },
//   voirToutText:  { fontSize: 12, color: COLORS.primary, fontWeight: "700", marginRight: 2 },
//   badgesGrid:    { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
// });




// // import { Ionicons, MaterialIcons } from "@expo/vector-icons";
// // import { LinearGradient } from "expo-linear-gradient";
// // import { useRouter } from "expo-router";
// // import { useState } from "react";
// // import {
// //   DimensionValue,
// //   ScrollView,
// //   StyleSheet,
// //   Text,
// //   TouchableOpacity,
// //   View,
// // } from "react-native";
// // import Svg, {
// //   Circle,
// //   Defs,
// //   Ellipse,
// //   FeDropShadow,
// //   Filter,
// //   Line,
// //   Path,
// //   Polygon,
// //   RadialGradient,
// //   Rect,
// //   Stop,
// // } from "react-native-svg";
// // import BackButton from "../components/BackButton";
// // import BadgeUnlockedModal from "../components/BadgeUnlockedModel";
// // import Navbar from "../components/Navbar";
// // import WaveBackground from "../components/waveBackground";
// // import { COLORS } from "../constants/theme";

// // // ── Interfaces ───────────────────────────────────────────────
// // interface UnlockedBadgeProps {
// //   id: number;
// //   label: string;
// //   date: string;
// //   bg: string;
// //   icon: React.ReactNode;
// //   onPress: () => void;
// // }

// // interface LockedBadgeProps {
// //   id: number;
// //   label: string;
// //   condition: string;
// //   condColor: string;
// //   icon: React.ReactNode;
// // }

// // interface StarItem {
// //   top?: number;
// //   bottom?: number;
// //   left?: number;
// //   right?: number;
// //   size: number;
// //   opacity: number;
// // }

// // // ── Données ─────────────────────────────────────────────────
// // const TOTAL_BADGES = 40;
// // const UNLOCKED_COUNT = 8;

// // const stars: StarItem[] = [
// //   { top: 10,    left: 10,   size: 20, opacity: 0.6  },
// //   { top: 10,    right: 10,  size: 12, opacity: 0.4  },
// //   { bottom: 10, left: 10,   size: 15, opacity: 0.5  },
// //   { bottom: 10, right: 10,  size: 10, opacity: 0.35 },
// //   { top: 30,    left: 50,   size: 8,  opacity: 0.25 },
// //   { bottom: 40, right: 60,  size: 22, opacity: 0.7  },
// //   { top: 40,    right: 50,  size: 22, opacity: 0.7  },
// // ];

// // const xpPct: DimensionValue = `${(UNLOCKED_COUNT / TOTAL_BADGES) * 100}%`;

// // // ── Shell 3D réutilisable ────────────────────────────────────
// // function BadgeShell({
// //   gradId,
// //   shId,
// //   fId,
// //   color,
// //   darkColor,
// //   lightColor,
// //   children,
// //   locked = false,
// // }: {
// //   gradId: string;
// //   shId: string;
// //   fId: string;
// //   color: string;
// //   darkColor: string;
// //   lightColor: string;
// //   children: React.ReactNode;
// //   locked?: boolean;
// // }) {
// //   return (
// //     <Svg width={72} height={76} viewBox="0 0 72 76">
// //       <Defs>
// //         <RadialGradient id={gradId} cx="38%" cy="30%" rx="60%" ry="60%">
// //           <Stop offset="0%" stopColor={lightColor} stopOpacity={locked ? "0.85" : "0.9"} />
// //           <Stop offset="100%" stopColor={color} stopOpacity="1" />
// //         </RadialGradient>
// //         <RadialGradient id={shId} cx="50%" cy="50%" rx="50%" ry="50%">
// //           <Stop offset="0%" stopColor={color} stopOpacity={locked ? "0.2" : "0.35"} />
// //           <Stop offset="100%" stopColor={color} stopOpacity="0" />
// //         </RadialGradient>
// //         <Filter id={fId} x="-30%" y="-30%" width="160%" height="160%">
// //           <FeDropShadow
// //             dx="0"
// //             dy="4"
// //             stdDeviation="4"
// //             floodColor={color}
// //             floodOpacity={locked ? "0.18" : "0.45"}
// //           />
// //         </Filter>
// //       </Defs>
// //       <Ellipse cx="36" cy="73" rx="22" ry="4" fill={`url(#${shId})`} />
// //       <Circle cx="36" cy="40" r="29" fill={darkColor} filter={`url(#${fId})`} />
// //       <Circle cx="36" cy="36" r="29" fill={`url(#${gradId})`} opacity={locked ? 0.7 : 1} />
// //       <Circle
// //         cx="36" cy="36" r="22"
// //         fill="none"
// //         stroke={locked ? "#d4c9ff" : "white"}
// //         strokeWidth="1.5"
// //         opacity={locked ? 0.5 : 0.4}
// //       />
// //       <Ellipse
// //         cx="26" cy="22" rx="9" ry="4"
// //         fill="white"
// //         opacity={locked ? 0.12 : 0.28}
// //         rotation="-30"
// //         originX="26"
// //         originY="22"
// //       />
// //       {children}
// //       {locked && (
// //         <>
// //           <Circle cx="57" cy="57" r="10" fill="#7f5af0" stroke="white" strokeWidth="1.5" />
// //           <Path
// //             d="M53,57 L56,60 L61,54"
// //             stroke="white"
// //             strokeWidth="2"
// //             fill="none"
// //             strokeLinecap="round"
// //             strokeLinejoin="round"
// //           />
// //         </>
// //       )}
// //     </Svg>
// //   );
// // }

// // // ── Icônes SVG 3D ────────────────────────────────────────────

// // function IconFootprints({ uid, locked }: { uid: string; locked?: boolean }) {
// //   const c1 = locked ? "#9880d0" : "#c9820a";
// //   const c2 = locked ? "#7a68b0" : "#a06008";
// //   const op = locked ? 0.5 : 0.9;
// //   const op2 = locked ? 0.45 : 0.85;
// //   return (
// //     <BadgeShell gradId={`g${uid}`} shId={`sh${uid}`} fId={`f${uid}`}
// //       color={locked ? "#b8a9e8" : "#f9c74f"} darkColor={locked ? "#7a6cb8" : "#c49a1a"}
// //       lightColor={locked ? "#e8e0ff" : "#fff9c4"} locked={locked}>
// //       <Ellipse cx="29" cy="38" rx="5" ry="7" fill={c1} opacity={op} />
// //       <Ellipse cx="27" cy="30" rx="2.2" ry="1.6" fill={c1} opacity={op} />
// //       <Ellipse cx="29.5" cy="29" rx="2.2" ry="1.6" fill={c1} opacity={op} />
// //       <Ellipse cx="32" cy="29.5" rx="2.2" ry="1.6" fill={c1} opacity={op} />
// //       <Ellipse cx="40" cy="42" rx="5" ry="7" fill={c2} opacity={op2} />
// //       <Ellipse cx="38" cy="34" rx="2.2" ry="1.6" fill={c2} opacity={op2} />
// //       <Ellipse cx="40.5" cy="33" rx="2.2" ry="1.6" fill={c2} opacity={op2} />
// //       <Ellipse cx="43" cy="33.5" rx="2.2" ry="1.6" fill={c2} opacity={op2} />
// //     </BadgeShell>
// //   );
// // }

// // function IconFlame({ uid, locked }: { uid: string; locked?: boolean }) {
// //   return (
// //     <BadgeShell gradId={`g${uid}`} shId={`sh${uid}`} fId={`f${uid}`}
// //       color={locked ? "#b8a9e8" : "#f8961e"} darkColor={locked ? "#7a6cb8" : "#b56010"}
// //       lightColor={locked ? "#e8e0ff" : "#ffe0b2"} locked={locked}>
// //       <Path d="M36 48 C28 44 24 38 27 30 C28 27 30 28 30 30 C30 24 34 20 36 16 C38 20 40 24 42 28 C43 24 44 22 45 24 C48 30 46 42 36 48Z"
// //         fill={locked ? "#9880d0" : "#c9440a"} opacity={locked ? 0.5 : 1} />
// //       <Path d="M36 45 C31 42 29 37 31 32 C32 30 33 31 33 33 C33 29 35 26 36 23 C37 26 39 29 40 32 C41 30 42 28 43 30 C45 35 43 41 36 45Z"
// //         fill={locked ? "#b8a8e8" : "#f9c74f"} opacity={locked ? 0.5 : 1} />
// //       <Ellipse cx="36" cy="40" rx="4" ry="5" fill={locked ? "#d0c0f0" : "#fff176"} opacity={locked ? 0.35 : 0.7} />
// //     </BadgeShell>
// //   );
// // }

// // function IconEye({ uid, locked }: { uid: string; locked?: boolean }) {
// //   const st = locked ? "#9880d0" : "#0a8ba8";
// //   const op = locked ? 0.4 : 1;
// //   return (
// //     <BadgeShell gradId={`g${uid}`} shId={`sh${uid}`} fId={`f${uid}`}
// //       color={locked ? "#b8a9e8" : "#4cc9f0"} darkColor={locked ? "#7a6cb8" : "#0a8ba8"}
// //       lightColor={locked ? "#e8e0ff" : "#b2ebf2"} locked={locked}>
// //       <Path d="M19 36 Q36 24 53 36 Q36 48 19 36Z" fill="white" opacity={locked ? 0.4 : 0.95} />
// //       <Circle cx="36" cy="36" r="8" fill={locked ? "#9880d0" : "#0277bd"} opacity={locked ? 0.5 : 1} />
// //       <Circle cx="36" cy="36" r="5" fill={locked ? "#7060a0" : "#01304a"} opacity={locked ? 0.5 : 1} />
// //       <Circle cx="38.5" cy="33.5" r="2.2" fill="white" opacity={locked ? 0.3 : 0.85} />
// //       <Circle cx="33.5" cy="38" r="1.2" fill="white" opacity={locked ? 0.15 : 0.4} />
// //       <Line x1="36" y1="24" x2="36" y2="27" stroke={st} strokeWidth="1.5" strokeLinecap="round" opacity={op} />
// //       <Line x1="29" y1="26" x2="30.5" y2="29" stroke={st} strokeWidth="1.5" strokeLinecap="round" opacity={op} />
// //       <Line x1="43" y1="26" x2="41.5" y2="29" stroke={st} strokeWidth="1.5" strokeLinecap="round" opacity={op} />
// //     </BadgeShell>
// //   );
// // }

// // function IconTarget({ uid, locked }: { uid: string; locked?: boolean }) {
// //   const rc = locked ? "#8070b8" : "#e53935";
// //   const op = locked ? 0.45 : 0.9;
// //   const ac = locked ? "#6050a0" : "#5d1a00";
// //   const aop = locked ? 0.45 : 1;
// //   return (
// //     <BadgeShell gradId={`g${uid}`} shId={`sh${uid}`} fId={`f${uid}`}
// //       color={locked ? "#b8a9e8" : "#f9c74f"} darkColor={locked ? "#7a6cb8" : "#c49a1a"}
// //       lightColor={locked ? "#e8e0ff" : "#fff9c4"} locked={locked}>
// //       <Circle cx="36" cy="36" r="16" fill={rc} opacity={op} />
// //       <Circle cx="36" cy="36" r="12" fill="white" opacity={locked ? 0.3 : 0.95} />
// //       <Circle cx="36" cy="36" r="8" fill={rc} opacity={op} />
// //       <Circle cx="36" cy="36" r="4" fill="white" opacity={locked ? 0.3 : 0.95} />
// //       <Circle cx="36" cy="36" r="2.5" fill={rc} opacity={locked ? 0.45 : 1} />
// //       <Line x1="50" y1="22" x2="39" y2="35" stroke={ac} strokeWidth="2.5" strokeLinecap="round" opacity={aop} />
// //       <Polygon points="50,22 44,22 50,28" fill={ac} opacity={aop} />
// //     </BadgeShell>
// //   );
// // }

// // function IconCalendar({ uid, locked }: { uid: string; locked?: boolean }) {
// //   const c = locked ? "#9880d0" : "#4a7c20";
// //   const op = locked ? 0.5 : 1;
// //   return (
// //     <BadgeShell gradId={`g${uid}`} shId={`sh${uid}`} fId={`f${uid}`}
// //       color={locked ? "#b8a9e8" : "#90be6d"} darkColor={locked ? "#7a6cb8" : "#4a7c20"}
// //       lightColor={locked ? "#e8e0ff" : "#dcedc8"} locked={locked}>
// //       <Rect x="23" y="27" width="26" height="22" rx="3" fill="white" opacity={locked ? 0.3 : 0.95} />
// //       <Rect x="23" y="27" width="26" height="7" rx="3" fill={c} opacity={op} />
// //       <Rect x="23" y="30" width="26" height="4" fill={c} opacity={op} />
// //       <Rect x="29" y="24" width="3" height="6" rx="1.5" fill={locked ? "#7060a0" : "#2e5412"} opacity={op} />
// //       <Rect x="40" y="24" width="3" height="6" rx="1.5" fill={locked ? "#7060a0" : "#2e5412"} opacity={op} />
// //       {[28, 33, 38, 43].map((x) => (
// //         <Circle key={x} cx={x} cy="38" r="1.8" fill={c} opacity={op} />
// //       ))}
// //       {[28, 38, 43].map((x) => (
// //         <Circle key={x} cx={x} cy="43" r="1.8" fill={c} opacity={op} />
// //       ))}
// //       <Circle cx="33" cy="43" r="1.8" fill={locked ? "#b8a0e0" : "#90be6d"} opacity={op} />
// //       <Path d="M31 43 L33 45 L37 41" stroke="white" strokeWidth="2" fill="none"
// //         strokeLinecap="round" strokeLinejoin="round" opacity={locked ? 0.4 : 1} />
// //     </BadgeShell>
// //   );
// // }

// // function IconBolt({ uid, locked }: { uid: string; locked?: boolean }) {
// //   return (
// //     <BadgeShell gradId={`g${uid}`} shId={`sh${uid}`} fId={`f${uid}`}
// //       color={locked ? "#b8a9e8" : "#7c50f0"} darkColor={locked ? "#7a6cb8" : "#3a1a90"}
// //       lightColor={locked ? "#e8e0ff" : "#ede7f6"} locked={locked}>
// //       <Polygon points="40,18 31,36 36,36 32,54 46,32 40,32"
// //         fill={locked ? "#5040a0" : "#3a1a90"} opacity={locked ? 0.3 : 0.5}
// //         translateX={1} translateY={2} />
// //       <Polygon points="40,18 31,36 36,36 32,54 46,32 40,32"
// //         fill={locked ? "#c0b0e8" : "#f9c74f"} opacity={locked ? 0.5 : 1} />
// //       <Polygon points="37,20 33,32 36.5,32" fill="white" opacity={locked ? 0.12 : 0.35} />
// //     </BadgeShell>
// //   );
// // }

// // function IconStar({ uid, locked }: { uid: string; locked?: boolean }) {
// //   return (
// //     <BadgeShell gradId={`g${uid}`} shId={`sh${uid}`} fId={`f${uid}`}
// //       color={locked ? "#b8a9e8" : "#f9c74f"} darkColor={locked ? "#7a6cb8" : "#c49a1a"}
// //       lightColor={locked ? "#e8e0ff" : "#fff9c4"} locked={locked}>
// //       <Polygon points="36,20 39,30 50,30 41,37 44,47 36,41 28,47 31,37 22,30 33,30"
// //         fill={locked ? "#9880d0" : "#f9c74f"} opacity={locked ? 0.5 : 1} />
// //       <Polygon points="36,22 38.5,30 48,30 40.5,36 43,45 36,40 29,45 31.5,36 24,30 33.5,30"
// //         fill={locked ? "#b8a8e8" : "#fff176"} opacity={locked ? 0.3 : 0.7} />
// //     </BadgeShell>
// //   );
// // }

// // function IconHeart({ uid, locked }: { uid: string; locked?: boolean }) {
// //   return (
// //     <BadgeShell gradId={`g${uid}`} shId={`sh${uid}`} fId={`f${uid}`}
// //       color={locked ? "#b8a9e8" : "#f472b6"} darkColor={locked ? "#7a6cb8" : "#9d174d"}
// //       lightColor={locked ? "#e8e0ff" : "#fce7f3"} locked={locked}>
// //       <Path
// //         d="M36,46 C36,46 22,38 22,29 C22,24 26,21 30,22 C32,23 34,25 36,27 C38,25 40,23 42,22 C46,21 50,24 50,29 C50,38 36,46 36,46Z"
// //         fill={locked ? "#c06080" : "#f43f8e"} opacity={locked ? 0.5 : 1} />
// //       <Path
// //         d="M36,43 C36,43 25,36 25,29 C25,25.5 28,23 31,24 C33,25 35,27 36,29 C37,27 39,25 41,24 C44,23 47,25.5 47,29 C47,36 36,43 36,43Z"
// //         fill={locked ? "#d090b0" : "#fda4cf"} opacity={locked ? 0.3 : 0.7} />
// //     </BadgeShell>
// //   );
// // }

// // function IconMortarboard({ uid, locked }: { uid: string; locked?: boolean }) {
// //   const c = locked ? "#6050a0" : "#3730a3";
// //   const op = locked ? 0.5 : 1;
// //   return (
// //     <BadgeShell gradId={`g${uid}`} shId={`sh${uid}`} fId={`f${uid}`}
// //       color={locked ? "#b8a9e8" : "#818cf8"} darkColor={locked ? "#7a6cb8" : "#3730a3"}
// //       lightColor={locked ? "#e8e0ff" : "#e0e7ff"} locked={locked}>
// //       <Rect x="25" y="34" width="22" height="12" rx="2" fill={c} opacity={op} />
// //       <Polygon points="36,24 52,32 36,35 20,32" fill={locked ? "#7060b0" : "#4f46e5"} opacity={op} />
// //       <Rect x="47" y="32" width="2" height="8" rx="1" fill={c} opacity={op} />
// //       <Circle cx="48" cy="42" r="3" fill={locked ? "#a090d0" : "#818cf8"} opacity={locked ? 0.5 : 0.9} />
// //       <Polygon points="36,24 44,28 38,29" fill="white" opacity={locked ? 0.1 : 0.3} />
// //     </BadgeShell>
// //   );
// // }

// // function IconRunner({ uid, locked }: { uid: string; locked?: boolean }) {
// //   const c = locked ? "#6050a0" : "#0ea5e9";
// //   const op = locked ? 0.5 : 1;
// //   return (
// //     <BadgeShell gradId={`g${uid}`} shId={`sh${uid}`} fId={`f${uid}`}
// //       color={locked ? "#b8a9e8" : "#38bdf8"} darkColor={locked ? "#7a6cb8" : "#0369a1"}
// //       lightColor={locked ? "#e8e0ff" : "#e0f2fe"} locked={locked}>
// //       <Circle cx="38" cy="24" r="4" fill={c} opacity={op} />
// //       <Line x1="38" y1="28" x2="35" y2="38" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity={op} />
// //       <Line x1="35" y1="38" x2="28" y2="46" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity={op} />
// //       <Line x1="35" y1="38" x2="42" y2="44" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity={op} />
// //       <Line x1="37" y1="30" x2="44" y2="34" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity={op} />
// //       <Line x1="37" y1="30" x2="30" y2="33" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity={op} />
// //       <Line x1="20" y1="36" x2="26" y2="36" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity={locked ? 0.25 : 0.5} />
// //       <Line x1="20" y1="40" x2="25" y2="40" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity={locked ? 0.2 : 0.4} />
// //     </BadgeShell>
// //   );
// // }

// // function IconTrophy({ uid, locked }: { uid: string; locked?: boolean }) {
// //   const c = locked ? "#6050a0" : "#b45309";
// //   const op = locked ? 0.5 : 1;
// //   return (
// //     <BadgeShell gradId={`g${uid}`} shId={`sh${uid}`} fId={`f${uid}`}
// //       color={locked ? "#b8a9e8" : "#f59e0b"} darkColor={locked ? "#7a6cb8" : "#92400e"}
// //       lightColor={locked ? "#e8e0ff" : "#fef3c7"} locked={locked}>
// //       <Rect x="30" y="43" width="12" height="3" rx="1" fill={c} opacity={op} />
// //       <Rect x="27" y="46" width="18" height="3" rx="1.5" fill={c} opacity={op} />
// //       <Path d="M29,26 L29,42 Q29,44 36,44 Q43,44 43,42 L43,26Z" fill={locked ? "#8070c0" : "#d97706"} opacity={locked ? 0.5 : 1} />
// //       <Path d="M29,28 Q23,28 23,34 Q23,39 29,39" fill="none" stroke={c} strokeWidth="2.5" opacity={op} />
// //       <Path d="M43,28 Q49,28 49,34 Q49,39 43,39" fill="none" stroke={c} strokeWidth="2.5" opacity={op} />
// //       <Polygon points="36,27 37.5,31 42,31 38.5,33.5 40,38 36,35.5 32,38 33.5,33.5 30,31 34.5,31"
// //         fill={locked ? "#a090d0" : "#fef08a"} opacity={locked ? 0.45 : 1} />
// //     </BadgeShell>
// //   );
// // }

// // function IconFlower({ uid, locked }: { uid: string; locked?: boolean }) {
// //   const p = locked ? "#c06090" : "#ec4899";
// //   const p2 = locked ? "#d080a8" : "#f472b6";
// //   const op = locked ? 0.45 : 0.9;
// //   const op2 = locked ? 0.4 : 0.8;
// //   return (
// //     <BadgeShell gradId={`g${uid}`} shId={`sh${uid}`} fId={`f${uid}`}
// //       color={locked ? "#b8a9e8" : "#f9a8d4"} darkColor={locked ? "#7a6cb8" : "#9d174d"}
// //       lightColor={locked ? "#e8e0ff" : "#fce7f3"} locked={locked}>
// //       <Ellipse cx="36" cy="27" rx="4" ry="6.5" fill={p} opacity={op} />
// //       <Ellipse cx="36" cy="45" rx="4" ry="6.5" fill={p} opacity={op} />
// //       <Ellipse cx="27" cy="36" rx="6.5" ry="4" fill={p} opacity={op} />
// //       <Ellipse cx="45" cy="36" rx="6.5" ry="4" fill={p} opacity={op} />
// //       <Ellipse cx="29.5" cy="29.5" rx="4" ry="6.5" fill={p2} opacity={op2} rotation="-45" originX="29.5" originY="29.5" />
// //       <Ellipse cx="42.5" cy="29.5" rx="4" ry="6.5" fill={p2} opacity={op2} rotation="45" originX="42.5" originY="29.5" />
// //       <Ellipse cx="29.5" cy="42.5" rx="4" ry="6.5" fill={p2} opacity={op2} rotation="45" originX="29.5" originY="42.5" />
// //       <Ellipse cx="42.5" cy="42.5" rx="4" ry="6.5" fill={p2} opacity={op2} rotation="-45" originX="42.5" originY="42.5" />
// //       <Circle cx="36" cy="36" r="6" fill={locked ? "#e8d060" : "#fde68a"} opacity={locked ? 0.45 : 1} />
// //       <Circle cx="36" cy="36" r="3.5" fill={locked ? "#d0b040" : "#f59e0b"} opacity={locked ? 0.4 : 0.9} />
// //     </BadgeShell>
// //   );
// // }

// // // ── Données complètes ────────────────────────────────────────
// // const UNLOCKED_BADGES: Omit<UnlockedBadgeProps, "onPress">[] = [
// //   { id: 1, label: "Premiers Pas",      date: "12 mars 2026",    bg: "#fff8e1", icon: <IconFootprints uid="u1" /> },
// //   { id: 2, label: "Série de 7 jours",  date: "05 janvier 2026", bg: "#fff3e0", icon: <IconFlame uid="u2" /> },
// //   { id: 3, label: "Vision master",     date: "05 janvier 2026", bg: "#e0f7fa", icon: <IconEye uid="u3" /> },
// //   { id: 4, label: "Missionnaire",      date: "12 mars 2026",    bg: "#fff8e1", icon: <IconTarget uid="u4" /> },
// //   { id: 5, label: "Organisé(e)",       date: "05 janvier 2026", bg: "#f1f8e9", icon: <IconCalendar uid="u5" /> },
// //   { id: 6, label: "Concentration Pro", date: "15 janvier 2026", bg: "#ede7f6", icon: <IconBolt uid="u6" /> },
// // ];

// // const LOCKED_BADGES: LockedBadgeProps[] = [
// //   { id: 7,  label: "Discipline",     condition: "Condition: 90%\nOrganisation",    condColor: "#555",    icon: <IconStar uid="l1" locked /> },
// //   { id: 8,  label: "Stressed? Non!", condition: "Condition: <30%\nStress",          condColor: "#e53935", icon: <IconHeart uid="l2" locked /> },
// //   { id: 9,  label: "Expert",         condition: "Condition:\nNiv.10",               condColor: "#555",    icon: <IconMortarboard uid="l3" locked /> },
// //   { id: 10, label: "Marathonien",    condition: "Condition: 90%\n30 missions",      condColor: "#555",    icon: <IconRunner uid="l4" locked /> },
// //   { id: 11, label: "Légende",        condition: "Condition: 100%\ncompétences",     condColor: "#555",    icon: <IconTrophy uid="l5" locked /> },
// //   { id: 12, label: "Zen Attitude",   condition: "Condition: 7 jours\n<20% stress",  condColor: "#555",    icon: <IconFlower uid="l6" locked /> },
// // ];

// // // ── Carte badge débloqué ─────────────────────────────────────
// // function UnlockedBadge({ label, date, bg, icon, onPress }: UnlockedBadgeProps) {
// //   return (
// //     <TouchableOpacity
// //       style={[unlockedStyles.card, { backgroundColor: bg }]}
// //       activeOpacity={0.85}
// //       onPress={onPress}
// //     >
// //       <Text style={unlockedStyles.label} numberOfLines={1}>{label}</Text>
// //       {icon}
// //       <Text style={unlockedStyles.obtained}>Obtenu le</Text>
// //       <Text style={unlockedStyles.date}>{date}</Text>
// //     </TouchableOpacity>
// //   );
// // }

// // const unlockedStyles = StyleSheet.create({
// //   card:     { width: "30%", borderRadius: 16, padding: 8, alignItems: "center", marginBottom: 10 },
// //   label:    { fontSize: 11, fontWeight: "800", color: "#2d1a6e", marginBottom: 4, textAlign: "center" },
// //   obtained: { fontSize: 9, color: "#9b87c9", fontWeight: "500", marginTop: 4 },
// //   date:     { fontSize: 9, color: "#5c3ca8", fontWeight: "700", textAlign: "center" },
// // });

// // // ── Carte badge verrouillé ───────────────────────────────────
// // function LockedBadge({ label, condition, condColor, icon }: LockedBadgeProps) {
// //   return (
// //     <View style={lockedStyles.card}>
// //       <Text style={lockedStyles.label} numberOfLines={1}>{label}</Text>
// //       {icon}
// //       <Text style={[lockedStyles.condition, { color: condColor }]}>{condition}</Text>
// //     </View>
// //   );
// // }

// // const lockedStyles = StyleSheet.create({
// //   card:      { width: "30%", borderRadius: 16, padding: 8, alignItems: "center", marginBottom: 10, backgroundColor: "#f0ecff" },
// //   label:     { fontSize: 11, fontWeight: "800", color: "#2d1a6e", marginBottom: 4, textAlign: "center" },
// //   condition: { fontSize: 9, fontWeight: "700", textAlign: "center", lineHeight: 13, marginTop: 4 },
// // });

// // // ── Écran principal ──────────────────────────────────────────
// // export default function BadgesScreen() {
// //   const router = useRouter();
// //   const [modalVisible, setModalVisible] = useState(false);
// //   const [selectedBadge, setSelectedBadge] = useState({ label: "", emoji: "" });

// //   const openModal = (label: string) => {
// //     setSelectedBadge({ label, emoji: "" });
// //     setModalVisible(true);
// //   };

// //   return (
// //     <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
// //       <WaveBackground />

// //       <View style={styles.stars} pointerEvents="none">
// //         {stars.map((s, i) => (
// //           <MaterialIcons
// //             key={i}
// //             name="auto-awesome"
// //             size={s.size}
// //             color="#fff"
// //             style={{
// //               position: "absolute",
// //               ...(s.top    !== undefined ? { top: s.top }       : {}),
// //               ...(s.bottom !== undefined ? { bottom: s.bottom } : {}),
// //               ...(s.left   !== undefined ? { left: s.left }     : {}),
// //               ...(s.right  !== undefined ? { right: s.right }   : {}),
// //               opacity: s.opacity,
// //             }}
// //           />
// //         ))}
// //       </View>

// //       <View style={styles.header}>
// //         <BackButton />
// //         <Text style={styles.title}>Mes Badges</Text>
// //         <TouchableOpacity style={styles.helpBtn}>
// //           <Text style={styles.helpText}>?</Text>
// //         </TouchableOpacity>
// //       </View>

// //       <ScrollView
// //         showsVerticalScrollIndicator={false}
// //         contentContainerStyle={styles.scroll}
// //       >
// //         {/* Carte trophée */}
// //         <View style={styles.card}>
// //           <IconTrophy uid="header" />
// //           <Text style={styles.xpLabel}>{UNLOCKED_COUNT}/{TOTAL_BADGES} badges débloqués</Text>
// //           <View style={styles.xpTrack}>
// //             <LinearGradient
// //               colors={["#7f5af0", "#bbaaff"]}
// //               start={{ x: 0, y: 0 }}
// //               end={{ x: 1, y: 0 }}
// //               style={[styles.xpFill, { width: xpPct }]}
// //             />
// //           </View>
// //         </View>

// //         {/* Badges débloqués */}
// //         <View style={styles.sectionHeader}>
// //           <View style={styles.sectionLeft}>
// //             <Text style={styles.sectionTitle}>Badges débloqués</Text>
// //             <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} style={{ marginLeft: 6 }} />
// //           </View>
// //           <TouchableOpacity style={styles.voirTout}>
// //             <Text style={styles.voirToutText}>Voir tout</Text>
// //             <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
// //           </TouchableOpacity>
// //         </View>

// //         <View style={styles.badgesGrid}>
// //           {UNLOCKED_BADGES.map((b) => (
// //             <UnlockedBadge key={b.id} {...b} onPress={() => openModal(b.label)} />
// //           ))}
// //         </View>

// //         {/* Badges à débloquer */}
// //         <View style={styles.sectionHeader}>
// //           <View style={styles.sectionLeft}>
// //             <Ionicons name="lock-closed" size={15} color={COLORS.primary} style={{ marginRight: 6 }} />
// //             <Text style={styles.sectionTitle}>Badges à débloquer</Text>
// //           </View>
// //           <TouchableOpacity style={styles.voirTout}>
// //             <Text style={styles.voirToutText}>Voir tout</Text>
// //             <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
// //           </TouchableOpacity>
// //         </View>

// //         <View style={styles.badgesGrid}>
// //           {LOCKED_BADGES.map((b) => (
// //             <LockedBadge key={b.id} {...b} />
// //           ))}
// //         </View>

// //         <View style={{ height: 100 }} />
// //       </ScrollView>

// //       <Navbar active="badges" onChange={() => {}} />

// //       <BadgeUnlockedModal
// //         visible={modalVisible}
// //         badgeName={selectedBadge.label}
// //         badgeEmoji=""
// //         onClose={() => setModalVisible(false)}
// //       />
// //     </LinearGradient>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container:     { flex: 1 },
// //   stars:         { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
// //   header:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 10, zIndex: 10 },
// //   title:         { fontSize: 22, fontWeight: "900", color: "#2d1a6e", letterSpacing: 0.5 },
// //   helpBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f0ecff", justifyContent: "center", alignItems: "center", shadowColor: COLORS.primary, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
// //   helpText:      { fontSize: 16, fontWeight: "800", color: COLORS.primary },
// //   scroll:        { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
// //   card:          { backgroundColor: "#fff", borderRadius: 20, padding: 16, alignItems: "center", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
// //   xpLabel:       { fontSize: 13, color: "#9b87c9", fontWeight: "600", marginBottom: 10, marginTop: 6 },
// //   xpTrack:       { width: "100%", height: 8, backgroundColor: "#e0d9ff", borderRadius: 8, overflow: "hidden" },
// //   xpFill:        { height: "100%", borderRadius: 8 },
// //   sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
// //   sectionLeft:   { flexDirection: "row", alignItems: "center" },
// //   sectionTitle:  { fontSize: 15, fontWeight: "800", color: "#2d1a6e" },
// //   voirTout:      { flexDirection: "row", alignItems: "center" },
// //   voirToutText:  { fontSize: 12, color: COLORS.primary, fontWeight: "700", marginRight: 2 },
// //   badgesGrid:    { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
// // });


import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  DimensionValue,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  FeDropShadow,
  Filter,
  RadialGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import BackButton from "../components/BackButton";
import BadgeUnlockedModal from "../components/BadgeUnlockedModel";
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";
import { COLORS } from "../constants/theme";
import { useBadgesViewModel } from "../viewmodels/useBadgesViewModel";

// ── Interfaces ───────────────────────────────────────────────
interface UnlockedBadgeProps {
  id: number;
  emoji: string;
  label: string;
  date: string;
  bg: string;
  color: string;
  onPress: () => void;
}

interface LockedBadgeProps {
  id: number;
  emoji: string;
  label: string;
  condition: string;
}

interface StarItem {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  size: number;
  opacity: number;
}

// ── Étoiles décoratives ──────────────────────────────────────
const stars: StarItem[] = [
  { top: 10,    left: 10,   size: 20, opacity: 0.6  },
  { top: 10,    right: 10,  size: 12, opacity: 0.4  },
  { bottom: 10, left: 10,   size: 15, opacity: 0.5  },
  { bottom: 10, right: 10,  size: 10, opacity: 0.35 },
  { top: 30,    left: 50,   size: 8,  opacity: 0.25 },
  { bottom: 40, right: 60,  size: 22, opacity: 0.7  },
  { top: 40,    right: 50,  size: 22, opacity: 0.7  },
];

// ── Mapping badge id → couleur & emoji ───────────────────────
// Tu peux enrichir ce mapping selon tes besoins
const BADGE_META: Record<number, { emoji: string; color: string; bg: string }> = {
  1:  { emoji: "👣", color: "#f9c74f", bg: "#fff8e1" },
  2:  { emoji: "🔥", color: "#f8961e", bg: "#fff3e0" },
  3:  { emoji: "👁️", color: "#4cc9f0", bg: "#e0f7fa" },
  4:  { emoji: "🎯", color: "#f9c74f", bg: "#fff8e1" },
  5:  { emoji: "📅", color: "#90be6d", bg: "#f1f8e9" },
  6:  { emoji: "⚡", color: "#7c50f0", bg: "#ede7f6" },
  7:  { emoji: "⭐", color: "#f9c74f", bg: "#fff8e1" },
  8:  { emoji: "❤️", color: "#f472b6", bg: "#fce7f3" },
  9:  { emoji: "🎓", color: "#818cf8", bg: "#e0e7ff" },
  10: { emoji: "🏃", color: "#38bdf8", bg: "#e0f2fe" },
  11: { emoji: "🏆", color: "#f59e0b", bg: "#fef3c7" },
  12: { emoji: "🌸", color: "#f9a8d4", bg: "#fce7f3" },
};

const DEFAULT_META = { emoji: "🏅", color: "#7f5af0", bg: "#ede7f6" };

function getBadgeMeta(id: number) {
  return BADGE_META[id] ?? DEFAULT_META;
}

// ── Helper : assombrir une couleur hex ───────────────────────
function darkenHex(hex: string, factor: number): string {
  const clean = hex.replace("#", "");
  const r = Math.round(parseInt(clean.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(clean.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(clean.slice(4, 6), 16) * factor);
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

// ── Badge 3D SVG — débloqué ──────────────────────────────────
function Badge3DUnlocked({
  emoji,
  color,
  uid,
}: {
  emoji: string;
  color: string;
  uid: string;
}) {
  const dark     = darkenHex(color, 0.65);
  const gradId   = `grad_${uid}`;
  const shadowId = `sh_${uid}`;
  const filterId = `f_${uid}`;

  return (
    <Svg width={72} height={76} viewBox="0 0 72 76">
      <Defs>
        <RadialGradient id={gradId} cx="40%" cy="32%" rx="58%" ry="58%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <Stop offset="100%" stopColor={color} stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id={shadowId} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
        <Filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <FeDropShadow
            dx="0" dy="4" stdDeviation="4"
            floodColor={color} floodOpacity="0.4"
          />
        </Filter>
      </Defs>
      <Ellipse cx="36" cy="73" rx="24" ry="5" fill={`url(#${shadowId})`} />
      <Circle cx="36" cy="40" r="30" fill={dark} filter={`url(#${filterId})`} />
      <Circle cx="36" cy="36" r="30" fill={`url(#${gradId})`} />
      <Circle cx="36" cy="36" r="23" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.45" />
      <Ellipse cx="26" cy="23" rx="10" ry="5" fill="white" opacity="0.28" rotation="-30" originX="26" originY="23" />
      <SvgText x="36" y="47" textAnchor="middle" fontSize="26">{emoji}</SvgText>
    </Svg>
  );
}

// ── Badge 3D SVG — verrouillé ────────────────────────────────
function Badge3DLocked({ emoji, uid }: { emoji: string; uid: string }) {
  const base     = "#b8a9e8";
  const dark     = "#7a6cb8";
  const gradId   = `gradL_${uid}`;
  const shadowId = `shL_${uid}`;
  const filterId = `fL_${uid}`;

  return (
    <Svg width={72} height={76} viewBox="0 0 72 76">
      <Defs>
        <RadialGradient id={gradId} cx="40%" cy="32%" rx="58%" ry="58%">
          <Stop offset="0%" stopColor="#e8e0ff" stopOpacity="0.85" />
          <Stop offset="100%" stopColor={base} stopOpacity="1" />
        </RadialGradient>
        <RadialGradient id={shadowId} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor={base} stopOpacity="0.2" />
          <Stop offset="100%" stopColor={base} stopOpacity="0" />
        </RadialGradient>
        <Filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <FeDropShadow
            dx="0" dy="3" stdDeviation="3"
            floodColor={base} floodOpacity="0.18"
          />
        </Filter>
      </Defs>
      <Ellipse cx="36" cy="73" rx="24" ry="5" fill={`url(#${shadowId})`} />
      <Circle cx="36" cy="40" r="30" fill={dark} filter={`url(#${filterId})`} />
      <Circle cx="36" cy="36" r="30" fill={`url(#${gradId})`} opacity={0.7} />
      <Circle cx="36" cy="36" r="23" fill="none" stroke="#d4c9ff" strokeWidth="1.5" opacity="0.5" />
      <Ellipse cx="26" cy="23" rx="10" ry="5" fill="white" opacity="0.12" rotation="-30" originX="26" originY="23" />
      <SvgText x="36" y="47" textAnchor="middle" fontSize="23" opacity="0.45">{emoji}</SvgText>
      <Circle cx="57" cy="57" r="11" fill="#7f5af0" stroke="white" strokeWidth="1.5" />
      <SvgText x="57" y="61" textAnchor="middle" fontSize="11">🔒</SvgText>
    </Svg>
  );
}

// ── Carte badge débloqué ─────────────────────────────────────
function UnlockedBadge({ id, emoji, label, date, bg, color, onPress }: UnlockedBadgeProps) {
  return (
    <TouchableOpacity
      style={[unlockedStyles.card, { backgroundColor: bg }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={unlockedStyles.label} numberOfLines={1}>{label}</Text>
      <Badge3DUnlocked emoji={emoji} color={color} uid={`u${id}`} />
      <Text style={unlockedStyles.obtained}>Obtenu le</Text>
      <Text style={unlockedStyles.date}>
        {new Date(date).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </Text>
    </TouchableOpacity>
  );
}

const unlockedStyles = StyleSheet.create({
  card:     { width: "30%", borderRadius: 16, padding: 8, alignItems: "center", marginBottom: 10 },
  label:    { fontSize: 11, fontWeight: "800", color: "#2d1a6e", marginBottom: 4, textAlign: "center" },
  obtained: { fontSize: 9, color: "#9b87c9", fontWeight: "500", marginTop: 4 },
  date:     { fontSize: 9, color: "#5c3ca8", fontWeight: "700", textAlign: "center" },
});

// ── Carte badge verrouillé ───────────────────────────────────
function LockedBadge({ id, emoji, label, condition }: LockedBadgeProps) {
  return (
    <View style={lockedStyles.card}>
      <Text style={lockedStyles.label} numberOfLines={1}>{label}</Text>
      <Badge3DLocked emoji={emoji} uid={`l${id}`} />
      <Text style={lockedStyles.condition}>{condition}</Text>
    </View>
  );
}

const lockedStyles = StyleSheet.create({
  card:      { width: "30%", borderRadius: 16, padding: 8, alignItems: "center", marginBottom: 10, backgroundColor: "#f0ecff" },
  label:     { fontSize: 11, fontWeight: "800", color: "#2d1a6e", marginBottom: 4, textAlign: "center" },
  condition: { fontSize: 9, fontWeight: "700", textAlign: "center", lineHeight: 13, marginTop: 4, color: "#555" },
});

// ── Écran principal ──────────────────────────────────────────
export default function BadgesScreen() {
  const router = useRouter();

  // ⚠️ Remplace 1 par ton vrai userId depuis le contexte auth
  // Ex: const { user } = useAuth(); const userId = user.id;
  const USER_ID = 1;

  const {
    unlocked,
    locked,
    total,
    newlyUnlocked,
    loading,
    error,
    loadBadges,
    clearNewlyUnlocked,
  } = useBadgesViewModel(USER_ID);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState({ label: "", emoji: "" });

  // Ouvre la modale quand un nouveau badge est obtenu
  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      const first = newlyUnlocked[0];
      const meta  = getBadgeMeta(first.id);
      setSelectedBadge({ label: first.label, emoji: meta.emoji });
      setModalVisible(true);
    }
  }, [newlyUnlocked]);

  const openModal = (label: string, emoji: string) => {
    setSelectedBadge({ label, emoji });
    setModalVisible(true);
  };

  const xpPct: DimensionValue =
    total > 0 ? `${Math.round((unlocked.length / total) * 100)}%` : "0%";

  return (
    <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
      <WaveBackground />

      {/* Étoiles décoratives */}
      <View style={styles.stars} pointerEvents="none">
        {stars.map((s, i) => (
          <MaterialIcons
            key={i}
            name="auto-awesome"
            size={s.size}
            color="#fff"
            style={{
              position: "absolute",
              ...(s.top    !== undefined ? { top: s.top }       : {}),
              ...(s.bottom !== undefined ? { bottom: s.bottom } : {}),
              ...(s.left   !== undefined ? { left: s.left }     : {}),
              ...(s.right  !== undefined ? { right: s.right }   : {}),
              opacity: s.opacity,
            }}
          />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>Mes Badges</Text>
        <TouchableOpacity style={styles.helpBtn} onPress={loadBadges}>
          <Text style={styles.helpText}>↺</Text>
        </TouchableOpacity>
      </View>

      {/* Loader global */}
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {/* Erreur */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Carte trophée */}
        <View style={styles.card}>
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text style={styles.xpLabel}>
            {unlocked.length}/{total} badges débloqués
          </Text>
          <View style={styles.xpTrack}>
            <LinearGradient
              colors={["#7f5af0", "#bbaaff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.xpFill, { width: xpPct }]}
            />
          </View>
        </View>

        {/* ── Badges débloqués ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <Text style={styles.sectionTitle}>Badges débloqués</Text>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={COLORS.primary}
              style={{ marginLeft: 6 }}
            />
          </View>
        </View>

        <View style={styles.badgesGrid}>
          {unlocked.length === 0 && !loading && (
            <Text style={styles.emptyText}>Aucun badge débloqué pour l'instant.</Text>
          )}
          {unlocked.map((b) => {
            const meta = getBadgeMeta(b.id);
            return (
              <UnlockedBadge
                key={b.id}
                id={b.id}
                label={b.label}
                emoji={meta.emoji}
                color={meta.color}
                bg={meta.bg}
                date={b.dateObtention ?? new Date().toISOString()}
                onPress={() => openModal(b.label, meta.emoji)}
              />
            );
          })}
        </View>

        {/* ── Badges verrouillés ── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLeft}>
            <Ionicons
              name="lock-closed"
              size={15}
              color={COLORS.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.sectionTitle}>Badges à débloquer</Text>
          </View>
        </View>

        <View style={styles.badgesGrid}>
          {locked.length === 0 && !loading && (
            <Text style={styles.emptyText}>Tous les badges sont débloqués ! 🎉</Text>
          )}
          {locked.map((b) => {
            const meta = getBadgeMeta(b.id);
            return (
              <LockedBadge
                key={b.id}
                id={b.id}
                label={b.label}
                emoji={meta.emoji}
                condition={b.condition ?? "Condition non définie"}
              />
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Navbar */}
      <Navbar active="badges" onChange={() => {}} />

      {/* Modal badge */}
      <BadgeUnlockedModal
        visible={modalVisible}
        badgeName={selectedBadge.label}
        badgeEmoji={selectedBadge.emoji}
        onClose={() => {
          setModalVisible(false);
          clearNewlyUnlocked();
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  stars:           { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 54, paddingBottom: 10, zIndex: 10 },
  title:           { fontSize: 22, fontWeight: "900", color: "#2d1a6e", letterSpacing: 0.5 },
  helpBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: "#f0ecff", justifyContent: "center", alignItems: "center", shadowColor: COLORS.primary, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  helpText:        { fontSize: 18, fontWeight: "800", color: COLORS.primary },
  loaderContainer: { position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -20 }, { translateY: -20 }], zIndex: 20 },
  errorContainer:  { marginHorizontal: 20, marginTop: 8, padding: 10, backgroundColor: "#fff0f0", borderRadius: 10 },
  errorText:       { color: "#e53935", fontSize: 12, textAlign: "center" },
  scroll:          { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
  card:            { backgroundColor: "#fff", borderRadius: 20, padding: 16, alignItems: "center", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 },
  trophyEmoji:     { fontSize: 44, marginBottom: 6 },
  xpLabel:         { fontSize: 13, color: "#9b87c9", fontWeight: "600", marginBottom: 10 },
  xpTrack:         { width: "100%", height: 8, backgroundColor: "#e0d9ff", borderRadius: 8, overflow: "hidden" },
  xpFill:          { height: "100%", borderRadius: 8 },
  sectionHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionLeft:     { flexDirection: "row", alignItems: "center" },
  sectionTitle:    { fontSize: 15, fontWeight: "800", color: "#2d1a6e" },
  badgesGrid:      { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
  emptyText:       { fontSize: 12, color: "#9b87c9", fontStyle: "italic", textAlign: "center", width: "100%", paddingVertical: 10 },
});