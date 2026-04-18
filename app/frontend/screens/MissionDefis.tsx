import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { COLORS, SIZES, SHADOWS } from "../constants/theme";
import Navbar from "../components/Navbar";
import BackButton from "../components/BackButton";

// ─── Types ───────────────────────────────────────────────────────────────────
type FilterType = "tout" | "en attente" | "terminé";

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const INITIAL_TASKS: Task[] = [
  { id: 1, title: "Réviser algorithme", completed: true },
  { id: 2, title: "reposer qjdkfuq", completed: true },
  { id: 3, title: "faire du sport", completed: true },
  { id: 4, title: "Réviser BDD", completed: false },
  { id: 5, title: "Réviser algorithme", completed: false },
];

const FILTERS: FilterType[] = ["tout", "en attente", "terminé"];

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

// ─── Component ───────────────────────────────────────────────────────────────
export default function MissionsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("tout");
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeNav, setActiveNav] = useState("missions");
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = completedCount / tasks.length;

  // Filtrage : filtre par onglet ET par recherche
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchFilter =
        filter === "tout"
          ? true
          : filter === "terminé"
          ? t.completed
          : !t.completed;

      const matchSearch =
  search.trim() === ""
    ? true
    : normalizeText(t.title).includes(normalizeText(search));

      return matchFilter && matchSearch;
    });
  }, [tasks, filter, search]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setSearch("");
  };



  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#D8CCFF", "#E8DFFA", "#EDE8FB"]}
        style={styles.gradient}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          {/* Gauche : BackButton + titre */}
          <View style={styles.headerLeft}>
            <BackButton />
            <Text style={styles.headerTitle}>Missions</Text>
          </View>

          {/* Droite : recherche + notif */}
          <View style={styles.headerRight}>
            {showSearch ? (
              <>
                <TextInput
                  placeholder="Rechercher..."
                  placeholderTextColor={COLORS.textLight}
                  value={search}
                  onChangeText={setSearch}
                  style={styles.searchInput}
                  autoFocus
                  returnKeyType="search"
                />
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={handleCloseSearch}
                >
                  <Ionicons name="close" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setShowSearch(true)}
                >
                  <Ionicons
                    name="search-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>1</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Mission Card ── */}
          <View style={[styles.missionCard, SHADOWS.medium]}>
            <Text style={styles.sparkleTopLeft}>✦</Text>
            <Text style={styles.sparkleTopRight}>✦</Text>

            <Text style={styles.missionTitle}>Marathon d'étude 2 heures</Text>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>En cours</Text>
            </View>

            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={["#6949A8", "#9574E0", "#c793e0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(progress * 100)}%` as any },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          </View>

          {/* ── Filter Tabs ── */}
          <View style={styles.filterRow}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, filter === f && styles.filterActive]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === f && styles.filterTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Task List ── */}
          <View style={styles.taskList}>
            {filteredTasks.length === 0 ? (
              <Text style={styles.emptyText}>Aucune mission trouvée</Text>
            ) : (
              filteredTasks.map((task, index) => {
                const isCompleted = task.completed;
                return (
                  <View key={task.id}>
                    <TouchableOpacity
                      onPress={() => toggleTask(task.id)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={
                          isCompleted
                            ? ["#E8FFF0", "#D4F5E9", "#EAF9FF"]
                            : ["#FFFFFF", "#F3EFFE"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.taskCard, SHADOWS.light]}
                      >
                        <View
                          style={[
                            styles.numCircle,
                            isCompleted
                              ? styles.numCircleDone
                              : styles.numCirclePending,
                          ]}
                        >
                          <Text
                            style={[
                              styles.numText,
                              isCompleted
                                ? styles.numTextDone
                                : styles.numTextPending,
                            ]}
                          >
                            {task.id}
                          </Text>
                        </View>

                        <Text
                          style={[
                            styles.taskTitle,
                            isCompleted && styles.taskTitleDone,
                          ]}
                        >
                          {task.title}
                        </Text>

                        {isCompleted ? (
                          <View style={styles.checkCircle}>
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="#fff"
                            />
                          </View>
                        ) : (
                          <View style={styles.toggleOff} />
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    {index < filteredTasks.length - 1 && (
                      <View style={styles.connector} />
                    )}
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* ── Bottom Nav ── */}
        <Navbar active={activeNav} onChange={setActiveNav} />
      </LinearGradient>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#D8CCFF" },
  gradient: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.padding,
    paddingTop: 45,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.light,
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: COLORS.notifBadge ?? COLORS.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  // Search input inline dans le header
  searchInput: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 36,
    minWidth: 140,
    maxWidth: 180,
    fontSize: 13,
    color: COLORS.text,
    ...SHADOWS.light,
  },

  // Scroll
  scroll: { paddingHorizontal: SIZES.padding, paddingTop: 12 },

  // Mission Card
  missionCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    alignItems: "center",
    position: "relative",
    marginBottom: 16,
    overflow: "hidden",
  },
  sparkleTopLeft: {
    position: "absolute",
    top: 10,
    left: 14,
    fontSize: 16,
    color: COLORS.primaryLight,
  },
  sparkleTopRight: {
    position: "absolute",
    top: 10,
    right: 14,
    fontSize: 12,
    color: COLORS.primaryLight,
  },
  missionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
    textAlign: "center",
  },
  statusBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 14,
  },
  statusText: { color: COLORS.white, fontSize: 13, fontWeight: "600" },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    backgroundColor: COLORS.progressBg,
    borderRadius: SIZES.radiusFull,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: SIZES.radiusFull,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    minWidth: 36,
    textAlign: "right",
  },

  // Filter tabs
  filterRow: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusFull,
    padding: 4,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    alignItems: "center",
  },
  filterActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: "600", color: COLORS.textLight },
  filterTextActive: { color: COLORS.white },

  // Task list
  taskList: { gap: 0 },
  emptyText: {
    textAlign: "center",
    color: COLORS.textLight,
    fontSize: 14,
    paddingVertical: 24,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: SIZES.radiusLg,
    padding: 14,
    gap: 12,
  },
  numCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  numCircleDone: { backgroundColor: COLORS.success },
  numCirclePending: { backgroundColor: COLORS.primaryPale },
  numText: { fontSize: 14, fontWeight: "700" },
  numTextDone: { color: COLORS.white },
  numTextPending: { color: COLORS.primary },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  taskTitleDone: { color: COLORS.textLight },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOff: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
  },
  connector: {
    width: 2,
    height: 10,
    backgroundColor: COLORS.connectorLine,
    alignSelf: "center",
  },
});