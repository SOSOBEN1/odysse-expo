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

type EventType = "projet" | "examen" | "soutenance";

interface BossEvent {
  id: number;
  nom: string;
  type_boss: EventType;
}

const TABS = ["Tout", "Projet", "Examen", "Soutenance"] as const;
type Tab = typeof TABS[number];

const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  projet:     { icon: "💻", color: "#6c3fcb", bg: "#ede9fe" },
  examen:     { icon: "📝", color: "#e84393", bg: "#fff0f7" },
  soutenance: { icon: "🎓", color: "#5ab4e5", bg: "#eaf6ff" },
};

const getConfig = (type: string) =>
  typeConfig[type?.toLowerCase()] ?? { icon: "📌", color: "#6c3fcb", bg: "#ede9fe" };

export default function EventsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Tout");
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [events, setEvents] = useState<BossEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => { fetchEvents(); }, [])
  );

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("boss_events")
        .select("*")
        .order("id_boss", { ascending: false });

      if (error) throw error;
      setEvents(data ?? []);
    } catch (err: any) {
      console.error("Erreur fetch boss_events:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage par type (insensible à la casse)
  const filtered = events.filter(e => {
    if (activeTab === "Tout") return true;
    return e.type_boss?.toLowerCase() === activeTab.toLowerCase();
  });

  const handleDelete = (id: number) => {
    Alert.alert("Supprimer", "Supprimer cet événement ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("boss_events")
            .delete()
            .eq("id_boss", id);
          if (error) Alert.alert("Erreur", error.message);
          else setEvents(prev => prev.filter(e => e.id !== id));
        },
      },
    ]);
  };

  const handleEdit = (ev: BossEvent) => {
    setSelectedData({
      id_boss:   ev.id,
      nom:       ev.nom,
      type_boss: ev.type_boss,
    });
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <WaveBackground />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👩</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Bonjour, <Text style={styles.greetingName}>Sonia!</Text></Text>
            <Text style={styles.subGreeting}>{filtered.length} événement{filtered.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statRow}>
          {[
            { val: events.length, label: "Total", color: COLORS.primary },
            { val: events.filter(e => e.type_boss?.toLowerCase() === "examen").length, label: "Examens", color: "#e84393" },
            { val: events.filter(e => e.type_boss?.toLowerCase() === "projet").length, label: "Projets", color: "#6c3fcb" },
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
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length}</Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
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
          const cfg = getConfig(ev.type_boss);
          return (
            <View key={ev.id} style={styles.cardWrapper}>
              <View style={[styles.eventBadge, { backgroundColor: cfg.color }]}>
                <Text style={styles.eventBadgeText}>{ev.type_boss}</Text>
              </View>

              <TouchableOpacity
                style={[styles.card, { backgroundColor: cfg.bg }]}
                activeOpacity={0.88}
                onPress={() => router.push({
                  pathname: "/MissionMapScreen",
                  params: { eventId: ev.id, eventTitle: ev.nom },
                })}
              >
                <View style={styles.topRow}>
                  <View style={[styles.iconBox, { backgroundColor: cfg.color }]}>
                    <Text style={styles.iconText}>{cfg.icon}</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.eventTitle} numberOfLines={2}>{ev.nom}</Text>
                    <Text style={[styles.typePill, { color: cfg.color }]}>
                      {ev.type_boss?.charAt(0).toUpperCase() + ev.type_boss?.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={[styles.seeMissionsBtn, { backgroundColor: cfg.color }]}
                    onPress={() => router.push({
                      pathname: "/frontend/screens/missionEvent",
                      params: { eventId: ev.id, eventTitle: ev.nom },
                    })}
                  >
                    <Text style={styles.seeMissionsText}>Voir les missions →</Text>
                  </TouchableOpacity>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleEdit(ev)}
                    >
                      <Ionicons name="pencil-outline" size={16} color="#6c3fcb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleDelete(ev.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#e84393" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => { setSelectedData(null); setModalVisible(true); }}
        >
          <Text style={styles.createBtnText}>＋  Créer événement</Text>
        </TouchableOpacity>
      </ScrollView>

      <CreateEventModal
        visible={isModalVisible}
        onClose={() => { setModalVisible(false); setSelectedData(null); }}
        onCreate={() => { fetchEvents(); setModalVisible(false); setSelectedData(null); }}
        initialData={selectedData}
      />

      <Navbar active="events" onChange={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#f5f3ff" },
  scrollContent:    { paddingTop: 60, paddingHorizontal: SIZES.padding, paddingBottom: 120 },
  header:           { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  avatarCircle:     { width: 70, height: 70, borderRadius: 35, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", ...SHADOWS.medium },
  avatarEmoji:      { fontSize: 36 },
  greeting:         { fontSize: 22, color: "#2d1a5e" },
  greetingName:     { fontWeight: "800" },
  subGreeting:      { color: "#7a5bbf", fontWeight: "600", fontSize: 14, marginTop: 2 },
  statRow:          { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard:         { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 10, alignItems: "center", ...SHADOWS.light },
  statVal:          { fontSize: 20, fontWeight: "800" },
  statLabel:        { fontSize: 11, color: "#9b8bbf", fontWeight: "600", marginTop: 2 },
  sectionRow:       { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  sectionTitle:     { fontWeight: "800", fontSize: 20, color: "#2d1a5e" },
  countBadge:       { backgroundColor: "#6c3fcb", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 2 },
  countText:        { color: "#fff", fontWeight: "800", fontSize: 13 },
  tabsContainer:    { gap: 8, marginBottom: 24 },
  tab:              { borderRadius: 20, borderWidth: 2, borderColor: "#c0a8f0", paddingVertical: 7, paddingHorizontal: 14 },
  tabActive:        { backgroundColor: "#6c3fcb", borderWidth: 0 },
  tabText:          { color: "#6c3fcb", fontWeight: "700", fontSize: 13 },
  tabTextActive:    { color: "#fff" },
  empty:            { textAlign: "center", color: "#9b8bbf", marginTop: 40, fontSize: 15 },
  cardWrapper:      { marginBottom: 24 },
  eventBadge:       { alignSelf: "flex-start", borderRadius: 20, paddingVertical: 6, paddingHorizontal: 22, marginLeft: 14, marginBottom: -14, zIndex: 2, ...SHADOWS.light },
  eventBadgeText:   { color: "#fff", fontWeight: "700", fontSize: 12, textTransform: "capitalize" },
  card:             { borderRadius: 20, paddingTop: 24, paddingBottom: 14, paddingHorizontal: 16, ...SHADOWS.medium },
  topRow:           { flexDirection: "row", gap: 12, alignItems: "center" },
  iconBox:          { width: 58, height: 58, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  iconText:         { fontSize: 26 },
  infoBox:          { flex: 1 },
  eventTitle:       { fontWeight: "800", fontSize: 17, color: "#2d1a5e" },
  typePill:         { fontSize: 13, fontWeight: "600", marginTop: 4, textTransform: "capitalize" },
  cardFooter:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)" },
  seeMissionsBtn:   { borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14 },
  seeMissionsText:  { color: "#fff", fontWeight: "700", fontSize: 13 },
  cardActions:      { flexDirection: "row", gap: 10 },
  iconBtn:          { width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(120,90,180,0.08)", alignItems: "center", justifyContent: "center" },
  createBtn:        { backgroundColor: "#4b2fa0", borderRadius: 30, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  createBtnText:    { color: "#fff", fontWeight: "800", fontSize: 17 },
});
