// screens/DefisStat.tsx
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";
import { supabase } from "../constants/supabase";
import { COLORS, SHADOWS, SIZES } from "../constants/theme";
const { width, height } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCard {
  id: number;
  key: string;        // clé dans statistique_cible (type)
  label: string;
  description: string;
  color: string;
  iconType: "energy" | "stress" | "knowledge" | "organisation";
  // Impact sur les stats quand une mission est faite dans ce défi
  bonus_description: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS: StatCard[] = [
  {
    id: 1,
    key: "energie",
    label: "Énergie",
    description: "Augmente ton énergie et ta motivation au quotidien",
    color: "#FFF3C4",
    iconType: "energy",
    bonus_description: "+50% bonus énergie sur chaque mission",
  },
  {
    id: 2,
    key: "stress",
    label: "Stress",
    description: "Diminue ton stress et retrouve apaisement et sérénité",
    color: "#FFD6D6",
    iconType: "stress",
    bonus_description: "−50% stress supplémentaire sur chaque mission",
  },
  {
    id: 3,
    key: "connaissance",
    label: "Connaissance",
    description: "Acquiers de nouvelles compétences et connaissances",
    color: "#D6F0FF",
    iconType: "knowledge",
    bonus_description: "+50% bonus connaissance sur chaque mission",
  },
  {
    id: 4,
    key: "organisation",
    label: "Organisation",
    description: "Améliore ta planification et la gestion du quotidien",
    color: "#D6FFE4",
    iconType: "organisation",
    bonus_description: "+50% bonus organisation sur chaque mission",
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
const StatIcon = ({ type, size = 20 }: { type: StatCard["iconType"]; size?: number }) => {
  switch (type) {
    case "energy":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z"
            fill="#F5A623" stroke="#F5A623" strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round"
          />
        </Svg>
      );
    case "stress":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#E57373" />
          <Path d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="#fff" />
        </Svg>
      );
    case "knowledge":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2L2 7l10 5 10-5-10-5z" fill="#5B8DEF" stroke="#5B8DEF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#5B8DEF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "organisation":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="18" rx="3" stroke="#4CAF50" strokeWidth={1.8} fill="none" />
          <Path d="M16 2v4M8 2v4M3 10h18" stroke="#4CAF50" strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M8 14h4M8 18h8" stroke="#4CAF50" strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
      );
  }
};

const CheckBadge = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  return (
    <View style={styles.checkBadge}>
      <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
        <Path d="M3 7L6 10L11 4" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
};

const BgSparkles = () => (
  <Svg width={width} height={height} style={StyleSheet.absoluteFillObject} pointerEvents="none">
    <Path d="M28 90 H40 M34 84 V96" stroke="#c4aaff" strokeWidth={2} strokeLinecap="round" opacity={0.5} />
    <Circle cx={width - 20} cy={190} r={3} fill="#d4bbff" opacity={0.5} />
    <Circle cx={20} cy={280} r={2.5} fill="#d4bbff" opacity={0.4} />
    <Circle cx={45} cy={440} r={3} fill="#d4bbff" opacity={0.35} />
  </Svg>
);

// ─── Stat Card Item ───────────────────────────────────────────────────────────
const StatCardItem = ({
  stat, selected, onToggle, delay,
}: {
  stat: StatCard; selected: boolean; onToggle: () => void; delay: number;
}) => {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay, useNativeDriver: true, tension: 60, friction: 9 }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 200, friction: 10 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 10 }),
    ]).start();
    onToggle();
  };

  return (
    <Animated.View style={[styles.cardWrapper, {
      opacity: anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
        { scale },
      ],
    }]}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: stat.color }, selected && styles.cardSelected]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconRow}>
            <StatIcon type={stat.iconType} size={20} />
            <Text style={styles.cardLabel}>{stat.label}</Text>
          </View>
          <CheckBadge visible={selected} />
        </View>

        <Text style={styles.cardDescription}>{stat.description}</Text>

        {/* Bonus affiché quand sélectionné */}
        {selected && (
          <View style={styles.bonusBadge}>
            <Text style={styles.bonusText}>✨ {stat.bonus_description}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.chooseBtn, selected && styles.chooseBtnSelected]}
          onPress={handlePress}
          activeOpacity={0.85}
        >
          <Text style={[styles.chooseBtnText, selected && styles.chooseBtnTextSelected]}>
            {selected ? "Sélectionné ✓" : "Choisir >"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── DefisStat Screen ─────────────────────────────────────────────────────────
export default function DefisStatScreen() {
  const router     = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [saving,   setSaving]   = useState(false);
  const titleAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(titleAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }).start();
  }, []);

  const toggle = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const canContinue = selected.length > 0 && !saving;

  // ── Sauvegarder les stats choisies dans statistique_cible ──────────────────
  // On ne crée pas encore le défi ici — on passe juste les clés à la page suivante
  // via les params de navigation. Le défi sera créé dans createDefis.tsx
  // et les stats_cibles seront insérées dans defis_statistique_cible après.
  const handleContinue = async () => {
    if (!canContinue) return;
    setSaving(true);

    try {
      // Récupérer ou créer les entrées dans statistique_cible
      const selectedStats = STATS.filter(s => selected.includes(s.id));
      const statKeys      = selectedStats.map(s => s.key);

      // Vérifier si les types existent déjà dans statistique_cible
      const { data: existing } = await supabase
        .from('statistique_cible')
        .select('id_stat_cible, type')
        .in('type', statKeys);

      const existingTypes  = (existing ?? []).map((e: any) => e.type);
      const missingTypes   = statKeys.filter(k => !existingTypes.includes(k));

      // Insérer les types manquants
      if (missingTypes.length > 0) {
        await supabase
          .from('statistique_cible')
          .insert(missingTypes.map(type => ({ type })));
      }

      // Récupérer tous les id_stat_cible pour les clés choisies
      const { data: allStats } = await supabase
        .from('statistique_cible')
        .select('id_stat_cible, type')
        .in('type', statKeys);

      const statIds = (allStats ?? []).map((s: any) => s.id_stat_cible);

      // Naviguer vers la page de création du défi avec les stat IDs
      router.push({
        pathname: "/frontend/screens/createDefis",
        params: {
          statCibleIds:  JSON.stringify(statIds),
          statCibleKeys: JSON.stringify(statKeys),
        },
      });
    } catch (e: any) {
      Alert.alert("Erreur", e.message ?? "Impossible de continuer.");
    } finally {
      setSaving(false);
    }
  };

  const rows: [StatCard, StatCard | null][] = [];
  for (let i = 0; i < STATS.length; i += 2) {
    rows.push([STATS[i], STATS[i + 1] ?? null]);
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <BgSparkles />

      <View style={styles.topBar}>
        <BackButton onPress={() => router.back()} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{
          opacity: titleAnim,
          transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        }}>
          <Text style={styles.pageTitle}>
            Choisis les statistiques{"\n"}que tu veux améliorer{"\n"}avec ce défi :
          </Text>
          <Text style={styles.pageSubtitle}>
            Les missions de ce défi donneront un{" "}
            <Text style={{ fontWeight: "800", color: COLORS.primary }}>bonus ×1.5</Text>
            {" "}sur les stats choisies.
          </Text>
        </Animated.View>

        <View style={styles.grid}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map((stat, colIdx) =>
                stat ? (
                  <StatCardItem
                    key={stat.id}
                    stat={stat}
                    selected={selected.includes(stat.id)}
                    onToggle={() => toggle(stat.id)}
                    delay={(rowIdx * 2 + colIdx) * 80}
                  />
                ) : (
                  <View key="empty" style={styles.cardWrapper} />
                )
              )}
            </View>
          ))}
        </View>

        {/* Résumé des stats choisies */}
        {selected.length > 0 && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Récapitulatif</Text>
            {STATS.filter(s => selected.includes(s.id)).map(s => (
              <View key={s.id} style={styles.summaryRow}>
                <StatIcon type={s.iconType} size={14} />
                <Text style={styles.summaryText}>{s.label} — {s.bonus_description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ✅ Bouton ICI dans le scroll */}
        <TouchableOpacity
          style={[styles.ctaBtn, !canContinue && styles.ctaBtnDisabled]}
          activeOpacity={canContinue ? 0.85 : 1}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.ctaBtnText}>
                {selected.length > 0
                  ? `Poursuivre avec ${selected.length} stat${selected.length > 1 ? "s" : ""}`
                  : "Choisis au moins une stat"}
              </Text>
          }
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Navbar active="defis" onChange={() => {}} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: COLORS.background },
  topBar:        {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 44 : 58,
    paddingHorizontal: SIZES.padding, zIndex: 10,
  },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: SIZES.padding, paddingTop: 22, paddingBottom: 120 },
  pageTitle:     {
    fontSize: 22, fontWeight: "800", color: COLORS.text,
    lineHeight: 30, marginBottom: 8, fontFamily: "Georgia",
  },
  pageSubtitle:  { fontSize: 13, color: COLORS.textLight, lineHeight: 20, marginBottom: 24 },

  grid:    { gap: 12 },
  gridRow: { flexDirection: "row", gap: 12 },

  cardWrapper: { flex: 1 },
  card: {
    flex: 1, borderRadius: SIZES.radius, padding: 14,
    minHeight: 165, justifyContent: "space-between",
    ...SHADOWS.medium, borderWidth: 2, borderColor: "transparent",
  },
  cardSelected:  { borderColor: COLORS.primary, borderWidth: 2 },
  cardHeader:    { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 },
  cardIconRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
  cardLabel:     { fontSize: 14, fontWeight: "800", color: "#222" },
  cardDescription: { fontSize: 12, color: "#444", lineHeight: 16, flex: 1, marginBottom: 8 },

  bonusBadge: {
    backgroundColor: `${COLORS.primary}15`, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8,
    borderWidth: 1, borderColor: `${COLORS.primary}30`,
  },
  bonusText:  { fontSize: 10, fontWeight: "700", color: COLORS.primary, lineHeight: 14 },

  chooseBtn: {
    alignSelf: "flex-start", backgroundColor: COLORS.white,
    borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, ...SHADOWS.light,
  },
  chooseBtnSelected:     { backgroundColor: COLORS.primary },
  chooseBtnText:         { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  chooseBtnTextSelected: { color: COLORS.white },

  checkBadge: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },

  // Résumé
  summaryBox: {
    backgroundColor: `${COLORS.primary}08`, borderRadius: SIZES.radius,
    padding: 14, marginTop: 16, borderWidth: 1, borderColor: `${COLORS.primary}20`,
  },
  summaryTitle:  { fontSize: 13, fontWeight: "800", color: COLORS.primary, marginBottom: 10 },
  summaryRow:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  summaryText:   { fontSize: 12, color: COLORS.text, fontWeight: "600", flex: 1 },

  ctaBar: {
    paddingHorizontal: SIZES.padding, paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  ctaBtn: {
  width: "100%", backgroundColor: COLORS.primary,
  borderRadius: SIZES.radiusFull, paddingVertical: 16,
  alignItems: "center", ...SHADOWS.purple,
  marginTop: 16,
},
  ctaBtnDisabled: { backgroundColor: COLORS.primaryLight, elevation: 0, shadowOpacity: 0 },
  ctaBtnText:     { color: COLORS.white, fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },
});