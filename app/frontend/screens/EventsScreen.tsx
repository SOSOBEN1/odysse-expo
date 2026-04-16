import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import {
  ScrollView, StatusBar, StyleSheet, Text,
  TouchableOpacity, View, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";
import CreateEventModal from "../components/CreateEventModal";
import { supabase } from "../constants/supabase";
import { useFocusEffect } from "@react-navigation/native";

type EventType = "Projet" | "Examen" | "Soutenance";
type Difficulty = "Difficile" | "Moyen" | "Facile";

interface Event {
  id: number;
  type: EventType;
  title: string;
  date: string;
  time: string;
  duration: string;
  description: string;
  difficulty: Difficulty;
  progress: number;
  urgent: boolean;
  today: boolean;
}

const TABS = ["Tout", "Projet", "Examen", "Soutenance", "Urgent"] as const;
type Tab = typeof TABS[number];

const difficultyConfig: Record<Difficulty, any> = {
  Difficile: { label: "🔥 Difficile", badgeBg: "#e84393", eventBg: "#6c3fcb", progressColor: "#e84393", iconBg: "#6c3fcb", cardBg: "rgba(255,255,255,0.93)", btnBg: "#6c3fcb", progColor: "#e84393" },
  Moyen:     { label: "🔥 Moyen",     badgeBg: "#f5a623", eventBg: "#f5a623", progressColor: "#f5a623", iconBg: "#f5a623", cardBg: "rgba(255,245,225,0.95)", btnBg: "#f5a623", progColor: "#f5a623" },
  Facile:    { label: "💧 Facile",    badgeBg: "#5ab4e5", eventBg: "#7ab8d9", progressColor: "#5ab4e5", iconBg: "#5ab4e5", cardBg: "rgba(235,245,255,0.93)", btnBg: "#7ab8d9", progColor: "#5ab4e5" },
};

const typeIcon: Record<EventType, string> = {
  Projet: "💻", Examen: "📝", Soutenance: "🎓",
};

const mapDifficulty = (d: number): Difficulty => {
  if (d === 3) return "Difficile";
  if (d === 2) return "Moyen";
  return "Facile";
};

export default function EventsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Tout");
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedData, setSelectedData] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => { fetchEvents(); }, [])
  );

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("evenement")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;

      const mapped: Event[] = (data ?? []).map((e: any) => ({
        id: e.id,
        type: e.type ?? "Projet",
        title: e.titre ?? "Sans titre",
        date: e.date ? new Date(e.date).toLocaleDateString("fr-FR") : "-",
        time: e.heure ?? "-",
        duration: e.duree_min
          ? `${Math.floor(e.duree_min / 60)}h${String(e.duree_min % 60).padStart(2, "0")}`
          : "-",
        description: e.description ?? "",
        difficulty: mapDifficulty(e.difficulte ?? 1),
        progress: e.progress ?? 0,
        urgent: (e.priorite ?? 1) >= 4,
        today: e.date
          ? new Date(e.date).toDateString() === new Date().toDateString()
          : false,
      }));

      setEvents(mapped);
    } catch (err: any) {
      console.error("Erreur fetch événements:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = events.filter(e => {
    if (activeTab === "Urgent") return e.urgent;
    if (activeTab === "Tout") return true;
    return e.type === activeTab;
  });

  const handleDelete = (id: number) => {
    Alert.alert("Supprimer", "Supprimer cet événement ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("evenement").delete().eq("id", id);
          if (error) Alert.alert("Erreur", error.message);
          else setEvents(prev => prev.filter(e => e.id !== id));
        },
      },
    ]);
  };

  const handleEdit = (ev: Event) => {
    setSelectedData(ev);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <WaveBackground />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}><Text style={styles.avatarEmoji}>👩</Text></View>
          <View>
            <Text style={styles.greeting}>Bonjour, <Text style={styles.greetingName}>Sonia!</Text></Text>
            <Text style={styles.subGreeting}>{filtered.length} événement{filtered.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statRow}>
          {[
            { val: events.length, label: "Total", color: COLORS.primary },
            { val: events.filter(e => e.urgent).length, label: "Urgent", color: "#e84393" },
            { val: events.filter(e => e.today).length, label: "Aujourd'hui", color: "#5ab4e5" },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Section title */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Événements</Text>
          <View style={styles.countBadge}><Text style={styles.countText}>{filtered.length}</Text></View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Cards */}
        {loading ? (
          <Text style={styles.empty}>Chargement...</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Aucun événement trouvé</Text>
        ) : filtered.map(ev => {
          const cfg = difficultyConfig[ev.difficulty];
          const pct = Math.round(ev.progress * 100);
          const btnLabel = pct === 0 ? "DÉMARRER" : pct === 100 ? "TERMINÉ" : "CONTINUER";
          return (
            <View key={ev.id} style={styles.cardWrapper}>
              <View style={[styles.eventBadge, { backgroundColor: cfg.eventBg }]}>
                <Text style={styles.eventBadgeText}>{ev.type}</Text>
              </View>

              <TouchableOpacity
                style={[styles.card, { backgroundColor: cfg.cardBg }]}
                activeOpacity={0.88}
                onPress={() => router.push({
                  pathname: "/MissionMapScreen",
                  params: { eventId: ev.id, eventTitle: ev.title },
                })}
              >
                {ev.urgent && (
                  <View style={styles.urgentBanner}><Text style={styles.urgentText}>⚡ Urgent</Text></View>
                )}
                <View style={styles.topRow}>
                  <View style={[styles.iconBox, { backgroundColor: cfg.iconBg }]}>
                    <Text style={styles.iconText}>{typeIcon[ev.type]}</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <View style={styles.titleRow}>
                      <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                      <View style={[styles.diffBadge, { backgroundColor: cfg.badgeBg }]}>
                        <Text style={styles.diffBadgeText}>{cfg.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.meta}>📅 {ev.date}  ⏰ {ev.time}  ⏱ {ev.duration}</Text>
                    <Text style={styles.desc} numberOfLines={2}>{ev.description}</Text>
                  </View>
                </View>

                <View style={styles.bottomRow}>
                  <View style={styles.progressWrap}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: cfg.progressColor }]} />
                    </View>
                    <Text style={[styles.progressLabel, { color: cfg.progressColor }]}>
                      {pct === 100 ? "Terminé" : pct === 0 ? "Non commencé" : `${pct}%`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: cfg.btnBg }]}
                    onPress={() => router.push({
                      pathname: "/MissionMapScreen",
                      params: { eventId: ev.id, eventTitle: ev.title },
                    })}
                  >
                    <Text style={styles.actionBtnText}>{btnLabel}</Text>
                  </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <Text style={[styles.seeMissions, { color: cfg.progColor }]}>
                    Voir les missions →
                  </Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={(e) => { e.stopPropagation(); handleEdit(ev); }}
                    >
                      <Ionicons name="pencil-outline" size={16} color="#6c3fcb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={(e) => { e.stopPropagation(); handleDelete(ev.id); }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#e84393" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity style={styles.createBtn} onPress={() => { setSelectedData(null); setModalVisible(true); }}>
          <Text style={styles.createBtnText}>＋  Créer événement</Text>
        </TouchableOpacity>
      </ScrollView>

      <CreateEventModal
        visible={isModalVisible}
        onClose={() => { setModalVisible(false); setSelectedData(null); }}
        onCreate={() => { fetchEvents(); setSelectedData(null); }}
        initialData={selectedData}
      />

      <Navbar active="events" onChange={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f3ff" },
  scrollContent: { paddingTop: 60, paddingHorizontal: SIZES.padding, paddingBottom: 120 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  avatarCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", ...SHADOWS.medium },
  avatarEmoji: { fontSize: 36 },
  greeting: { fontSize: 22, color: "#2d1a5e" },
  greetingName: { fontWeight: "800" },
  subGreeting: { color: "#7a5bbf", fontWeight: "600", fontSize: 14, marginTop: 2 },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 10, alignItems: "center", ...SHADOWS.light },
  statVal: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#9b8bbf", fontWeight: "600", marginTop: 2 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  sectionTitle: { fontWeight: "800", fontSize: 20, color: "#2d1a5e" },
  countBadge: { backgroundColor: "#6c3fcb", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 2 },
  countText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  tabsContainer: { gap: 8, marginBottom: 24 },
  tab: { borderRadius: 20, borderWidth: 2, borderColor: "#c0a8f0", paddingVertical: 7, paddingHorizontal: 14 },
  tabActive: { backgroundColor: "#6c3fcb", borderWidth: 0 },
  tabText: { color: "#6c3fcb", fontWeight: "700", fontSize: 13 },
  tabTextActive: { color: "#fff" },
  empty: { textAlign: "center", color: "#9b8bbf", marginTop: 40, fontSize: 15 },
  cardWrapper: { marginBottom: 24 },
  eventBadge: { alignSelf: "flex-start", borderRadius: 20, paddingVertical: 6, paddingHorizontal: 22, marginLeft: 14, marginBottom: -14, zIndex: 2, ...SHADOWS.light },
  eventBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  card: { borderRadius: 20, paddingTop: 24, paddingBottom: 12, paddingHorizontal: 16, ...SHADOWS.medium },
  urgentBanner: { backgroundColor: "#fff0f7", borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: "flex-start", marginBottom: 10 },
  urgentText: { color: "#e84393", fontWeight: "700", fontSize: 12 },
  topRow: { flexDirection: "row", gap: 12 },
  iconBox: { width: 58, height: 58, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  iconText: { fontSize: 26 },
  infoBox: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 },
  eventTitle: { fontWeight: "800", fontSize: 16, color: "#2d1a5e", flex: 1 },
  diffBadge: { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  diffBadgeText: { color: "#fff", fontWeight: "700", fontSize: 11 },
  meta: { color: "#9b8bbf", marginTop: 3, fontSize: 12 },
  desc: { color: "#5a5080", fontSize: 13, marginTop: 4 },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  progressWrap: { flex: 1 },
  progressTrack: { height: 8, borderRadius: 8, backgroundColor: "rgba(180,160,220,0.25)" },
  progressFill: { height: "100%", borderRadius: 8 },
  progressLabel: { fontSize: 11, fontWeight: "700", marginTop: 4 },
  actionBtn: { borderRadius: 14, paddingVertical: 9, paddingHorizontal: 16 },
  actionBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.04)" },
  seeMissions: { fontSize: 13, fontWeight: "700" },
  cardActions: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(120,90,180,0.05)", alignItems: "center", justifyContent: "center" },
  createBtn: { backgroundColor: "#4b2fa0", borderRadius: 30, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  createBtnText: { color: "#fff", fontWeight: "800", fontSize: 17 },
});
