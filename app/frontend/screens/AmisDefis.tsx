// screens/AmisDefis.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { inviterAmi } from "../../../backend/InvitationService";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";
import { COLORS, SIZES } from "../constants/theme";

const { width } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
interface InviteEntry {
  id: number;
  email: string;
  status: "idle" | "sending" | "sent" | "error";
  errorMsg?: string;
}

// ─── Background déco ──────────────────────────────────────────────────────────
const BgDecoration = () => (
  <Svg width={width} height={320} style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Defs>
      <RadialGradient id="rg1" cx="20%" cy="5%" r="55%">
        <Stop offset="0%" stopColor="#DDD0FF" stopOpacity="0.7" />
        <Stop offset="100%" stopColor="#DDD0FF" stopOpacity="0" />
      </RadialGradient>
      <RadialGradient id="rg2" cx="85%" cy="40%" r="40%">
        <Stop offset="0%" stopColor="#FFD0EE" stopOpacity="0.45" />
        <Stop offset="100%" stopColor="#FFD0EE" stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Rect x={0} y={0} width={width} height={320} fill="url(#rg1)" />
    <Rect x={0} y={0} width={width} height={320} fill="url(#rg2)" />
  </Svg>
);

// ─── Icône statut ─────────────────────────────────────────────────────────────
const StatusIcon = ({ status }: { status: InviteEntry["status"] }) => {
  if (status === "sending") return <ActivityIndicator size="small" color={COLORS.primary} />;
  if (status === "sent")
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} fill="#4CAF50" />
        <Path d="M7 12l3.5 3.5L17 8" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  if (status === "error")
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10} fill="#FF5252" />
        <Path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
      </Svg>
    );
  return null;
};

// ─── Chip email ───────────────────────────────────────────────────────────────
const EmailChip = ({
  entry,
  onRemove,
}: {
  entry: InviteEntry;
  onRemove: (id: number) => void;
}) => {
  const colors: Record<InviteEntry["status"], string> = {
    idle:    "rgba(149,116,224,0.12)",
    sending: "rgba(149,116,224,0.18)",
    sent:    "rgba(76,175,80,0.12)",
    error:   "rgba(255,82,82,0.12)",
  };
  const borderColors: Record<InviteEntry["status"], string> = {
    idle:    "rgba(149,116,224,0.3)",
    sending: COLORS.primary,
    sent:    "#4CAF50",
    error:   "#FF5252",
  };

  return (
    <View style={[styles.chip, { backgroundColor: colors[entry.status], borderColor: borderColors[entry.status] }]}>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ marginRight: 5 }}>
        <Path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"
          stroke={entry.status === "sent" ? "#4CAF50" : entry.status === "error" ? "#FF5252" : COLORS.primary}
          strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M22 6l-10 7L2 6"
          stroke={entry.status === "sent" ? "#4CAF50" : entry.status === "error" ? "#FF5252" : COLORS.primary}
          strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
      <Text style={[styles.chipText, entry.status === "sent" && { color: "#2E7D32" }, entry.status === "error" && { color: "#C62828" }]}
        numberOfLines={1}>
        {entry.email}
      </Text>
      <StatusIcon status={entry.status} />
      {entry.status !== "sending" && (
        <TouchableOpacity onPress={() => onRemove(entry.id)} style={styles.chipRemove}>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke="#888" strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AmisDefisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Reçoit l'ID + nom du défi depuis CreateDefis ou DefiScreen
  const defiId   = params.defiId   ? Number(params.defiId)   : 0;
  const defiNom  = params.defiNom  ? String(params.defiNom)  : "Mon défi";
  const defiDesc = params.defiDesc ? String(params.defiDesc) : "";

  const [emailInput,   setEmailInput]   = useState("");
  const [entries,      setEntries]      = useState<InviteEntry[]>([]);
  const [entryCounter, setCounter]      = useState(1);
  const [sending,      setSending]      = useState(false);

  const titleAnim = useRef(new Animated.Value(0)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(titleAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9 }).start();
  }, []);

  // ─── Valider un email ──────────────────────────────────────────────────────
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  // ─── Ajouter un email à la liste ──────────────────────────────────────────
  const addEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;

    if (!isValidEmail(trimmed)) {
      Alert.alert("Email invalide", "Vérifie le format de l'adresse email.");
      return;
    }
    if (entries.some((e) => e.email === trimmed)) {
      Alert.alert("Doublon", "Cet email est déjà dans la liste.");
      return;
    }

    setEntries((prev) => [...prev, { id: entryCounter, email: trimmed, status: "idle" }]);
    setCounter((c) => c + 1);
    setEmailInput("");
  };

  const removeEntry = (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntryStatus = (id: number, status: InviteEntry["status"], errorMsg?: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status, errorMsg } : e)));
  };

  // ─── Envoyer toutes les invitations ───────────────────────────────────────
  const handleSendAll = async () => {
    const toSend = entries.filter((e) => e.status === "idle" || e.status === "error");
    if (toSend.length === 0) {
      Alert.alert("Aucune invitation à envoyer", "Ajoute des adresses email d'abord.");
      return;
    }
    if (defiId === 0) {
      Alert.alert("Erreur", "Aucun défi sélectionné. Crée d'abord un défi.");
      return;
    }

    setSending(true);

    Animated.sequence([
      Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, tension: 300 }),
      Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true, tension: 200 }),
    ]).start();

    // Envoi en parallèle
    await Promise.all(
      toSend.map(async (entry) => {
        updateEntryStatus(entry.id, "sending");
        try {
          const result = await inviterAmi({
            email:            entry.email,
            defiId,
            defiNom,
            defiDescription:  defiDesc,
            inviteurNom:      "Moi",   // ← remplace par le nom de l'user connecté
            inviteurId:       1,       // ← remplace par l'ID de l'user connecté
          });

          if (result.emailOk) {
            updateEntryStatus(entry.id, "sent");
          } else {
            updateEntryStatus(entry.id, "error", "Email non envoyé");
          }
        } catch {
          updateEntryStatus(entry.id, "error", "Erreur réseau");
        }
      })
    );

    setSending(false);

    const sentCount  = entries.filter((e) => e.status === "sent").length;
    const errorCount = entries.filter((e) => e.status === "error").length;

    if (errorCount === 0) {
  Alert.alert(
    "✅ Invitations envoyées !",
    `${toSend.length} ami${toSend.length > 1 ? "s" : ""} invité${toSend.length > 1 ? "s" : ""} avec succès.\nIls recevront un email + une notification dans l'app.`,
    [{
      text: "Voir la progression",
      onPress: () => router.push({
        pathname: "/frontend/screens/ProgressionDefis",
        params: { defiId },
      }),
    }]
  );
} else {
      Alert.alert(
        "Résultat partiel",
        `✅ ${sentCount} envoyé(s)  ❌ ${errorCount} échoué(s).\nReessaie pour les erreurs.`
      );
    }
  };

  const pendingCount = entries.filter((e) => e.status === "idle" || e.status === "error").length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <BgDecoration />

      <View style={styles.topBar}>
        <BackButton onPress={() => router.back()} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View style={{
            opacity: titleAnim,
            transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }) }],
          }}>
            <Text style={styles.pageTitle}>Inviter des amis</Text>
            <Text style={styles.pageSubtitle}>
              Invite tes amis à rejoindre{"\n"}
              <Text style={styles.defiNameHighlight}>« {defiNom} »</Text>
            </Text>
          </Animated.View>

          {/* Explication */}
          <View style={styles.infoCard}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ marginRight: 10, flexShrink: 0 }}>
              <Circle cx={12} cy={12} r={10} fill={`${COLORS.primary}20`} />
              <Path d="M12 16v-4M12 8h.01" stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={styles.infoText}>
              Chaque ami recevra <Text style={styles.infoBold}>un email d'invitation</Text> et{" "}
              <Text style={styles.infoBold}>une notification dans l'app</Text> s'il est déjà inscrit.
            </Text>
          </View>

          {/* Saisie email */}
          <View style={styles.inputCard}>
            <Text style={styles.fieldLabel}>Adresse email :</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                  <Path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"
                    stroke="rgba(120,90,180,0.5)" strokeWidth={1.8} />
                  <Path d="M22 6l-10 7L2 6" stroke="rgba(120,90,180,0.5)" strokeWidth={1.8} strokeLinecap="round" />
                </Svg>
                <TextInput
                  style={styles.input}
                  placeholder="ami@exemple.com"
                  placeholderTextColor="rgba(120,90,180,0.35)"
                  value={emailInput}
                  onChangeText={setEmailInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={addEmail}
                />
                {emailInput.length > 0 && (
                  <TouchableOpacity onPress={() => setEmailInput("")}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path d="M18 6L6 18M6 6l12 12" stroke="#aaa" strokeWidth={2.4} strokeLinecap="round" />
                    </Svg>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.addBtn} onPress={addEmail} activeOpacity={0.85}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Liste des chips */}
            {entries.length > 0 && (
              <View style={styles.chipsContainer}>
                {entries.map((entry) => (
                  <EmailChip key={entry.id} entry={entry} onRemove={removeEntry} />
                ))}
              </View>
            )}

            {/* Compteur */}
            {entries.length > 0 && (
              <Text style={styles.counter}>
                {entries.filter((e) => e.status === "sent").length}/{entries.length} invitations envoyées
              </Text>
            )}
          </View>

          {/* Liste vide */}
          {entries.length === 0 && (
            <View style={styles.emptyState}>
              <Svg width={56} height={56} viewBox="0 0 64 64" fill="none">
                <Circle cx={32} cy={32} r={30} fill={`${COLORS.primary}15`} />
                <Path d="M20 28h24M20 36h16" stroke={COLORS.primary} strokeWidth={2.5} strokeLinecap="round" />
                <Circle cx={44} cy={20} r={8} fill={`${COLORS.primary}25`} stroke={COLORS.primary} strokeWidth={2} />
                <Path d="M44 17v6M41 20h6" stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" />
              </Svg>
              <Text style={styles.emptyTitle}>Aucun ami ajouté</Text>
              <Text style={styles.emptySubtitle}>Saisis une adresse email ci-dessus{"\n"}et appuie sur « + »</Text>
            </View>
          )}

          {/* Bouton envoyer */}
          <Animated.View style={[styles.ctaWrap, { transform: [{ scale: btnScale }] }]}>
            <TouchableOpacity
              style={[styles.ctaBtn, (entries.length === 0 || sending) && styles.ctaBtnDisabled]}
              onPress={handleSendAll}
              activeOpacity={0.88}
              disabled={entries.length === 0 || sending}
            >
              {sending ? (
                <>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 10 }} />
                  <Text style={styles.ctaBtnText}>Envoi en cours...</Text>
                </>
              ) : (
                <>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                    <Path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                      stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text style={styles.ctaBtnText}>
                    Envoyer {pendingCount > 0 ? `${pendingCount} invitation${pendingCount > 1 ? "s" : ""}` : "les invitations"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.navbarFixed}>
        <Navbar active="defis" onChange={() => {}} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3EEFF" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 46 : 60,
    paddingHorizontal: SIZES.padding,
    zIndex: 10,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SIZES.padding, paddingTop: 20 },
  pageTitle: {
    fontSize: 26, fontWeight: "800", color: "#17063B",
    fontFamily: "Georgia", letterSpacing: -0.4, marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14, color: "rgba(60,30,100,0.6)", marginBottom: 20, lineHeight: 20,
  },
  defiNameHighlight: {
    color: COLORS.primary, fontWeight: "700",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${COLORS.primary}25`,
  },
  infoText: { flex: 1, fontSize: 13, color: "#3D1F7A", lineHeight: 19 },
  infoBold: { fontWeight: "700" },
  inputCard: {
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 22, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(200,180,240,0.35)",
    shadowColor: "#9574e0", shadowOpacity: 0.1, shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#3D1F7A", marginBottom: 8 },
  inputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  inputWrap: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 12, borderWidth: 1.5, borderColor: "rgba(180,160,220,0.35)",
    paddingHorizontal: 12, paddingVertical: 10, minHeight: 44,
  },
  input: {
    flex: 1, fontSize: 14, color: "#2A1060", fontWeight: "500", padding: 0,
  },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  chip: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1.5, maxWidth: "100%",
  },
  chipText: {
    fontSize: 12, fontWeight: "600", color: "#3D1F7A",
    flexShrink: 1, maxWidth: 160, marginRight: 6,
  },
  chipRemove: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center", justifyContent: "center",
    marginLeft: 4,
  },
  counter: {
    fontSize: 12, color: "rgba(60,30,100,0.5)",
    marginTop: 10, textAlign: "right", fontWeight: "600",
  },
  emptyState: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#3D1F7A" },
  emptySubtitle: { fontSize: 13, color: "rgba(60,30,100,0.5)", textAlign: "center", lineHeight: 18 },
  ctaWrap: { width: "100%", marginTop: 8 },
  ctaBtn: {
    width: "100%", backgroundColor: COLORS.primary, borderRadius: 32, paddingVertical: 17,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.primary, shadowOpacity: 0.5, shadowRadius: 20,
    shadowOffset: { width: 0, height: 7 }, elevation: 12,
  },
  ctaBtnDisabled: { backgroundColor: "rgba(149,116,224,0.35)", shadowOpacity: 0, elevation: 0 },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "800", letterSpacing: 0.4 },
  navbarFixed: { position: "absolute", bottom: 0, left: 0, right: 0 },
});