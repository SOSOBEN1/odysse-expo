// screens/DefiScreen.tsx
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
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
import { deleteDefi, getDefisByStatut, updateDefi } from "../../../backend/DefisService";
import Navbar from "../components/Navbar";
import NotifIcone from "../components/NotifIcone";
import SettingIcone from "../components/SettingIcone";
import { supabase } from "../constants/supabase";
import { COLORS, SHADOWS, SIZES } from "../constants/theme";
import { useUser } from "../constants/UserContext";

const { width } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey = "mes_defis" | "en_attente" | "termine";

interface Defi {
  id:               number;
  title:            string;
  subtitle:         string;
  xp:               number;
  duration:         string;
  participants:     number;
  icon:             "book" | "sport" | "rocket";
  statut:           string;
  date_debut:       string | null;
  date_fin:         string | null;
  objectif_minutes: number;
  progression:      number;
}

interface MissionLocal {
  id_mission:  number;
  titre:       string;
  description: string;
  duree_min:   number;
  difficulte:  1 | 2 | 3;
  xp_gain:     number;
  date_limite: string;
  statut:      string;
  dirty:       boolean;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "mes_defis",  label: "Mes défis"  },
  { key: "en_attente", label: "En attente" },
  { key: "termine",    label: "Terminé"    },
];

const AVATAR_COLORS = ["#E8A4C8", "#B39DDB", "#F48FB1"];
const DIFF_LABELS: Record<1|2|3, string> = { 1: "Facile", 2: "Moyen", 3: "Difficile" };
const DIFF_COLORS: Record<1|2|3, string> = { 1: "#22c55e", 2: "#F59E0B", 3: "#EF4444" };
type IconKey = "book" | "sport" | "rocket";
const ICON_OPTIONS: IconKey[] = ["book", "sport", "rocket"];
const ICON_LABELS: Record<IconKey, string> = { book: "📚 Étude", sport: "⚽ Sport", rocket: "🚀 Projet" };

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconEdit = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={COLORS.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconDelete = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
      stroke="#FF5252" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
const IconClose = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={COLORS.text} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

const ICONS = { book: IconBook, sport: IconSport, rocket: IconRocket };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDuration = (debut: string | null, fin: string | null): string => {
  if (!debut || !fin) return "—";
  const d1   = new Date(debut);
  const d2   = new Date(fin);
  const days = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  return days === 1 ? "1 jour" : `${days} jours`;
};

// ─── AvatarCircle ─────────────────────────────────────────────────────────────
const AvatarCircle = ({ color, offset }: { color: string; offset: number }) => (
  <View style={[styles.avatar, { backgroundColor: color, marginLeft: offset === 0 ? 0 : -10, zIndex: 10 - offset }]}>
    <View style={styles.avatarHead} />
    <View style={styles.avatarBody} />
  </View>
);

// ─── Pill statut ──────────────────────────────────────────────────────────────
const StatutPill = ({ statut }: { statut: string }) => {
  const cfg = {
    actif:      { bg: COLORS.secondary, text: "En cours"   },
    en_attente: { bg: "#F59E0B",        text: "En attente" },
    termine:    { bg: "#22c55e",        text: "Terminé"    },
  }[statut] ?? { bg: COLORS.secondary, text: statut };
  return (
    <View style={[styles.statutPill, { backgroundColor: cfg.bg }]}>
      <Text style={styles.statutText}>{cfg.text}</Text>
    </View>
  );
};

// ─── DefiCard ─────────────────────────────────────────────────────────────────
const DefiCard = ({
  defi, index, onDelete, onEdit, onPress,
}: {
  defi:     Defi;
  index:    number;
  onDelete: (id: number) => void;
  onEdit:   (defi: Defi) => void;
  onPress:  (defi: Defi) => void;
}) => {
  const anim     = useRef(new Animated.Value(0)).current;
  const IconComp = ICONS[defi.icon] ?? IconRocket;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, delay: index * 110, useNativeDriver: true, tension: 58, friction: 9 }).start();
  }, []);

  return (
    <Animated.View style={[styles.card, {
      opacity:   anim,
      transform: [
        { translateY: anim.interpolate({ inputRange: [0,1], outputRange: [30,0] }) },
        { scale:      anim.interpolate({ inputRange: [0,1], outputRange: [0.95,1] }) },
      ],
    }]}>
      <TouchableOpacity onPress={() => onPress(defi)} activeOpacity={0.92}>
        <View style={styles.cardTagRow}>
          <StatutPill statut={defi.statut} />
          {defi.date_fin && (
            <Text style={styles.cardDateLabel}>
              📅 Fin : {new Date(defi.date_fin).toLocaleDateString("fr-FR")}
            </Text>
          )}
        </View>
        <View style={styles.cardInner}>
          <View style={styles.cardIconWrapper}>
            <View style={styles.cardIconCircle}><IconComp /></View>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{defi.title}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={2}>{defi.subtitle}</Text>
            <View style={styles.avatarRow}>
              {Array.from({ length: Math.min(defi.participants, 3) }).map((_, i) => (
                <AvatarCircle key={i} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} offset={i} />
              ))}
              {defi.participants > 3 && (
                <View style={styles.moreParticipants}>
                  <Text style={styles.moreParticipantsText}>+{defi.participants - 3}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.cardRight}>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+{defi.xp} XP</Text>
            </View>
            <Text style={styles.cardDuration}>{defi.duration}</Text>
            <Text style={styles.cardObjectif}>🎯 {defi.objectif_minutes} min</Text>
          </View>
        </View>
        <View style={styles.cardProgressTrack}>
          <View style={[styles.cardProgressFill, { width: `${defi.progression}%` }]} />
        </View>
        <Text style={styles.cardProgressLabel}>{defi.progression}% accompli</Text>
      </TouchableOpacity>

      <View style={styles.cardActionsBottom}>
        <TouchableOpacity style={styles.actionIconBtn} onPress={() => onEdit(defi)}>
          <IconEdit />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionIconBtn} onPress={() => onDelete(defi.id)}>
          <IconDelete />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── SearchBar ────────────────────────────────────────────────────────────────
const SearchBar = ({ value, onChange }: { value: string; onChange: (t: string) => void }) => (
  <View style={styles.searchWrapper}>
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
      <Circle cx={11} cy={11} r={8} stroke={COLORS.textLight} strokeWidth={2} />
      <Path d="M21 21l-4.35-4.35" stroke={COLORS.textLight} strokeWidth={2} strokeLinecap="round" />
    </Svg>
    <TextInput
      placeholder="Rechercher un défi..."
      placeholderTextColor={COLORS.textLight}
      style={styles.searchInput}
      value={value}
      onChangeText={onChange}
    />
  </View>
);

// ─── TabBar ───────────────────────────────────────────────────────────────────
const TabBar = ({ active, onSelect }: { active: TabKey; onSelect: (k: TabKey) => void }) => (
  <View style={styles.tabBar}>
    {TABS.map(t => {
      const isActive = t.key === active;
      return (
        <TouchableOpacity
          key={t.key}
          style={[styles.tabItem, isActive && styles.tabItemActive]}
          onPress={() => onSelect(t.key)}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{t.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Sparkles ─────────────────────────────────────────────────────────────────
const Sparkles = () => (
  <Svg width={width} height={80} style={styles.sparklesSvg} pointerEvents="none">
    {[
      { x: 18,       y: 18, r: 2.5 }, { x: width - 22, y: 12, r: 2 },
      { x: width-40, y: 38, r: 1.5 }, { x: 35,         y: 55, r: 1.8 },
      { x: width/2,  y: 8,  r: 2   },
    ].map((s, i) => (
      <React.Fragment key={i}>
        <Circle cx={s.x} cy={s.y} r={s.r}   fill="#fff" opacity={0.7} />
        <Circle cx={s.x} cy={s.y} r={s.r*2} fill="#fff" opacity={0.15} />
      </React.Fragment>
    ))}
  </Svg>
);

// ─── EditModal ────────────────────────────────────────────────────────────────
const EditModal = ({
  defi,
  visible,
  onClose,
  onSaved,
}: {
  defi:    Defi | null;
  visible: boolean;
  onClose: () => void;
  onSaved: (updatedDefi: Defi, missions: MissionLocal[]) => void;
}) => {
  // champs défi
  const [nom,         setNom]         = useState("");
  const [description, setDescription] = useState("");
  const [xp,          setXp]          = useState("");
  const [icon,        setIcon]        = useState<IconKey>("rocket");
  const [dateDebut,   setDateDebut]   = useState("");
  const [dateFin,     setDateFin]     = useState("");
  const [objMin,      setObjMin]      = useState("");
  const [statut,      setStatut]      = useState("actif");

  // missions
  const [missions,    setMissions]    = useState<MissionLocal[]>([]);
  const [loadingM,    setLoadingM]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [openIdx,     setOpenIdx]     = useState<number | null>(null);

  // pré-remplir quand le modal s'ouvre
  useEffect(() => {
    if (!defi || !visible) return;
    setNom(defi.title);
    setDescription(defi.subtitle);
    setXp(String(defi.xp));
    setIcon(defi.icon);
    setDateDebut(defi.date_debut?.slice(0, 10) ?? "");
    setDateFin(defi.date_fin?.slice(0, 10) ?? "");
    setObjMin(String(defi.objectif_minutes));
    setStatut(defi.statut);
    setOpenIdx(null);
    loadMissions(defi.id);
  }, [visible, defi]);

  const loadMissions = async (id_defi: number) => {
    setLoadingM(true);
    const { data } = await supabase
      .from("mission")
      .select("id_mission, titre, description, statut, duree_min, difficulte, xp_gain, date_limite")
      .eq("id_defi", id_defi)
      .order("id_mission");
    if (data) {
      setMissions(data.map((m: any) => ({
        id_mission:  m.id_mission,
        titre:       m.titre        ?? "",
        description: m.description  ?? "",
        duree_min:   m.duree_min    ?? 30,
        difficulte:  (m.difficulte  ?? 1) as 1|2|3,
        xp_gain:     m.xp_gain      ?? 50,
        date_limite: m.date_limite?.slice(0,10) ?? "",
        statut:      m.statut       ?? "actif",
        dirty:       false,
      })));
    }
    setLoadingM(false);
  };

  const updateMission = (idx: number, patch: Partial<MissionLocal>) =>
    setMissions(prev => prev.map((m, i) => i === idx ? { ...m, ...patch, dirty: true } : m));

  const deleteMission = (idx: number) => {
    Alert.alert("Supprimer", "Supprimer cette mission ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          const m = missions[idx];
          if (m.id_mission > 0) {
            await supabase.from("mission").delete().eq("id_mission", m.id_mission);
          }
          setMissions(prev => prev.filter((_, i) => i !== idx));
          if (openIdx === idx) setOpenIdx(null);
        },
      },
    ]);
  };

  const addMission = () => {
    const newM: MissionLocal = {
      id_mission: -(Date.now()),
      titre: "", description: "", duree_min: 30, difficulte: 1,
      xp_gain: 50, date_limite: dateFin, statut: "actif", dirty: true,
    };
    setMissions(prev => [...prev, newM]);
    setOpenIdx(missions.length); // ouvrir la nouvelle
  };

  const handleSave = async () => {
    if (!defi || !nom.trim()) {
      Alert.alert("Champ requis", "Le nom du défi est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      // 1. Update défi
      const { error: errD } = await updateDefi(defi.id, {
        nom:              nom.trim(),
        description:      description.trim(),
        xp:               parseInt(xp) || 400,
        icon,
        date_debut:       dateDebut || undefined,
        date_fin:         dateFin   || undefined,
        objectif_minutes: parseInt(objMin) || 120,
        statut:           statut as any,
      });
      if (errD) throw new Error(errD.message);

      // 2. Update / insert missions dirty
      for (const m of missions) {
        if (!m.dirty) continue;
        const payload = {
          titre:       m.titre,
          description: m.description,
          duree_min:   m.duree_min,
          difficulte:  m.difficulte,
          xp_gain:     m.xp_gain,
          date_limite: m.date_limite || null,
          statut:      m.statut,
          id_defi:     defi.id,
        };
        if (m.id_mission > 0) {
          await supabase.from("mission").update(payload).eq("id_mission", m.id_mission);
        } else {
          await supabase.from("mission").insert(payload);
        }
      }

      // Construire le défi mis à jour pour l'UI
      const updatedDefi: Defi = {
        ...defi,
        title:            nom.trim(),
        subtitle:         description.trim(),
        xp:               parseInt(xp) || 400,
        icon,
        date_debut:       dateDebut || null,
        date_fin:         dateFin   || null,
        objectif_minutes: parseInt(objMin) || 120,
        statut,
        duration:         formatDuration(dateDebut || null, dateFin || null),
      };

      onSaved(updatedDefi, missions);
      onClose();
    } catch (e: any) {
      Alert.alert("Erreur", e.message ?? "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  if (!defi) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={modal.container}>

          {/* Header modal */}
          <View style={modal.header}>
            <View>
              <Text style={modal.headerTitle}>✏️ Modifier le défi</Text>
              <Text style={modal.headerSub}>#{defi.id} · {defi.title}</Text>
            </View>
            <TouchableOpacity style={modal.closeBtn} onPress={onClose}>
              <IconClose />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={modal.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Infos défi ──────────────────────────────────────────────── */}
            <SectionLabel text="📋 Informations du défi" />

            <ModalField label="Nom du défi *" value={nom} onChange={setNom} placeholder="Ex : 30 jours de lecture" />
            <ModalField label="Description" value={description} onChange={setDescription}
              placeholder="Décris l'objectif..." multiline />

            <View style={modal.row2}>
              <View style={{ flex: 1 }}>
                <ModalField label="XP" value={xp} onChange={setXp} keyboard="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <ModalField label="Objectif (min)" value={objMin} onChange={setObjMin} keyboard="numeric" />
              </View>
            </View>

            <View style={modal.row2}>
              <View style={{ flex: 1 }}>
                <ModalField label="Date début" value={dateDebut} onChange={setDateDebut} placeholder="YYYY-MM-DD" />
              </View>
              <View style={{ flex: 1 }}>
                <ModalField label="Date fin" value={dateFin} onChange={setDateFin} placeholder="YYYY-MM-DD" />
              </View>
            </View>

            {/* Icône */}
            <Text style={modal.label}>Icône</Text>
            <View style={modal.iconRow}>
              {ICON_OPTIONS.map(k => {
                const IC = ICONS[k];
                const active = icon === k;
                return (
                  <TouchableOpacity key={k}
                    style={[modal.iconOpt, active && modal.iconOptActive]}
                    onPress={() => setIcon(k)}>
                    <View style={[modal.iconCircle, active && modal.iconCircleActive]}>
                      <IC />
                    </View>
                    <Text style={[modal.iconLabel, active && modal.iconLabelActive]}>
                      {ICON_LABELS[k]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Statut */}
            <Text style={modal.label}>Statut</Text>
            <View style={modal.row2}>
              {(["actif", "en_attente", "termine"] as const).map(s => (
                <TouchableOpacity key={s}
                  style={[modal.statutBtn, statut === s && modal.statutBtnActive]}
                  onPress={() => setStatut(s)}>
                  <Text style={[modal.statutText, statut === s && modal.statutTextActive]}>
                    {s === "actif" ? "En cours" : s === "en_attente" ? "En attente" : "Terminé"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Missions ─────────────────────────────────────────────────── */}
            <SectionLabel text={`🎯 Missions (${missions.length})`} />

            {loadingM ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
            ) : missions.length === 0 ? (
              <Text style={modal.emptyMissions}>Aucune mission. Ajoutes-en une !</Text>
            ) : (
              missions.map((m, i) => (
                <View key={`${m.id_mission}-${i}`} style={modal.missionCard}>
                  {/* Header mission */}
                  <TouchableOpacity
                    style={modal.missionHeader}
                    onPress={() => setOpenIdx(openIdx === i ? null : i)}
                    activeOpacity={0.8}
                  >
                    <View style={modal.missionBadge}>
                      <Text style={modal.missionBadgeText}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={modal.missionTitle} numberOfLines={1}>
                        {m.titre || "Mission sans titre"}
                      </Text>
                      <Text style={modal.missionMeta}>
                        ⏱ {m.duree_min} min · {DIFF_LABELS[m.difficulte]} · ⚡ {m.xp_gain} XP
                      </Text>
                    </View>
                    <Text style={modal.chevron}>{openIdx === i ? "▲" : "▼"}</Text>
                  </TouchableOpacity>

                  {/* Body mission */}
                  {openIdx === i && (
                    <View style={modal.missionBody}>
                      <ModalField label="Titre" value={m.titre}
                        onChange={v => updateMission(i, { titre: v })} placeholder="Titre de la mission" />
                      <ModalField label="Description" value={m.description}
                        onChange={v => updateMission(i, { description: v })} multiline />

                      <View style={modal.row2}>
                        <View style={{ flex: 1 }}>
                          <ModalField label="Durée (min)" value={String(m.duree_min)}
                            onChange={v => updateMission(i, { duree_min: parseInt(v)||0 })} keyboard="numeric" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <ModalField label="XP gain" value={String(m.xp_gain)}
                            onChange={v => updateMission(i, { xp_gain: parseInt(v)||0 })} keyboard="numeric" />
                        </View>
                      </View>

                      <Text style={modal.label}>Difficulté</Text>
                      <View style={modal.diffRow}>
                        {([1,2,3] as const).map(d => (
                          <TouchableOpacity key={d}
                            style={[modal.diffBtn, m.difficulte === d && { backgroundColor: DIFF_COLORS[d], borderColor: DIFF_COLORS[d] }]}
                            onPress={() => updateMission(i, { difficulte: d })}>
                            <Text style={[modal.diffText, m.difficulte === d && { color: "#fff" }]}>
                              {DIFF_LABELS[d]}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <ModalField label="Date limite" value={m.date_limite}
                        onChange={v => updateMission(i, { date_limite: v })} placeholder="YYYY-MM-DD" />

                      <TouchableOpacity style={modal.deleteMissionBtn} onPress={() => deleteMission(i)}>
                        <Text style={modal.deleteMissionText}>🗑 Supprimer cette mission</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}

            {/* Ajouter mission */}
            <TouchableOpacity style={modal.addMissionBtn} onPress={addMission}>
              <Text style={modal.addMissionText}>＋ Ajouter une mission</Text>
            </TouchableOpacity>

            {/* Bouton Enregistrer */}
            <TouchableOpacity
              style={[modal.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={modal.saveBtnText}>💾 Enregistrer les modifications</Text>
              }
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Petits composants du modal ───────────────────────────────────────────────
const SectionLabel = ({ text }: { text: string }) => (
  <View style={modal.sectionWrap}>
    <Text style={modal.sectionText}>{text}</Text>
  </View>
);

const ModalField = ({
  label, value, onChange, placeholder, multiline = false, keyboard = "default",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboard?: "default" | "numeric";
}) => (
  <View style={{ marginBottom: 6 }}>
    <Text style={modal.label}>{label}</Text>
    <TextInput
      style={[modal.input, multiline && modal.inputMulti]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder ?? ""}
      placeholderTextColor={COLORS.textLight}
      multiline={multiline}
      keyboardType={keyboard}
    />
  </View>
);

// ─── DefiScreen ───────────────────────────────────────────────────────────────
export default function DefiScreen() {
  const router   = useRouter();
  const { userId } = useUser();

  const [activeTab,  setActiveTab]  = useState<TabKey>("mes_defis");
  const [defis,      setDefis]      = useState<Defi[]>([]);
  const [filtered,   setFiltered]   = useState<Defi[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");

  // Modal edit
  const [editingDefi, setEditingDefi] = useState<Defi | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }).start();
  }, []);

  useEffect(() => { loadDefis(); }, [activeTab]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(defis); return; }
    const q = search.toLowerCase();
    setFiltered(defis.filter(d =>
      d.title.toLowerCase().includes(q) || d.subtitle.toLowerCase().includes(q)
    ));
  }, [search, defis]);

  const calculerProgression = async (id_defi: number): Promise<number> => {
    const { data: missions } = await supabase
      .from("mission").select("statut").eq("id_defi", id_defi);
    if (!missions || missions.length === 0) return 0;
    const terminees = missions.filter((m: any) => m.statut === "termine").length;
    return Math.round((terminees / missions.length) * 100);
  };

  const getNbParticipants = async (id_defi: number): Promise<number> => {
    const { data } = await supabase
      .from("mission_validation")
      .select("id_user, mission!inner(id_defi)")
      .eq("mission.id_defi", id_defi);
    if (!data) return 1;
    const uniques = new Set(data.map((r: any) => r.id_user));
    return Math.max(1, uniques.size);
  };

  const loadDefis = useCallback(async () => {
    setLoading(true);
    const statutMap: Record<TabKey, string> = {
      mes_defis: "actif", en_attente: "en_attente", termine: "termine",
    };
    const { data, error } = await getDefisByStatut(userId ?? 1, statutMap[activeTab]);
    if (!error && data) {
      const enriched: Defi[] = await Promise.all(
        data.map(async (d: any) => {
          const [progression, participants] = await Promise.all([
            calculerProgression(d.id_defi),
            getNbParticipants(d.id_defi),
          ]);
          return {
            id:               d.id_defi,
            title:            d.nom ?? "",
            subtitle:         d.description ?? "",
            xp:               d.xp ?? 400,
            duration:         formatDuration(d.date_debut, d.date_fin),
            participants,
            icon:             (d.icon as IconKey) ?? "rocket",
            statut:           d.statut ?? "actif",
            date_debut:       d.date_debut ?? null,
            date_fin:         d.date_fin   ?? null,
            objectif_minutes: d.objectif_minutes ?? 120,
            progression,
          };
        })
      );
      setDefis(enriched);
    } else {
      setDefis([]);
    }
    setLoading(false);
  }, [activeTab, userId]);

  const handleDelete = (id: number) => {
    Alert.alert("Supprimer", "Veux-tu vraiment supprimer ce défi ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          const { error } = await deleteDefi(id);
          if (!error) setDefis(prev => prev.filter(d => d.id !== id));
          else Alert.alert("Erreur", "Impossible de supprimer ce défi.");
        },
      },
    ]);
  };

  // Ouvrir le modal d'édition
  const handleEdit = (defi: Defi) => {
    setEditingDefi(defi);
    setModalVisible(true);
  };

  // Appelé quand le modal confirme l'enregistrement
  const handleSaved = (updatedDefi: Defi) => {
    setDefis(prev => prev.map(d => d.id === updatedDefi.id ? updatedDefi : d));
  };

  const handlePress = (defi: Defi) => {
    router.push({
      pathname: "/frontend/screens/ProgressionDefiScreen",
      params: { defiId: defi.id, defiNom: defi.title, defiDesc: defi.subtitle },
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <Animated.View style={[styles.topIcons, {
        opacity:   headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-16,0] }) }],
      }]}>
        <NotifIcone onPress={() => console.log("Notif")} />
        <SettingIcone onPress={() => console.log("Settings")} />
      </Animated.View>

      <Sparkles />

      <Animated.View style={[styles.searchContainer, {
        opacity:   headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-10,0] }) }],
      }]}>
        <SearchBar value={search} onChange={setSearch} />
      </Animated.View>

      <TabBar active={activeTab} onSelect={tab => { setActiveTab(tab); setSearch(""); }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "mes_defis" && (
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Tes défis actifs</Text>
              <Text style={styles.sectionSubtitle}>
                {filtered.length} défi{filtered.length !== 1 ? "s" : ""} en cours
              </Text>
            </View>
            <TouchableOpacity style={styles.refreshIconBtn} onPress={loadDefis}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M1 4v6h6M23 20v-6h-6" stroke={COLORS.primary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"
                  stroke={COLORS.primary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              {activeTab === "mes_defis" ? "🚀" : activeTab === "en_attente" ? "⏳" : "🏆"}
            </Text>
            <Text style={styles.emptyTitle}>{search ? "Aucun résultat" : "Aucun défi ici"}</Text>
            <Text style={styles.emptySubtitle}>
              {search
                ? `Aucun défi ne correspond à "${search}"`
                : activeTab === "mes_defis"
                  ? "Lance ton premier défi !"
                  : "Cette section est vide pour l'instant."}
            </Text>
          </View>
        ) : (
          filtered.map((d, i) => (
            <DefiCard key={d.id} defi={d} index={i}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onPress={handlePress}
            />
          ))
        )}

        {activeTab === "mes_defis" && !loading && (
          <TouchableOpacity
            style={styles.ctaBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/frontend/screens/createDefis")}
          >
            <Text style={styles.ctaBtnText}>🚀 Lancer un nouveau défi</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Navbar active="defis" onChange={() => {}} />

      {/* ── Modal d'édition ───────────────────────────────────────────────── */}
      <EditModal
        defi={editingDefi}
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingDefi(null); }}
        onSaved={(updatedDefi) => {
          handleSaved(updatedDefi);
          setModalVisible(false);
          setEditingDefi(null);
        }}
      />
    </View>
  );
}

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection:     "row",
    justifyContent:    "space-between",
    alignItems:        "center",
    paddingTop:        Platform.OS === "ios" ? 20 : 16,
    paddingHorizontal: SIZES.padding,
    paddingBottom:     16,
    backgroundColor:   COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
    ...SHADOWS.light,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: COLORS.text },
  headerSub:   { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: "center", justifyContent: "center",
  },
  scroll: { paddingHorizontal: SIZES.padding, paddingTop: 16 },

  sectionWrap: {
    marginTop: 20, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary, paddingLeft: 10,
  },
  sectionText: { fontSize: 14, fontWeight: "800", color: COLORS.text },

  label: { fontSize: 11, fontWeight: "700", color: COLORS.textLight, marginBottom: 5, marginTop: 10 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: COLORS.text, ...SHADOWS.light,
  },
  inputMulti: { minHeight: 64, textAlignVertical: "top" },
  row2: { flexDirection: "row", gap: 8 },

  iconRow:        { flexDirection: "row", gap: 8, marginBottom: 4 },
  iconOpt:        { flex: 1, alignItems: "center", paddingVertical: 8, backgroundColor: COLORS.card,
                    borderRadius: 10, borderWidth: 2, borderColor: "transparent", ...SHADOWS.light },
  iconOptActive:  { borderColor: COLORS.primary },
  iconCircle:     { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.textLight+"33",
                    alignItems: "center", justifyContent: "center", marginBottom: 3 },
  iconCircleActive: { backgroundColor: COLORS.secondary },
  iconLabel:      { fontSize: 10, color: COLORS.textLight, fontWeight: "600", textAlign: "center" },
  iconLabelActive:{ color: COLORS.primary, fontWeight: "700" },

  statutBtn:       { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card,
                     alignItems: "center", borderWidth: 2, borderColor: "transparent", ...SHADOWS.light },
  statutBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "18" },
  statutText:      { fontSize: 11, color: COLORS.textLight, fontWeight: "600" },
  statutTextActive:{ color: COLORS.primary, fontWeight: "700" },

  emptyMissions: { color: COLORS.textLight, textAlign: "center", paddingVertical: 16, fontSize: 13 },

  missionCard: { backgroundColor: COLORS.card, borderRadius: 12, marginBottom: 8, overflow: "hidden", ...SHADOWS.light },
  missionHeader: { flexDirection: "row", alignItems: "center", padding: 10, gap: 8 },
  missionBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  missionBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  missionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.text },
  missionMeta:  { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  chevron:      { fontSize: 11, color: COLORS.textLight },
  missionBody:  { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: COLORS.background },

  diffRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  diffBtn: { flex: 1, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.card,
             alignItems: "center", borderWidth: 2, borderColor: COLORS.background },
  diffText: { fontSize: 11, fontWeight: "700", color: COLORS.textLight },

  deleteMissionBtn: { marginTop: 10, paddingVertical: 8, backgroundColor: "#FFF0F0", borderRadius: 8, alignItems: "center" },
  deleteMissionText:{ color: "#EF4444", fontSize: 12, fontWeight: "700" },

  addMissionBtn: {
    borderWidth: 2, borderColor: COLORS.primary, borderStyle: "dashed",
    borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 8, marginBottom: 16,
  },
  addMissionText: { color: COLORS.primary, fontSize: 14, fontWeight: "800" },

  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 30,
    paddingVertical: 15, alignItems: "center", marginTop: 8, ...SHADOWS.purple,
  },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.4 },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  topIcons: {
    flexDirection: "row", justifyContent: "flex-end",
    paddingTop: Platform.OS === "android" ? 44 : 58,
    paddingHorizontal: SIZES.padding, gap: 8,
  },
  sparklesSvg:     { position: "absolute", top: 0, left: 0 },
  searchContainer: { paddingHorizontal: SIZES.padding, marginTop: 10, marginBottom: 4 },
  searchWrapper:   { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card,
                     borderRadius: SIZES.radiusFull, paddingHorizontal: 14, paddingVertical: 10, ...SHADOWS.light },
  searchIcon:      { marginRight: 8 },
  searchInput:     { flex: 1, fontSize: 15, color: COLORS.text, padding: 0 },
  tabBar:          { flexDirection: "row", marginHorizontal: SIZES.padding, marginTop: 14,
                     backgroundColor: COLORS.card, borderRadius: SIZES.radiusFull,
                     padding: 4, ...SHADOWS.light },
  tabItem:         { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: SIZES.radiusFull },
  tabItemActive:   { backgroundColor: COLORS.primary, ...SHADOWS.purple },
  tabLabel:        { fontSize: 13, fontWeight: "600", color: COLORS.textLight },
  tabLabelActive:  { color: COLORS.white, fontWeight: "700" },
  scroll:          { flex: 1 },
  scrollContent:   { paddingHorizontal: SIZES.padding, paddingTop: 20, paddingBottom: 120 },
  sectionHeaderRow:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle:    { fontSize: 20, fontWeight: "800", color: COLORS.text },
  sectionSubtitle: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  refreshIconBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card,
                     alignItems: "center", justifyContent: "center", ...SHADOWS.light },
  loadingWrap:     { paddingVertical: 60, alignItems: "center", gap: 12 },
  loadingText:     { fontSize: 14, color: COLORS.textLight, fontWeight: "600" },
  card:            { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, marginBottom: 14,
                     overflow: "hidden", ...SHADOWS.medium },
  cardTagRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                     paddingHorizontal: 12, paddingTop: 10 },
  cardDateLabel:   { fontSize: 11, color: COLORS.textLight, fontWeight: "600" },
  cardInner:       { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 12,
                     paddingBottom: 10, gap: 10, marginTop: 8 },
  cardIconWrapper: { marginTop: 2 },
  cardIconCircle:  { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.secondary,
                     alignItems: "center", justifyContent: "center", ...SHADOWS.purple },
  cardContent:     { flex: 1 },
  cardTitle:       { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 3 },
  cardSubtitle:    { fontSize: 11, color: COLORS.textLight, lineHeight: 15, marginBottom: 8 },
  avatarRow:       { flexDirection: "row", alignItems: "center" },
  avatar:          { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: COLORS.card,
                     alignItems: "center", justifyContent: "flex-end", overflow: "hidden" },
  avatarHead:      { width: 14, height: 14, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.7)", marginBottom: 1 },
  avatarBody:      { width: 20, height: 12, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: "rgba(255,255,255,0.5)" },
  moreParticipants:{ width: 32, height: 32, borderRadius: 16, marginLeft: -10, zIndex: 1,
                     backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
                     borderWidth: 2, borderColor: COLORS.card },
  moreParticipantsText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  cardRight:       { alignItems: "flex-end", gap: 4, paddingTop: 2 },
  xpBadge:         { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull, paddingHorizontal: 10, paddingVertical: 4 },
  xpText:          { color: COLORS.white, fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  cardDuration:    { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  cardObjectif:    { fontSize: 10, color: COLORS.textLight, fontWeight: "600" },
  cardProgressTrack:{ height: 5, backgroundColor: COLORS.progressBg, marginHorizontal: 12, borderRadius: 3, overflow: "hidden" },
  cardProgressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 3 },
  cardProgressLabel:{ fontSize: 10, color: COLORS.textLight, textAlign: "right",
                      paddingHorizontal: 12, paddingBottom: 4, marginTop: 2 },
  cardActionsBottom:{ flexDirection: "row", justifyContent: "flex-end",
                      paddingHorizontal: 12, paddingBottom: 10, gap: 10 },
  actionIconBtn:   { width: 30, height: 30, borderRadius: 8,
                     backgroundColor: "rgba(120,90,180,0.07)",
                     alignItems: "center", justifyContent: "center" },
  statutPill:      { borderRadius: SIZES.radiusFull, paddingHorizontal: 10, paddingVertical: 3 },
  statutText:      { color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 0.2 },
  emptyContainer:  { paddingVertical: 60, alignItems: "center", gap: 10 },
  emptyIcon:       { fontSize: 52 },
  emptyTitle:      { fontSize: 18, fontWeight: "800", color: COLORS.text },
  emptySubtitle:   { fontSize: 13, color: COLORS.textLight, textAlign: "center", lineHeight: 18 },
  ctaBtn:          { width: "100%", backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull,
                     paddingVertical: 16, alignItems: "center", marginTop: 10, ...SHADOWS.purple },
  ctaBtnText:      { color: COLORS.white, fontSize: 16, fontWeight: "800", letterSpacing: 0.4 },
});