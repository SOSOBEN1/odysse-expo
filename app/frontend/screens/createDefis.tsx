// screens/CreateDefis.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import Svg, { Path, Circle, Rect, Defs, RadialGradient, Stop } from "react-native-svg";
import { COLORS, SIZES, SHADOWS } from "../constants/theme";
import Navbar from "../components/Navbar";
import BackButton from "../components/BackButton";
import { Link, useRouter } from "expo-router";
const { width, height } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
interface Friend {
  id: number;
  name: string;
  avatarColor: string;
  hairColor: string;
  selected: boolean;
}

interface Mission {
  id: number;
  titre: string;
  description: string;
  duree: string;
  difficulte: string;
  priorite: string;
  categorie: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const INITIAL_FRIENDS: Friend[] = [
  { id: 1, name: "Selena", avatarColor: "#F48FB1", hairColor: "#5D3A1A", selected: true },
  { id: 2, name: "Ariana", avatarColor: "#CE93D8", hairColor: "#3E2723", selected: true },
  { id: 3, name: "David",  avatarColor: "#90CAF9", hairColor: "#2E2E2E", selected: true },
  { id: 4, name: "Aylin",  avatarColor: "#A5D6A7", hairColor: "#4A235A", selected: false },
  { id: 5, name: "Tom",    avatarColor: "#FFCC80", hairColor: "#1A1A1A", selected: false },
];

const DIFFICULTES = ["Facile", "Moyen", "Difficile"];
const PRIORITES   = ["Faible", "Normale", "Haute"];
const CATEGORIES  = ["Sport", "Santé", "Travail", "Bien-être", "Social"];

// ─── Mini Avatar ─────────────────────────────────────────────────────────────
const MiniAvatar = ({ color, hairColor, size = 44 }: { color: string; hairColor: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 46 46">
    <Circle cx={23} cy={23} r={22} fill={color} />
    <Circle cx={23} cy={20} r={9}  fill="#FDDBB4" />
    <Path d="M14 18 Q14 8 23 8 Q32 8 32 18 Q30 12 23 12 Q16 12 14 18 Z" fill={hairColor} />
    <Path d="M10 46 Q10 34 23 34 Q36 34 36 46 Z" fill={color} opacity={0.8} />
    <Path d="M13 44 Q13 36 23 36 Q33 36 33 44 Z" fill="#fff" opacity={0.35} />
  </Svg>
);

// ─── Background ───────────────────────────────────────────────────────────────
const BgDecoration = () => (
  <Svg width={width} height={height} style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Defs>
      <RadialGradient id="rg1" cx="15%" cy="10%" r="50%">
        <Stop offset="0%" stopColor="#DDD0FF" stopOpacity="0.65" />
        <Stop offset="100%" stopColor="#DDD0FF" stopOpacity="0" />
      </RadialGradient>
      <RadialGradient id="rg2" cx="90%" cy="55%" r="38%">
        <Stop offset="0%" stopColor="#FFD0EE" stopOpacity="0.42" />
        <Stop offset="100%" stopColor="#FFD0EE" stopOpacity="0" />
      </RadialGradient>
      <RadialGradient id="rg3" cx="5%" cy="85%" r="32%">
        <Stop offset="0%" stopColor="#C0E8FF" stopOpacity="0.38" />
        <Stop offset="100%" stopColor="#C0E8FF" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Rect x={0} y={0} width={width} height={height} fill="url(#rg1)" />
    <Rect x={0} y={0} width={width} height={height} fill="url(#rg2)" />
    <Rect x={0} y={0} width={width} height={height} fill="url(#rg3)" />
    <Path d="M28 92 H42 M35 85 V99" stroke="#B89EFF" strokeWidth={2.2} strokeLinecap="round" opacity={0.5} />
    <Path d={`M${width-38} 150 H${width-24} M${width-31} 143 V157`} stroke="#B89EFF" strokeWidth={2.2} strokeLinecap="round" opacity={0.45} />
    <Path d={`M${width-50} 110 L${width-47} 101 L${width-44} 110 L${width-53} 105 L${width-41} 105 Z`} fill="#C8B0FF" opacity={0.42} />
    <Path d="M56 368 L59 359 L62 368 L53 363 L65 363 Z" fill="#C8B0FF" opacity={0.35} />
    <Circle cx={width-15} cy={195} r={3.2} fill="#C4AEFF" opacity={0.48} />
    <Circle cx={15}       cy={290} r={2.8} fill="#C4AEFF" opacity={0.40} />
    <Circle cx={width-26} cy={400} r={2.2} fill="#FFB0CC" opacity={0.45} />
    <Circle cx={36}       cy={470} r={3}   fill="#88C8FF" opacity={0.36} />
  </Svg>
);

// ─── Header Icons ─────────────────────────────────────────────────────────────
const HeaderIcons = () => (
  <View style={styles.headerIcons}>
    <TouchableOpacity style={styles.iconBtn}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
          stroke={COLORS.primary} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={18} cy={6} r={4} fill="#FF5252" />
      </Svg>
    </TouchableOpacity>
    <TouchableOpacity style={styles.iconBtn}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={3} stroke={COLORS.primary} strokeWidth={1.9} />
        <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
          stroke={COLORS.primary} strokeWidth={1.9} strokeLinecap="round" />
      </Svg>
    </TouchableOpacity>
  </View>
);

// ─── Styled TextInput ─────────────────────────────────────────────────────────
const FocusInput = ({
  placeholder,
  value,
  onChangeText,
  multiline = false,
  numberOfLines = 1,
  style,
}: {
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  style?: object;
}) => {
  const border = useRef(new Animated.Value(0)).current;
  const bc = border.interpolate({ inputRange: [0, 1], outputRange: ["rgba(180,160,220,0.3)", COLORS.primary] });

  return (
    <Animated.View style={[styles.inputWrap, { borderColor: bc }, multiline && { height: numberOfLines * 22 + 20 }, style]}>
      <TextInput
        style={[styles.input, multiline && { height: "100%", textAlignVertical: "top", paddingTop: 10 }]}
        placeholder={placeholder}
        placeholderTextColor="rgba(120,90,180,0.35)"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : undefined}
        onFocus={() => Animated.spring(border, { toValue: 1, useNativeDriver: false, tension: 200, friction: 12 }).start()}
        onBlur={()  => Animated.spring(border, { toValue: 0, useNativeDriver: false, tension: 200, friction: 12 }).start()}
      />
    </Animated.View>
  );
};

// ─── Dropdown ─────────────────────────────────────────────────────────────────
const Dropdown = ({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ zIndex: open ? 999 : 1 }}>
      <TouchableOpacity
        style={[styles.dropBtn, open && styles.dropBtnOpen]}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.85}
      >
        <Text style={[styles.dropValue, !value && styles.dropPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d={open ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"}
            stroke={COLORS.primary} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropMenu}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.dropOption, value === opt && styles.dropOptionSelected]}
              onPress={() => { onChange(opt); setOpen(false); }}
            >
              <Text style={[styles.dropOptionText, value === opt && styles.dropOptionTextSelected]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Mission Card ─────────────────────────────────────────────────────────────
const MissionCard = ({
  mission,
  index,
  onChange,
  onRemove,
}: {
  mission: Mission;
  index: number;
  onChange: (id: number, field: keyof Mission, value: string) => void;
  onRemove: (id: number) => void;
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }).start();
  }, []);

  return (
    <Animated.View style={[
      styles.missionCard,
      { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
    ]}>
      {/* Header */}
      <View style={styles.missionHeader}>
        <View style={styles.missionBadge}>
          <Text style={styles.missionBadgeText}>{index + 1}</Text>
        </View>
        <Text style={styles.missionTitle}>Mission {index + 1}</Text>
        <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(mission.id)}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke="#C93A3A" strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Titre */}
      <View style={styles.missionField}>
        <Text style={styles.fieldLabel}>Titre :</Text>
        <FocusInput
          placeholder="Titre de la mission"
          value={mission.titre}
          onChangeText={(v) => onChange(mission.id, "titre", v)}
        />
      </View>

      {/* Description */}
      <View style={styles.missionField}>
        <Text style={styles.fieldLabel}>Description :</Text>
        <FocusInput
          placeholder="Décrivez la mission"
          value={mission.description}
          onChangeText={(v) => onChange(mission.id, "description", v)}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Durée + Difficulté */}
      <View style={styles.missionRow}>
        <View style={styles.missionCol}>
          <Text style={styles.fieldLabel}>Durée :</Text>
          <FocusInput
            placeholder="ex: 30 min"
            value={mission.duree}
            onChangeText={(v) => onChange(mission.id, "duree", v)}
          />
        </View>
        <View style={[styles.missionCol, { zIndex: 300 }]}>
          <Text style={styles.fieldLabel}>Difficulté :</Text>
          <Dropdown
            placeholder="Choisir"
            options={DIFFICULTES}
            value={mission.difficulte}
            onChange={(v) => onChange(mission.id, "difficulte", v)}
          />
        </View>
      </View>

      {/* Priorité + Catégorie */}
      <View style={[styles.missionRow, { zIndex: 200 }]}>
        <View style={[styles.missionCol, { zIndex: 200 }]}>
          <Text style={styles.fieldLabel}>Priorité :</Text>
          <Dropdown
            placeholder="Choisir"
            options={PRIORITES}
            value={mission.priorite}
            onChange={(v) => onChange(mission.id, "priorite", v)}
          />
        </View>
        <View style={[styles.missionCol, { zIndex: 200 }]}>
          <Text style={styles.fieldLabel}>Catégorie :</Text>
          <Dropdown
            placeholder="Choisir"
            options={CATEGORIES}
            value={mission.categorie}
            onChange={(v) => onChange(mission.id, "categorie", v)}
          />
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CreateDefisScreen() {
  const router = useRouter();
  const [friends, setFriends]           = useState<Friend[]>(INITIAL_FRIENDS);
  const [titre, setTitre]               = useState("");
  const [description, setDescription]  = useState("");
  const [dateDebut, setDateDebut]       = useState("");
  const [dateFin, setDateFin]           = useState("");
  const [missions, setMissions]         = useState<Mission[]>([]);
  const [missionCounter, setCounter]    = useState(1);
  const [missionsOpen, setMissionsOpen] = useState(true);

  const titleAnim = useRef(new Animated.Value(0)).current;
  const ctaScale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(titleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9, delay: 100 }).start();
  }, []);

  const toggleFriend = (id: number) =>
    setFriends((prev) => prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)));

  const addMission = () => {
    setMissions((prev) => [...prev, { id: missionCounter, titre: "", description: "", duree: "", difficulte: "", priorite: "", categorie: "" }]);
    setCounter((c) => c + 1);
  };

  const removeMission = (id: number) => setMissions((prev) => prev.filter((m) => m.id !== id));

  const updateMission = (id: number, field: keyof Mission, value: string) =>
    setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));

  const handleCreate = () => {
    Animated.sequence([
      Animated.spring(ctaScale, { toValue: 0.96, useNativeDriver: true, tension: 300 }),
      Animated.spring(ctaScale, { toValue: 1,    useNativeDriver: true, tension: 200 }),
    ]).start();
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <BgDecoration />

      {/* Top bar */}
      <View style={styles.topBar}>
        <BackButton  onPress={() => router.push("/frontend/screens/DefisStat")} />
        <HeaderIcons />
      </View>

      {/* ── Scrollable content ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Animated.View style={{
            opacity: titleAnim,
            transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }],
          }}>
            <Text style={styles.pageTitle}>Créer le défis:</Text>
          </Animated.View>

          {/* ── Friends horizontal scroller ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendsRow}
            style={styles.friendsScroll}
          >
            <TouchableOpacity style={styles.arrowBtn}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M15 18L9 12L15 6" stroke={COLORS.primary} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>

            {friends.map((f) => (
              <TouchableOpacity key={f.id} style={styles.friendItem} onPress={() => toggleFriend(f.id)} activeOpacity={0.85}>
                <View style={[styles.avatarRing, f.selected && styles.avatarRingSelected]}>
                  <MiniAvatar color={f.avatarColor} hairColor={f.hairColor} size={44} />
                  {f.selected && (
                    <View style={styles.friendCheck}>
                      <Svg width={10} height={10} viewBox="0 0 14 14" fill="none">
                        <Path d="M2.5 7L5.5 10L11.5 4" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    </View>
                  )}
                </View>
                <Text style={[styles.friendName, f.selected && styles.friendNameSelected]}>{f.name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.arrowBtn}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M9 6L15 12L9 18" stroke={COLORS.primary} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </ScrollView>

          {/* ── Main form card ── */}
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>Titre :</Text>
            <FocusInput placeholder="Saisir le titre du défi" value={titre} onChangeText={setTitre} />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Description :</Text>
            <FocusInput
              placeholder="Décrivez le défi à accomplir ici"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Date début :</Text>
                <FocusInput placeholder="JJ/MM/AAAA" value={dateDebut} onChangeText={setDateDebut} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Date fin :</Text>
                <FocusInput placeholder="JJ/MM/AAAA" value={dateFin} onChangeText={setDateFin} />
              </View>
            </View>
          </View>

          {/* ── Missions section header ── */}
          <TouchableOpacity style={styles.missionsSectionBtn} onPress={() => setMissionsOpen((o) => !o)} activeOpacity={0.85}>
            <View style={styles.missionsSectionLeft}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={9} stroke={COLORS.primary} strokeWidth={2} />
                <Path d="M8.5 12l2.5 2.5L15.5 9" stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={styles.missionsSectionTitle}>Missions du défis :</Text>
            </View>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d={missionsOpen ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"}
                stroke={COLORS.primary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          {/* ── Mission cards ── */}
          {missionsOpen && (
            <View style={styles.missionsContainer}>
              {missions.map((m, i) => (
                <MissionCard
                  key={m.id}
                  mission={m}
                  index={i}
                  onChange={updateMission}
                  onRemove={removeMission}
                />
              ))}

              {/* Add mission */}
              <TouchableOpacity style={styles.addMissionBtn} onPress={addMission} activeOpacity={0.85}>
                <Svg width={20} height={20} viewBox="0 0 18 18" fill="none">
                  <Circle cx={9} cy={9} r={8} fill={COLORS.primary} />
                  <Path d="M9 5V13M5 9H13" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                </Svg>
                <Text style={styles.addMissionText}>Ajouter mission</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── CTA inside scroll, after missions ── */}
          <Animated.View style={[styles.ctaWrap, { transform: [{ scale: ctaScale }] }]}>
            <TouchableOpacity style={styles.ctaBtn} onPress={handleCreate} activeOpacity={0.88}>
              <View style={styles.ctaShine} pointerEvents="none" />
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                <Path d="M12 2L14.9 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L9.1 8.26L12 2Z"
                  fill="#fff" stroke="#fff" strokeWidth={1} />
              </Svg>
              <Text style={styles.ctaBtnText}>Créer le défi</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Bottom padding so CTA clears the navbar */}
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Navbar FIXE en bas ── */}
      <View style={styles.navbarFixed}>
        <Navbar active="defis" onChange={() => {}} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const GAP = 10;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3EEFF",
  },

  // ── Top bar ──
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 46 : 60,
    paddingHorizontal: SIZES.padding,
    zIndex: 10,
  },
  headerIcons: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.82)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    shadowColor: "#9574e0",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
  },

  // ── Title ──
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#17063B",
    marginBottom: 16,
    fontFamily: "Georgia",
    letterSpacing: -0.4,
  },

  // ── Friends ──
  friendsScroll: { marginBottom: 14 },
  friendsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.78)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(180,150,230,0.25)",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  friendItem: { alignItems: "center", gap: 5, width: 58 },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  avatarRingSelected: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  friendCheck: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#F3EEFF",
  },
  friendName: { fontSize: 11, color: "rgba(80,50,140,0.6)", fontWeight: "500", textAlign: "center" },
  friendNameSelected: { color: COLORS.primary, fontWeight: "700" },

  // ── Form Card ──
  formCard: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(200,180,240,0.35)",
    shadowColor: "#9574e0",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3D1F7A",
    marginBottom: 5,
  },

  // ── Input ──
  inputWrap: {
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.92)",
    marginBottom: 2,
    overflow: "hidden",
  },
  input: {
    fontSize: 13,
    color: "#2A1060",
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontWeight: "500",
    minHeight: 38,
  },

  // ── Date row ──
  dateRow: { flexDirection: "row", gap: GAP, marginTop: 12 },

  // ── Missions section btn ──
  missionsSectionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(200,180,240,0.35)",
    shadowColor: "#9574e0",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  missionsSectionLeft: { flexDirection: "row", alignItems: "center", gap: 9 },
  missionsSectionTitle: { fontSize: 14, fontWeight: "700", color: "#3D1F7A" },

  // ── Missions container ──
  missionsContainer: { gap: 10, marginBottom: 14 },

  // ── Mission Card ──
  missionCard: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(200,180,240,0.35)",
    shadowColor: "#9574e0",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    gap: 10,
  },
  missionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  missionBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  missionBadgeText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  missionTitle: { flex: 1, fontSize: 13, fontWeight: "700", color: "#3D1F7A" },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFE8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  missionField: { gap: 4 },
  missionRow: {
    flexDirection: "row",
    gap: GAP,
  },
  missionCol: { flex: 1, gap: 4 },

  // ── Dropdown ──
  dropBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(180,160,220,0.3)",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 9,
    minHeight: 38,
  },
  dropBtnOpen: {
    borderColor: COLORS.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropValue: { fontSize: 12, fontWeight: "600", color: "#2A1060", flex: 1 },
  dropPlaceholder: { color: "rgba(120,90,180,0.35)", fontWeight: "500" },
  dropMenu: {
    position: "absolute",
    top: 38,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 9999,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 20,
  },
  dropOption: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(180,160,220,0.2)",
  },
  dropOptionSelected: { backgroundColor: `${COLORS.primary}12` },
  dropOptionText: { fontSize: 12, fontWeight: "500", color: "#2A1060" },
  dropOptionTextSelected: { color: COLORS.primary, fontWeight: "700" },

  // ── Add mission btn ──
  addMissionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}0D`,
  },
  addMissionText: { fontSize: 14, fontWeight: "700", color: COLORS.primary },

  // ── CTA inside scroll ──
  ctaWrap: { width: "100%", marginTop: 6 },
  ctaBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 7 },
    elevation: 12,
  },
  ctaShine: {
    position: "absolute",
    top: 0,
    left: "18%",
    right: "18%",
    height: "42%",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.4 },

  // ── Navbar fixe ──
  navbarFixed: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
