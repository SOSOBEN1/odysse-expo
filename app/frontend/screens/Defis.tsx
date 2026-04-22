import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { deleteDefi, getDefisByStatut } from '../../../backend/DefisService';
import Navbar from "../components/Navbar";
import NotifIcone from "../components/NotifIcone";
import SettingIcone from "../components/SettingIcone";
import { COLORS, SHADOWS, SIZES } from "../constants/theme";

const { width } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey = "mes_defis" | "en_attente" | "termine";

interface Defi {
  id: number;
  title: string;
  subtitle: string;
  xp: number;
  duration: string;
  participants: number;
  icon: "book" | "sport" | "rocket";
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "mes_defis",  label: "Mes défis"  },
  { key: "en_attente", label: "En attente" },
  { key: "termine",    label: "Terminé"    },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconEdit = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const IconDelete = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke="#FF5252" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const IconBook = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const IconSport = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#fff" strokeWidth={2} />
    <Path d="M12 3C8 7 8 17 12 21M12 3C16 7 16 17 12 21M3 12h18" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const IconRocket = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C12 2 7 6 7 13H17C17 6 12 2 12 2Z" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
    <Path d="M7 13L5 20H19L17 13" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
    <Circle cx={12} cy={10} r={2} fill="#fff" />
  </Svg>
);

const ICONS = { book: IconBook, sport: IconSport, rocket: IconRocket };

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AvatarCircle = ({ color, offset }: { color: string; offset: number }) => (
  <View
    style={[
      styles.avatar,
      { backgroundColor: color, marginLeft: offset === 0 ? 0 : -10, zIndex: 10 - offset },
    ]}
  >
    <View style={styles.avatarHead} />
    <View style={styles.avatarBody} />
  </View>
);

const AVATAR_COLORS = ["#E8A4C8", "#B39DDB", "#F48FB1"];

const XPBadge = ({ xp }: { xp: number }) => (
  <View style={styles.xpBadge}>
    <Text style={styles.xpText}>+ {xp} XP</Text>
  </View>
);

const EnCoursPill = () => (
  <View style={styles.enCoursPill}>
    <Text style={styles.enCoursText}>En cours</Text>
  </View>
);

// ─── Search bar ───────────────────────────────────────────────────────────────
const SearchBar = () => (
  <View style={styles.searchWrapper}>
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
      <Circle cx={11} cy={11} r={8} stroke={COLORS.textLight} strokeWidth={2} />
      <Path d="M21 21l-4.35-4.35" stroke={COLORS.textLight} strokeWidth={2} strokeLinecap="round" />
    </Svg>
    <TextInput
      placeholder="Recherche"
      placeholderTextColor={COLORS.textLight}
      style={styles.searchInput}
    />
  </View>
);

// ─── Defi Card ────────────────────────────────────────────────────────────────
const DefiCard = ({
  defi,
  index,
  onDelete,
  onEdit,
}: {
  defi: Defi;
  index: number;
  onDelete: (id: number) => void;
  onEdit: (defi: Defi) => void;
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const IconComp = ICONS[defi.icon] ?? IconRocket;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 120,
      useNativeDriver: true,
      tension: 58,
      friction: 9,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
          ],
        },
      ]}
    >
      <View style={styles.cardTagRow}>
        <EnCoursPill />
      </View>

      <View style={styles.cardInner}>
        <View style={styles.cardIconWrapper}>
          <View style={styles.cardIconCircle}>
            <IconComp />
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{defi.title}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>{defi.subtitle}</Text>
          <View style={styles.avatarRow}>
            {Array.from({ length: Math.min(defi.participants, 3) }).map((_, i) => (
              <AvatarCircle key={i} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} offset={i} />
            ))}
          </View>
        </View>

        <View style={styles.cardRight}>
          <XPBadge xp={defi.xp} />
          <Text style={styles.cardDuration}>{defi.duration}</Text>
        </View>
      </View>

      <View style={styles.cardActionsBottom}>
        <TouchableOpacity style={styles.actionIconBtn} onPress={() => onEdit(defi)}>
          <IconEdit />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionIconBtn} onPress={() => onDelete(defi.id)}>
          <IconDelete />
        </TouchableOpacity>
      </View>

      <View style={styles.cardProgressTrack}>
        <View style={[styles.cardProgressFill, { width: `${35 + index * 12}%` }]} />
      </View>
    </Animated.View>
  );
};

// ─── Sparkles ─────────────────────────────────────────────────────────────────
const Sparkles = () => (
  <Svg width={width} height={80} style={styles.sparklesSvg} pointerEvents="none">
    {[
      { x: 18,       y: 18, r: 2.5 },
      { x: width-22, y: 12, r: 2   },
      { x: width-40, y: 38, r: 1.5 },
      { x: 35,       y: 55, r: 1.8 },
      { x: width/2,  y: 8,  r: 2   },
    ].map((s, i) => (
      <React.Fragment key={i}>
        <Circle cx={s.x} cy={s.y} r={s.r}   fill="#fff" opacity={0.7} />
        <Circle cx={s.x} cy={s.y} r={s.r*2} fill="#fff" opacity={0.15} />
      </React.Fragment>
    ))}
  </Svg>
);

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TabBar = ({ active, onSelect }: { active: TabKey; onSelect: (k: TabKey) => void }) => (
  <View style={styles.tabBar}>
    {TABS.map((t) => {
      const isActive = t.key === active;
      return (
        <TouchableOpacity
          key={t.key}
          style={[styles.tabItem, isActive && styles.tabItemActive]}
          onPress={() => onSelect(t.key)}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── DefiScreen ───────────────────────────────────────────────────────────────
export default function DefiScreen() {
  const router = useRouter();

  // ─── State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>("mes_defis");
  const [defis, setDefis]         = useState<Defi[]>([]);
  const [loading, setLoading]     = useState(true);

  const headerAnim = useRef(new Animated.Value(0)).current;

  // ─── Animation header ─────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1, useNativeDriver: true, tension: 55, friction: 9,
    }).start();
  }, []);

  // ─── Charger les défis quand l'onglet change ───────────────────────────────
  useEffect(() => {
    loadDefis();
  }, [activeTab]);

  const loadDefis = async () => {
    setLoading(true);

    const statutMap: Record<TabKey, string> = {
      mes_defis:  'actif',
      en_attente: 'en_attente',
      termine:    'termine',
    };

    const userId = 1; // ← remplacer par l'ID de l'user connecté (auth)
    const { data, error } = await getDefisByStatut(userId, statutMap[activeTab]);

    if (!error && data) {
      setDefis(data.map((d: any) => ({
        id:           d.id_defi,
        title:        d.nom ?? '',
        subtitle:     d.description ?? '',
        xp:           d.xp ?? 400,
        duration:     d.duration_label ?? '',
        participants: d.participants ?? 1,
        icon:         d.icon ?? 'rocket',
      })));
    }

    setLoading(false);
  };

  // ─── Supprimer un défi ────────────────────────────────────────────────────
  const handleDelete = (id: number) => {
    Alert.alert("Supprimer", "Voulez-vous vraiment supprimer ce défi ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          const { error } = await deleteDefi(id);
          if (!error) {
            setDefis(prev => prev.filter(d => d.id !== id));
          } else {
            Alert.alert("Erreur", "Impossible de supprimer ce défi.");
          }
        },
      },
    ]);
  };

  // ─── Modifier un défi ─────────────────────────────────────────────────────
  const handleEdit = (defi: Defi) => {
    router.push({
      pathname: "/frontend/screens/createDefis",
      params: {
        id:       defi.id,
        title:    defi.title,
        subtitle: defi.subtitle,
        xp:       defi.xp,
        icon:     defi.icon,
        mode:     "edit",
      },
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <Animated.View
        style={[
          styles.topIcons,
          {
            opacity: headerAnim,
            transform: [
              { translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
            ],
          },
        ]}
      >
        <NotifIcone onPress={() => console.log("Notif")} />
        <SettingIcone onPress={() => console.log("Settings")} />
      </Animated.View>

      <Sparkles />

      <Animated.View
        style={[
          styles.searchContainer,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
          },
        ]}
      >
        <SearchBar />
      </Animated.View>

      <TabBar active={activeTab} onSelect={setActiveTab} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "mes_defis" ? (
          <>
            <Text style={styles.sectionTitle}>Tes défis actuels</Text>
            <Text style={styles.sectionSubtitle}>
              Accomplis tes défis avec tes amis pour gagner des récompenses !
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : defis.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.sectionSubtitle}>Aucun défi actif pour le moment.</Text>
              </View>
            ) : (
              defis.map((d, i) => (
                <DefiCard
                  key={d.id}
                  defi={d}
                  index={i}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))
            )}

            <TouchableOpacity
              style={styles.ctaBtn}
              activeOpacity={0.85}
              onPress={() => router.push("/frontend/screens/createDefis")}
            >
              <Text style={styles.ctaBtnText}>Lancer un défi</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : defis.length === 0 ? (
              <Text style={styles.sectionSubtitle}>Aucun défi dans cette catégorie pour le moment.</Text>
            ) : (
              defis.map((d, i) => (
                <DefiCard
                  key={d.id}
                  defi={d}
                  index={i}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Navbar active="defis" onChange={() => {}} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topIcons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: Platform.OS === "android" ? 44 : 58,
    paddingHorizontal: SIZES.padding,
    gap: 8,
  },
  sparklesSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  searchContainer: {
    paddingHorizontal: SIZES.padding,
    marginTop: 10,
    marginBottom: 4,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHADOWS.light,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    padding: 0,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: SIZES.padding,
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusFull,
    padding: 4,
    ...SHADOWS.light,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    borderRadius: SIZES.radiusFull,
  },
  tabItemActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.purple,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textLight,
  },
  tabLabelActive: {
    color: COLORS.white,
    fontWeight: "700",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 20,
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLg,
    marginBottom: 14,
    overflow: "hidden",
    ...SHADOWS.medium,
  },
  cardTagRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  cardActionsBottom: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 10,
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(120, 90, 180, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 10,
  },
  cardIconWrapper: {
    marginTop: 2,
  },
  cardIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.purple,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textLight,
    lineHeight: 15,
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.card,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  avatarHead: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.7)",
    marginBottom: 1,
  },
  avatarBody: {
    width: 20,
    height: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 8,
    paddingTop: 2,
  },
  xpBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  xpText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  cardDuration: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  enCoursPill: {
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  enCoursText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardProgressTrack: {
    height: 5,
    backgroundColor: COLORS.progressBg,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 3,
    overflow: "hidden",
  },
  cardProgressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  ctaBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusFull,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    ...SHADOWS.purple,
  },
  ctaBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
});