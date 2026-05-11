import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  ScrollView, StatusBar, StyleSheet, Text,
  TextInput, TouchableOpacity, View, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import Navbar from "../components/Navbar";
import WaveBackground from "../components/waveBackground";
import { COLORS, SHADOWS, SIZES } from "../styles/theme";
import CreateEventModal from "../components/CreateEventModal";
import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";
import { useAvatar } from "../constants/AvatarContext";

type EventType = "projet" | "examen" | "soutenance";

interface BossEvent {
  id_boss: number;
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
  const [activeTab, setActiveTab]       = useState<Tab>("Tout");
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [events, setEvents]             = useState<BossEvent[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchQuery, setSearchQuery]   = useState("");
  const [displayName, setDisplayName]   = useState<string>("...");

  const { userId, username: ctxUsername } = useUser();
  const { selectedModel, setSelectedModel } = useAvatar();

  // ── Fetch user profile (nom + avatar) ──
  useEffect(() => {
    if (!userId) return;
    const fetchUserProfile = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("username, prenom, nom, avatar_url")
        .eq("id_user", userId)
        .single();

      if (error || !data) return;

      const name = data.username ?? data.prenom ?? data.nom ?? ctxUsername ?? "Joueur";
      setDisplayName(name);
      if (data.avatar_url) setSelectedModel(data.avatar_url);
    };
    fetchUserProfile();
  }, [userId, ctxUsername]);

  // ── Fetch events ──
  useEffect(() => {
    if (userId) fetchEvents();
  }, [userId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      if (!userId) return;

      const { data, error } = await supabase
        .from("boss_events")
        .select("id_boss, nom, type_boss")
        .eq("id_creator", userId)
        .order("id_boss", { ascending: false });

      if (error) throw error;
      setEvents(data ?? []);
    } catch (err: any) {
      console.error("Erreur fetch boss_events:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtrage tab + recherche ──
  const filtered = events
    .filter(e => {
      if (activeTab === "Tout") return true;
      return e.type_boss?.toLowerCase() === activeTab.toLowerCase();
    })
    .filter(e => {
      if (!searchQuery.trim()) return true;
      return e.nom?.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const handleDelete = (id_boss: number) => {
    Alert.alert("Supprimer", "Supprimer cet événement ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("boss_events")
            .delete()
            .eq("id_boss", id_boss);
          if (error) Alert.alert("Erreur", error.message);
          else setEvents(prev => prev.filter(e => e.id_boss !== id_boss));
        },
      },
    ]);
  };

  const handleEdit = (ev: BossEvent) => {
    setSelectedData({ id_boss: ev.id_boss, nom: ev.nom, type_boss: ev.type_boss });
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <WaveBackground />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Section title (même style que MissionsScreen) ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Événements</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length}</Text>
          </View>
        </View>

        {/* ── Barre de recherche ── */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un événement..."
            placeholderTextColor="#9b8bbf"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Stats ── */}
        <View style={styles.statRow}>
          {[
            { val: events.length, label: "Total", color: COLORS.primary },
            { val: events.filter(e => e.type_boss?.toLowerCase() === "examen").length,    label: "Examens", color: "#e84393" },
            { val: events.filter(e => e.type_boss?.toLowerCase() === "projet").length,    label: "Projets",  color: "#6c3fcb" },
            { val: events.filter(e => e.type_boss?.toLowerCase() === "soutenance").length, label: "Souten.", color: "#5ab4e5" },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Tabs ── */}
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

        {/* ── Cards ── */}
        {loading ? (
          <Text style={styles.empty}>Chargement...</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Aucun événement trouvé</Text>
        ) : filtered.map(ev => {
          const cfg = getConfig(ev.type_boss);
          return (
            <View key={ev.id_boss} style={styles.cardWrapper}>
              <View style={[styles.eventBadge, { backgroundColor: cfg.color }]}>
                <Text style={styles.eventBadgeText}>{ev.type_boss}</Text>
              </View>

              <TouchableOpacity
                style={[styles.card, { backgroundColor: cfg.bg }]}
                activeOpacity={0.88}
                onPress={() => router.push({
                  pathname: "/frontend/screens/missionEvent",
                  params: { eventId: String(ev.id_boss), eventTitle: ev.nom },
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
                      params: { eventId: String(ev.id_boss), eventTitle: ev.nom },
                    })}
                  >
                    <Text style={styles.seeMissionsText}>Voir les missions →</Text>
                  </TouchableOpacity>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleEdit(ev)}>
                      <Ionicons name="pencil-outline" size={16} color="#6c3fcb" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleDelete(ev.id_boss)}>
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
  container:      { flex: 1, backgroundColor: "#f5f3ff" },
  scrollContent:  { paddingTop: 60, paddingHorizontal: SIZES.padding, paddingBottom: 120 },

  // ── Section title ──
  sectionRow:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  sectionTitle:   { fontWeight: "800", fontSize: 20, color: "#2d1a5e" },
  countBadge:     { backgroundColor: "#6c3fcb", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 2 },
  countText:      { color: "#fff", fontWeight: "800", fontSize: 13 },

  // ── Search bar ──
  searchWrapper:  { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16, ...SHADOWS.light },
  searchIcon:     { fontSize: 16, marginRight: 8 },
  searchInput:    { flex: 1, fontSize: 14, color: "#2d1a5e", padding: 0 },
  searchClear:    { fontSize: 13, color: "#9b8bbf", fontWeight: "700", marginLeft: 8 },

  // ── Stats ──
  statRow:        { flexDirection: "row", gap: 8, marginBottom: 20 },
  statCard:       { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 10, alignItems: "center", ...SHADOWS.light },
  statVal:        { fontSize: 18, fontWeight: "800" },
  statLabel:      { fontSize: 10, color: "#9b8bbf", fontWeight: "600", marginTop: 2 },

  // ── Tabs ──
  tabsContainer:  { gap: 8, marginBottom: 24 },
  tab:            { borderRadius: 20, borderWidth: 2, borderColor: "#c0a8f0", paddingVertical: 7, paddingHorizontal: 14 },
  tabActive:      { backgroundColor: "#6c3fcb", borderWidth: 0 },
  tabText:        { color: "#6c3fcb", fontWeight: "700", fontSize: 13 },
  tabTextActive:  { color: "#fff" },

  // ── Empty ──
  empty:          { textAlign: "center", color: "#9b8bbf", marginTop: 40, fontSize: 15 },

  // ── Cards ──
  cardWrapper:    { marginBottom: 24 },
  eventBadge:     { alignSelf: "flex-start", borderRadius: 20, paddingVertical: 6, paddingHorizontal: 22, marginLeft: 14, marginBottom: -14, zIndex: 2, ...SHADOWS.light },
  eventBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12, textTransform: "capitalize" },
  card:           { borderRadius: 20, paddingTop: 24, paddingBottom: 14, paddingHorizontal: 16, ...SHADOWS.medium },
  topRow:         { flexDirection: "row", gap: 12, alignItems: "center" },
  iconBox:        { width: 58, height: 58, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  iconText:       { fontSize: 26 },
  infoBox:        { flex: 1 },
  eventTitle:     { fontWeight: "800", fontSize: 17, color: "#2d1a5e" },
  typePill:       { fontSize: 13, fontWeight: "600", marginTop: 4, textTransform: "capitalize" },
  cardFooter:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)" },
  seeMissionsBtn: { borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14 },
  seeMissionsText:{ color: "#fff", fontWeight: "700", fontSize: 13 },
  cardActions:    { flexDirection: "row", gap: 10 },
  iconBtn:        { width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(120,90,180,0.08)", alignItems: "center", justifyContent: "center" },

  // ── Create button ──
  createBtn:      { backgroundColor: "#4b2fa0", borderRadius: 30, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  createBtnText:  { color: "#fff", fontWeight: "800", fontSize: 17 },
});