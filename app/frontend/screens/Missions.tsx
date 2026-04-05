import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { COLORS, SIZES, SHADOWS } from "../styles/theme";
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";


// ─── Types ────────────────────────────────────────
type Difficulty = "Difficile" | "Moyen" | "Facile";


interface Mission {
  id: number;
  event: string | null;
  title: string;
  duration: string;
  description: string;
  difficulty: Difficulty;
  progress: number; // 0 to 1
  urgent: boolean;
  today: boolean;
}


// ─── Data ─────────────────────────────────────────
const MISSIONS: Mission[] = [
  {
    id: 1,
    event: "Soutenance PFE",
    title: "Réviser algorithme",
    duration: "1h30",
    description: "Reviser les deux premiers chapitres et la première série de TD",
    difficulty: "Difficile",
    progress: 0.55,
    urgent: true,
    today: true,
  },
  {
    id: 2,
    event: "Soutenance PFE",
    title: "Préparer slides",
    duration: "2h",
    description: "Créer les diapositives de présentation pour la soutenance",
    difficulty: "Moyen",
    progress: 0.72,
    urgent: false,
    today: true,
  },
  {
    id: 3,
    event: null,
    title: "Lire article",
    duration: "45min",
    description: "Lire l'article recommandé par le professeur",
    difficulty: "Facile",
    progress: 0.38,
    urgent: false,
    today: false,
  },
  {
    id: 4,
    event: "Examen Réseau",
    title: "Réviser protocoles",
    duration: "2h",
    description: "Revoir TCP/IP, UDP et les couches du modèle OSI",
    difficulty: "Difficile",
    progress: 0.2,
    urgent: true,
    today: true,
  },
  {
    id: 5,
    event: null,
    title: "Exercices maths",
    duration: "1h",
    description: "Compléter la série d'exercices d'intégration",
    difficulty: "Moyen",
    progress: 0.6,
    urgent: false,
    today: false,
  },
];


const TABS = ["Tout", "Urgent", "Aujourd'hui", "Par Événements"] as const;
type Tab = (typeof TABS)[number];


// ─── Difficulty Config ────────────────────────────
const difficultyConfig: Record<
  Difficulty,
  {
    label: string;
    badgeBg: string;
    eventBg: string;
    progressColor: string;
    iconBg: string;
    flame: string;
    cardBg: string;
    btnBg: string;
  }
> = {
  Difficile: {
    label: "🔥 Difficile",
    badgeBg: "#e84393",
    eventBg: "#6c3fcb",
    progressColor: "#e84393",
    iconBg: "#6c3fcb",
    flame: "🔥",
    cardBg: "rgba(255,255,255,0.93)",
    btnBg: "#6c3fcb",
  },
  Moyen: {
    label: "🔥 Moyen",
    badgeBg: "#f5a623",
    eventBg: "#f5a623",
    progressColor: "#f5a623",
    iconBg: "#f5a623",
    flame: "🔥",
    cardBg: "rgba(255,245,225,0.95)",
    btnBg: "#f5a623",
  },
  Facile: {
    label: "💧 Facile",
    badgeBg: "#5ab4e5",
    eventBg: "#7ab8d9",
    progressColor: "#5ab4e5",
    iconBg: "#5ab4e5",
    flame: "💧",
    cardBg: "rgba(235,245,255,0.93)",
    btnBg: "#7ab8d9",
  },
};


// ─── Filtering Logic ──────────────────────────────
function getFilteredMissions(tab: Tab): Mission[] {
  switch (tab) {
    case "Tout":
      // Toutes les missions (avec ET sans événement)
      return MISSIONS;
    case "Urgent":
      return MISSIONS.filter((m) => m.urgent);
    case "Aujourd'hui":
      return MISSIONS.filter((m) => m.today);
    case "Par Événements":
      // Uniquement les missions liées à un événement
      return MISSIONS.filter((m) => m.event !== null);
  }
}


// ─── Progress label ───────────────────────────────
function getProgressLabel(progress: number): string {
  const pct = Math.round(progress * 100);
  if (pct === 0) return "Non commencé";
  if (pct === 100) return "Terminé";
  return `${pct}%`;
}


// ─── MissionCard ──────────────────────────────────
function MissionCard({ mission }: { mission: Mission }) {
  const cfg = difficultyConfig[mission.difficulty];
  const pct = Math.round(mission.progress * 100);


  return (
    <View style={styles.cardWrapper}>
      {/* Event badge — toujours affiché si la mission a un événement */}
      {mission.event ? (
        <View style={[styles.eventBadge, { backgroundColor: cfg.eventBg }]}>
          <Text style={styles.eventBadgeText}>{mission.event}</Text>
        </View>
      ) : (
        // Spacer pour aligner les cartes sans événement
        <View style={styles.eventBadgeSpacer} />
      )}


      {/* Card body */}
      <View style={[styles.card, { backgroundColor: cfg.cardBg }]}>
        {/* Urgent indicator */}
        {mission.urgent && (
          <View style={styles.urgentBanner}>
            <Text style={styles.urgentText}>⚡ Urgent</Text>
          </View>
        )}


        {/* Top row: icon + info + difficulty badge */}
        <View style={styles.topRow}>
          <View style={[styles.iconBox, { backgroundColor: cfg.iconBg }]}>
            <Text style={styles.iconText}>{cfg.flame}</Text>
          </View>


          <View style={styles.infoBox}>
            <View style={styles.titleRow}>
              <Text style={styles.missionTitle} numberOfLines={1}>
                {mission.title}
              </Text>
              <View style={[styles.diffBadge, { backgroundColor: cfg.badgeBg }]}>
                <Text style={styles.diffBadgeText}>{cfg.label}</Text>
              </View>
            </View>
            <Text style={styles.duration}>⏱ {mission.duration}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {mission.description}
            </Text>
          </View>
        </View>


        {/* Progress + button */}
        <View style={styles.bottomRow}>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${pct}%` as any,
                    backgroundColor: cfg.progressColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: cfg.progressColor }]}>
              {getProgressLabel(mission.progress)}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: cfg.btnBg }]}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>CONTINUER</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}


// ─── Empty State ──────────────────────────────────
function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { emoji: string; text: string }> = {
    "Tout": { emoji: "📋", text: "Aucune mission pour l'instant" },
    "Urgent": { emoji: "⚡", text: "Aucune mission urgente" },
    "Aujourd'hui": { emoji: "📅", text: "Rien de prévu aujourd'hui" },
    "Par Événements": { emoji: "🎯", text: "Aucun événement avec missions" },
  };
  const { emoji, text } = messages[tab];
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}


// ─── Screen ───────────────────────────────────────
export default function MissionsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("Tout");


  const filteredMissions = getFilteredMissions(activeTab);


  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />


      {/* Purple wave background */}
      <WaveBackground />


      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👩</Text>
          </View>
          <View>
            <Text style={styles.greeting}>
              Bonjour, <Text style={styles.greetingName}>Sonia!</Text>
            </Text>
            <Text style={styles.subGreeting}>
              {filteredMissions.length} mission{filteredMissions.length !== 1 ? "s" : ""}{" "}
              {activeTab === "Aujourd'hui" ? "aujourd'hui" : ""}
            </Text>
          </View>
        </View>


        {/* Section title + count */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Missions</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredMissions.length}</Text>
          </View>
        </View>


        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            const count = getFilteredMissions(tab).length;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, isActive && styles.tabActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                    <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>


        {/* Mission cards or empty state */}
        {filteredMissions.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          filteredMissions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))
        )}


        {/* Create mission button */}
        <TouchableOpacity style={styles.createBtn} activeOpacity={0.85}>
          <Text style={styles.createBtnText}>＋  Créer mission</Text>
        </TouchableOpacity>
      </ScrollView>


      {/* Bottom nav */}
      <Navbar active="missions" onChange={() => {}} />
    </View>
  );
}


// ─── Styles ───────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f3ff",
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: SIZES.padding,
    paddingBottom: 120,
  },


  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
 
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.medium,
  },
  avatarEmoji: { fontSize: 36 },
  greeting: { fontSize: 24, color: "#2d1a5e" },
  greetingName: { fontWeight: "800", color: "#2d1a5e" },
  subGreeting: { color: "#7a5bbf", fontWeight: "600", fontSize: 14 },


  // Section row
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontWeight: "800",
    fontSize: 20,
    color: "#2d1a5e",
  },
  countBadge: {
    backgroundColor: "#6c3fcb",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  countText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },


  // Tabs
  tabsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    paddingRight: 8,
  },
  tab: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#c0a8f0",
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#6c3fcb",
    borderWidth: 0,
    ...SHADOWS.light,
  },
  tabText: {
    color: "#6c3fcb",
    fontWeight: "700",
    fontSize: 13,
  },
  tabTextActive: {
    color: "#fff",
  },
  tabCount: {
    backgroundColor: "#ede0ff",
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: "center",
  },
  tabCountActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  tabCountText: {
    color: "#6c3fcb",
    fontSize: 11,
    fontWeight: "700",
  },
  tabCountTextActive: {
    color: "#fff",
  },


  // Card wrapper
  cardWrapper: {
    marginBottom: 24,
  },


  // Event badge
  eventBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 22,
    marginLeft: 14,
    marginBottom: -14,
    zIndex: 2,
    ...SHADOWS.light,
  },
  eventBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  // Spacer when no event badge (keeps card alignment consistent)
  eventBadgeSpacer: {
    height: 0,
  },


  // Urgent banner
  urgentBanner: {
    backgroundColor: "#fff0f7",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  urgentText: {
    color: "#e84393",
    fontWeight: "700",
    fontSize: 12,
  },


  // Card body
  card: {
    borderRadius: 20,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    zIndex: 1,
    ...SHADOWS.medium,
  },


  // Top row inside card
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.light,
  },
  iconText: { fontSize: 26 },


  infoBox: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    flexWrap: "wrap",
  },
  missionTitle: {
    fontWeight: "800",
    fontSize: 17,
    color: "#2d1a5e",
    flexShrink: 1,
  },
  diffBadge: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  diffBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  duration: {
    color: "#9b8bbf",
    fontWeight: "600",
    fontSize: 13,
    marginTop: 3,
  },
  description: {
    color: "#5a5080",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },


  // Progress + button
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },
  progressContainer: {
    flex: 1,
    gap: 4,
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: "rgba(180,160,220,0.25)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  continueBtn: {
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 18,
    ...SHADOWS.light,
  },
  continueBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.4,
  },


  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    color: "#9b8bbf",
    fontWeight: "600",
    fontSize: 15,
  },


  // Create mission CTA
  createBtn: {
    backgroundColor: "#4b2fa0",
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
    ...SHADOWS.medium,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.3,
  },
});



