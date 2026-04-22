import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated, Dimensions, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { inviterAmi } from "../../../backend/InvitationService";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";
import { supabase } from "../constants/supabase";
import { COLORS, SHADOWS, SIZES } from "../constants/theme";
import { useUser } from "../constants/UserContext";

const { width, height } = Dimensions.get("window");

interface User {
  id_user: number;
  nom: string;
  prenom: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
}

interface EmailEntry {
  id: number;
  email: string;
}

const AVATAR_COLORS = ["#F48FB1","#90CAF9","#CE93D8","#A5D6A7","#FFCC80","#80DEEA"];

// ─── Mini Avatar ─────────────────────────────────────────────────────────────
const MiniAvatar = ({ user, index }: { user: User; index: number }) => {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initials = `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase();
  return (
    <View style={[styles.avatarCircle, { backgroundColor: color }]}>
      <Text style={styles.avatarInitials}>{initials}</Text>
    </View>
  );
};

// ─── Check Circle ─────────────────────────────────────────────────────────────
const CheckCircle = ({ selected }: { selected: boolean }) => (
  <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
    {selected && (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path d="M4 9L7.5 12.5L14 6" stroke="#fff" strokeWidth={2.2}
          strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    )}
  </View>
);

// ─── User Row ─────────────────────────────────────────────────────────────────
const UserRow = ({ user, index, selected, onToggle, delay }: {
  user: User; index: number; selected: boolean;
  onToggle: () => void; delay: number;
}) => {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, useNativeDriver: true, tension: 60, friction: 9 }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  const displayName = user.username ? `@${user.username}` : `${user.prenom} ${user.nom}`;

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0,1], outputRange: [20,0] }) },
        { scale },
      ],
    }}>
      <TouchableOpacity
        style={[styles.userRow, selected && styles.userRowSelected]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <MiniAvatar user={user} index={index} />
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
        <CheckCircle selected={selected} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Background ───────────────────────────────────────────────────────────────
const BgSparkles = () => (
  <Svg width={width} height={height} style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Path d="M28 110 H40 M34 104 V116" stroke={COLORS.secondary} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
    <Circle cx={width - 20} cy={200} r={3} fill={COLORS.primaryLight} opacity={0.5} />
    <Circle cx={20} cy={300} r={2.5} fill={COLORS.primaryLight} opacity={0.4} />
    <Circle cx={45} cy={450} r={3} fill={COLORS.primaryLight} opacity={0.35} />
  </Svg>
);

// ─── Custom Alert Modal ───────────────────────────────────────────────────────
const CustomAlert = ({
  visible,
  onNavigate,
  defiNom,
  totalCount,
}: {
  visible: boolean;
  onNavigate: () => void;
  defiNom: string;
  totalCount: number;
}) => {
  const scaleAnim   = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      checkAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start(() => {
        Animated.spring(checkAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 7 }).start();
      });
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      checkAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={alertStyles.overlay}>
      {/* Backdrop blur effect via opacity layer */}
      <Animated.View style={[alertStyles.card, {
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }],
      }]}>

        {/* ── Icône animée ── */}
        <Animated.View style={[alertStyles.iconOuter, {
          transform: [{ scale: checkAnim }],
        }]}>
          <View style={alertStyles.iconInner}>
            <Svg width={38} height={38} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 12l4.5 4.5L19 7"
                stroke="#fff"
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </Animated.View>

        {/* ── Texte ── */}
        <Text style={alertStyles.title}>C'est parti ! 🎉</Text>
        <Text style={alertStyles.subtitle}>
          <Text style={alertStyles.count}>
            {totalCount} invitation{totalCount > 1 ? "s" : ""}
          </Text>
          {" "}envoyée{totalCount > 1 ? "s" : ""} pour rejoindre{"\n"}
          <Text style={alertStyles.defiHighlight}>« {defiNom} »</Text>
        </Text>

        {/* ── Séparateur ── */}
        <View style={alertStyles.separator} />

        {/* ── Bouton principal ── */}
        <TouchableOpacity style={alertStyles.btn} onPress={onNavigate} activeOpacity={0.88}>
          <Text style={alertStyles.btnText}>Voir la progression</Text>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginLeft: 8 }}>
            <Path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth={2.2}
              strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
};

const alertStyles = StyleSheet.create({
  overlay:       {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(12,4,32,0.62)",
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card:          {
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 28,
    alignItems: "center",
    width: "100%",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.22,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 24,
    borderWidth: 1,
    borderColor: `${COLORS.primary}18`,
  },
  iconOuter:     {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}18`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconInner:     {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  title:         {
    fontSize: 22,
    fontWeight: "800",
    color: "#17063B",
    fontFamily: "Georgia",
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle:      {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 22,
  },
  count:         { fontWeight: "800", color: COLORS.primary },
  defiHighlight: { color: COLORS.primary, fontWeight: "700" },
  separator:     {
    width: "100%",
    height: 1,
    backgroundColor: `${COLORS.primary}14`,
    marginBottom: 20,
  },
  btn:           {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 32,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.38,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  btnText:       {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DefierAmisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { userId } = useUser();

  const defiId  = params.defiId  ? Number(params.defiId)  : 0;
  const defiNom = params.defiNom ? String(params.defiNom) : "Mon défi";
  const defiDesc= params.defiDesc? String(params.defiDesc): "";

  const [users,        setUsers]        = useState<User[]>([]);
  const [selected,     setSelected]     = useState<number[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [emailInput,   setEmailInput]   = useState("");
  const [emailEntries, setEmailEntries] = useState<EmailEntry[]>([]);
  const [emailCounter, setEmailCounter] = useState(1);
  const [alertVisible, setAlertVisible] = useState(false);
  const [sentCount,    setSentCount]    = useState(0);

  const titleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(titleAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }).start();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id_user, nom, prenom, email, username, avatar_url")
      .neq("id_user", userId ?? 0)
      .order("prenom", { ascending: true });
    if (!error && data) setUsers(data);
    setLoading(false);
  };

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const addEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!isValidEmail(trimmed)) return;
    if (emailEntries.some((e) => e.email === trimmed)) return;
    const selectedUserEmails = users.filter(u => selected.includes(u.id_user)).map(u => u.email);
    if (selectedUserEmails.includes(trimmed)) return;
    setEmailEntries((prev) => [...prev, { id: emailCounter, email: trimmed }]);
    setEmailCounter((c) => c + 1);
    setEmailInput("");
  };

  const removeEmail = (id: number) =>
    setEmailEntries((prev) => prev.filter((e) => e.id !== id));

  // ─── Envoyer toutes les invitations ──────────────────────────────────────
  const handleSendAll = async () => {
    const selectedUsers = users.filter((u) => selected.includes(u.id_user));
    const totalCount = selectedUsers.length + emailEntries.length;
    if (totalCount === 0) return;

    setSending(true);

    const { data: meData } = await supabase
      .from("users")
      .select("prenom, nom")
      .eq("id_user", userId ?? 0)
      .single();
    const inviteurNom = meData ? `${meData.prenom} ${meData.nom}` : "Un ami";

    await Promise.all([
      ...selectedUsers.map((u) =>
        inviterAmi({
          email:           u.email,
          defiId,
          defiNom,
          defiDescription: defiDesc,
          inviteurNom,
          inviteurId:      userId ?? 1,
        })
      ),
      ...emailEntries.map((e) =>
        inviterAmi({
          email:           e.email,
          defiId,
          defiNom,
          defiDescription: defiDesc,
          inviteurNom,
          inviteurId:      userId ?? 1,
        })
      ),
    ]);

    setSending(false);
    setSentCount(totalCount);
    setAlertVisible(true);
  };

  const totalSelected = selected.length + emailEntries.length;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <BgSparkles />

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
          {/* Titre */}
          <Animated.View style={{
            opacity: titleAnim,
            transform: [{ translateY: titleAnim.interpolate({ inputRange:[0,1], outputRange:[-16,0] }) }],
          }}>
            <Text style={styles.pageTitle}>Inviter des amis</Text>
            <Text style={styles.pageSubtitle}>
              Pour le défi <Text style={styles.defiHighlight}>« {defiNom} »</Text>
            </Text>
          </Animated.View>

          {/* ── Section 1 : Utilisateurs de l'app ── */}
          <Text style={styles.sectionLabel}>👥 Utilisateurs de l'app</Text>
          <View style={styles.listCard}>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} style={{ padding: 24 }} />
            ) : users.length === 0 ? (
              <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
            ) : (
              users.map((u, i) => (
                <React.Fragment key={u.id_user}>
                  <UserRow
                    user={u} index={i}
                    selected={selected.includes(u.id_user)}
                    onToggle={() => toggle(u.id_user)}
                    delay={i * 60}
                  />
                  {i < users.length - 1 && <View style={styles.separator} />}
                </React.Fragment>
              ))
            )}
          </View>

          {/* ── Section 2 : Emails externes ── */}
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>📧 Inviter par email</Text>
          <View style={styles.emailCard}>
            <View style={styles.emailInputRow}>
              <View style={styles.emailInputWrap}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                  <Path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"
                    stroke="rgba(120,90,180,0.5)" strokeWidth={1.8} />
                  <Path d="M22 6l-10 7L2 6" stroke="rgba(120,90,180,0.5)" strokeWidth={1.8} strokeLinecap="round" />
                </Svg>
                <TextInput
                  style={styles.emailInput}
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
                    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
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

            {/* Chips emails */}
            {emailEntries.length > 0 && (
              <View style={styles.chipsContainer}>
                {emailEntries.map((e) => (
                  <View key={e.id} style={styles.chip}>
                    <Text style={styles.chipText} numberOfLines={1}>{e.email}</Text>
                    <TouchableOpacity onPress={() => removeEmail(e.id)} style={styles.chipRemove}>
                      <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                        <Path d="M18 6L6 18M6 6l12 12" stroke="#888" strokeWidth={2.4} strokeLinecap="round" />
                      </Svg>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 160 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── CTA ── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.ctaBtn, (totalSelected === 0 || sending) && styles.ctaBtnDisabled]}
          activeOpacity={totalSelected > 0 ? 0.85 : 1}
          onPress={handleSendAll}
          disabled={totalSelected === 0 || sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaBtnText}>
              {totalSelected > 0
                ? `Envoyer ${totalSelected} invitation${totalSelected > 1 ? "s" : ""}`
                : "Sélectionne des amis"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Navbar active="defis" onChange={() => {}} />

      {/* ── Custom Alert ── */}
      <CustomAlert
        visible={alertVisible}
        defiNom={defiNom}
        totalCount={sentCount}
        onNavigate={() => {
          setAlertVisible(false);
          router.push({
            pathname: "/frontend/screens/ProgressionDefis",
            params: { defiId, defiNom },
          });
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: COLORS.background },
  topBar:        {
    flexDirection: "row", alignItems: "center",
    paddingTop: Platform.OS === "android" ? 44 : 58,
    paddingHorizontal: SIZES.padding, zIndex: 10,
  },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SIZES.padding, paddingTop: 24 },
  pageTitle:     {
    fontSize: 26, fontWeight: "800", color: COLORS.text,
    marginBottom: 4, fontFamily: "Georgia",
  },
  pageSubtitle:  { fontSize: 14, color: COLORS.textLight, lineHeight: 20, marginBottom: 24 },
  defiHighlight: { color: COLORS.primary, fontWeight: "700" },
  sectionLabel:  { fontSize: 15, fontWeight: "700", color: COLORS.text, marginBottom: 10 },
  listCard:      {
    backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg,
    paddingVertical: 6, paddingHorizontal: 14, ...SHADOWS.medium,
  },
  userRow:         {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, borderRadius: SIZES.radius, gap: 12,
  },
  userRowSelected: { backgroundColor: `${COLORS.primary}08` },
  avatarCircle:    {
    width: 46, height: 46, borderRadius: 23,
    alignItems: "center", justifyContent: "center",
  },
  avatarInitials:  { fontSize: 16, fontWeight: "800", color: "#fff" },
  userName:        { fontSize: 15, fontWeight: "700", color: COLORS.text },
  userEmail:       { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
  checkCircle:     {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    borderColor: COLORS.border, backgroundColor: COLORS.white,
    alignItems: "center", justifyContent: "center",
  },
  checkCircleSelected: {
    backgroundColor: COLORS.primary, borderColor: COLORS.primary,
    ...SHADOWS.purple,
  },
  separator:     { height: 1, backgroundColor: COLORS.border, marginHorizontal: 4, opacity: 0.6 },
  emptyText:     { textAlign: "center", padding: 24, color: COLORS.textLight },
  emailCard:     {
    backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg,
    padding: 14, ...SHADOWS.medium,
  },
  emailInputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  emailInputWrap:{
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 12,
    borderWidth: 1.5, borderColor: "rgba(180,160,220,0.35)",
    paddingHorizontal: 12, paddingVertical: 10, minHeight: 44,
  },
  emailInput:    { flex: 1, fontSize: 14, color: "#2A1060", fontWeight: "500", padding: 0 },
  addBtn:        {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
  chipsContainer:{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  chip:          {
    flexDirection: "row", alignItems: "center",
    backgroundColor: `${COLORS.primary}12`, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1.5, borderColor: `${COLORS.primary}30`,
  },
  chipText:      {
    fontSize: 12, fontWeight: "600", color: "#3D1F7A",
    flexShrink: 1, maxWidth: 160, marginRight: 5,
  },
  chipRemove:    {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center", justifyContent: "center", marginLeft: 4,
  },
  ctaBar:        {
    paddingHorizontal: SIZES.padding,
    zIndex: 20,
    paddingBottom: 125,
    paddingTop: 12,
    backgroundColor: COLORS.background,
  },
  ctaBtn:        {
    width: "100%", backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull, paddingVertical: 16,
    alignItems: "center", ...SHADOWS.purple,
  },
  ctaBtnDisabled:{ backgroundColor: COLORS.primaryLight, elevation: 0, shadowOpacity: 0 },
  ctaBtnText:    { color: COLORS.white, fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
});