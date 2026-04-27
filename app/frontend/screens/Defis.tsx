// screens/DefiScreen.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
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
  isInvite: boolean
}

interface MissionLocal {
  id_mission:  number;
  titre:       string;
  description: string;
  duree_min:   number;
  difficulte:  1 | 2 | 3;
  priorite:    1 | 2 | 3 | 4;
  xp_gain:     number;
  date_limite: Date | null;
  statut:      string;
  dirty:       boolean;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "mes_defis",  label: "Mes defis"  },
  { key: "en_attente", label: "En attente" },
  { key: "termine",    label: "Termine"    },
];

const AVATAR_COLORS = ["#E8A4C8", "#B39DDB", "#F48FB1"];
const DIFF_LABELS: Record<1|2|3, string>   = { 1: "Facile", 2: "Moyen", 3: "Difficile" };
const PRIO_LABELS: Record<1|2|3|4, string> = { 1: "Basse", 2: "Normale", 3: "Haute", 4: "Urgente" };

type IconKey = "book" | "sport" | "rocket";
const ICON_OPTIONS: IconKey[] = ["book", "sport", "rocket"];
const ICON_LABELS: Record<IconKey, string> = { book: "Etude", sport: "Sport", rocket: "Projet" };

const DIFFICULTES_OPT = [
  { label: "Facile",    value: 1 },
  { label: "Moyen",     value: 2 },
  { label: "Difficile", value: 3 },
];
const PRIORITES_OPT = [
  { label: "Basse",   value: 1 },
  { label: "Normale", value: 2 },
  { label: "Haute",   value: 3 },
  { label: "Urgente", value: 4 },
];

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
const formatDateLabel = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
const formatTimeLabel = (d: Date) =>
  d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// ─── AvatarCircle ─────────────────────────────────────────────────────────────
const AvatarCircle = ({ color, offset }: { color: string; offset: number }) => (
  <View style={[styles.avatar, { backgroundColor: color, marginLeft: offset === 0 ? 0 : -10, zIndex: 10 - offset }]}>
    <View style={styles.avatarHead} />
    <View style={styles.avatarBody} />
  </View>
);

// ─── StatutPill ───────────────────────────────────────────────────────────────
const StatutPill = ({ statut }: { statut: string }) => {
  const cfg = {
    actif:      { bg: COLORS.secondary, text: "En cours"   },
    en_attente: { bg: "#F59E0B",        text: "En attente" },
    termine:    { bg: "#22c55e",        text: "Termine"    },
  }[statut] ?? { bg: COLORS.secondary, text: statut };
  return (
    <View style={[styles.statutPill, { backgroundColor: cfg.bg }]}>
      <Text style={styles.statutPillText}>{cfg.text}</Text>
    </View>
  );
};

// ─── DefiCard ─────────────────────────────────────────────────────────────────
const DefiCard = ({
  defi, index, onDelete, onEdit, onPress,
}: {
  defi: Defi; index: number;
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
           {defi.isInvite && (
  <View style={styles.inviteBadge}>
    <Text style={styles.inviteBadgeText}>Invité</Text>
  </View>
)}
          {defi.date_fin && (
            <Text style={styles.cardDateLabel}>
              Fin : {new Date(defi.date_fin).toLocaleDateString("fr-FR")}
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
            <Text style={styles.cardObjectif}>{defi.objectif_minutes} min</Text>
          </View>
        </View>
        <View style={styles.cardProgressTrack}>
          <View style={[styles.cardProgressFill, { width: `${defi.progression}%` as any }]} />
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
      placeholder="Rechercher un defi..."
      placeholderTextColor={COLORS.textLight}
      style={styles.searchInput}
      value={value}
      onChangeText={onChange}
      returnKeyType="search"
      clearButtonMode="while-editing"
    />
    {value.length > 0 && Platform.OS === "android" && (
      <TouchableOpacity onPress={() => onChange("")} style={{ padding: 4 }}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path d="M18 6L6 18M6 6l12 12" stroke={COLORS.textLight} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
      </TouchableOpacity>
    )}
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
      { x: 18, y: 18, r: 2.5 }, { x: width - 22, y: 12, r: 2 },
      { x: width - 40, y: 38, r: 1.5 }, { x: 35, y: 55, r: 1.8 },
      { x: width / 2, y: 8, r: 2 },
    ].map((s, i) => (
      <React.Fragment key={i}>
        <Circle cx={s.x} cy={s.y} r={s.r}   fill="#fff" opacity={0.7} />
        <Circle cx={s.x} cy={s.y} r={s.r*2} fill="#fff" opacity={0.15} />
      </React.Fragment>
    ))}
  </Svg>
);

// ─── DatePickerBtn (date seule — pour le defi) ────────────────────────────────
const DatePickerBtn = ({ label, date, onConfirm }: {
  label: string; date: Date | null; onConfirm: (d: Date | null) => void;
}) => {
  const [show, setShow] = useState(false);
  const [temp, setTemp] = useState<Date>(date ?? new Date());

  return (
    <>
      <TouchableOpacity style={modal.dateBtn} onPress={() => setShow(true)} activeOpacity={0.85}>
        <Text style={[modal.dateBtnText, !!date && modal.dateBtnTextFilled]}>
          {date ? formatDateLabel(date) : label}
        </Text>
        {date && (
          <TouchableOpacity onPress={() => onConfirm(null)} style={{ marginLeft: 6 }}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6l12 12" stroke="#aaa" strokeWidth={2.4} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {Platform.OS === "ios" ? (
        <Modal visible={show} transparent animationType="slide">
          <View style={modal.dateModalOverlay}>
            <View style={modal.dateModalCard}>
              <Text style={modal.dateModalTitle}>{label}</Text>
              <DateTimePicker value={temp} mode="date" display="spinner" locale="fr-FR"
                minimumDate={new Date()} onChange={(_, d) => { if (d) setTemp(d); }} />
              <View style={modal.dateModalActions}>
                <TouchableOpacity style={modal.dateModalCancel} onPress={() => setShow(false)}>
                  <Text style={modal.dateModalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modal.dateModalConfirm}
                  onPress={() => { onConfirm(temp); setShow(false); }}>
                  <Text style={modal.dateModalConfirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        show && (
          <DateTimePicker value={temp} mode="date" display="default" minimumDate={new Date()}
            onChange={(_, d) => { setShow(false); if (d) onConfirm(d); }} />
        )
      )}
    </>
  );
};

// ─── MissionDateTimePicker (date + heure — pour les missions) ─────────────────
const MissionDateTimePicker = ({ date, onConfirm }: {
  date: Date | null; onConfirm: (d: Date | null) => void;
}) => {
  const [showDate,   setShowDate]   = useState(false);
  const [showTime,   setShowTime]   = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [tempDate,   setTempDate]   = useState<Date>(date ?? new Date());

  const handleChange = (_: any, selected?: Date) => {
    if (!selected) {
      if (Platform.OS === "android") { setShowDate(false); setShowTime(false); }
      return;
    }
    if (pickerMode === "date") {
      const merged = new Date(selected);
      const base = date ?? new Date();
      merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
      setTempDate(merged);
      if (Platform.OS === "android") {
        setShowDate(false);
        setPickerMode("time");
        setShowTime(true);
      }
    } else {
      const merged = new Date(tempDate);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setTempDate(merged);
      if (Platform.OS === "android") {
        setShowTime(false);
        onConfirm(merged);
      }
    }
  };

  const confirmIOS = () => {
    setShowDate(false);
    setShowTime(false);
    onConfirm(tempDate);
  };

  return (
    <>
      <View style={modal.dateTimeRow}>
        {/* Bouton date */}
        <TouchableOpacity
          style={modal.dateTimeBtn}
          onPress={() => {
            setPickerMode("date");
            setTempDate(date ?? new Date());
            setShowDate(true);
          }}
          activeOpacity={0.85}
        >
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{ marginRight: 5 }}>
            <Path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
              stroke={COLORS.primary} strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
          <Text style={modal.dateTimeBtnText}>
            {date ? formatDateLabel(date) : "Choisir la date"}
          </Text>
        </TouchableOpacity>

        {/* Bouton heure */}
        <TouchableOpacity
          style={modal.dateTimeBtn}
          onPress={() => {
            setPickerMode("time");
            setTempDate(date ?? new Date());
            setShowTime(true);
          }}
          activeOpacity={0.85}
        >
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" style={{ marginRight: 5 }}>
            <Circle cx={12} cy={12} r={9} stroke={COLORS.primary} strokeWidth={1.8} />
            <Path d="M12 7v5l3 3" stroke={COLORS.primary} strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
          <Text style={modal.dateTimeBtnText}>
            {date ? formatTimeLabel(date) : "Choisir l'heure"}
          </Text>
        </TouchableOpacity>

        {/* Effacer */}
        {date && (
          <TouchableOpacity onPress={() => onConfirm(null)} style={{ padding: 4 }}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} fill="#FECACA" />
              <Path d="M15 9L9 15M9 9l6 6" stroke="#C93A3A" strokeWidth={2.2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        )}
      </View>

      {/* Résumé */}
      {date && (
        <View style={modal.dateSummary}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={COLORS.primary} strokeWidth={1.8} />
            <Path d="M12 7v5l3 3" stroke={COLORS.primary} strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
          <Text style={modal.dateSummaryText}>
            Limite : {formatDateLabel(date)} a {formatTimeLabel(date)}
          </Text>
        </View>
      )}

      {/* Android pickers natifs */}
      {Platform.OS === "android" && showDate && (
        <DateTimePicker value={tempDate} mode="date" display="default"
          minimumDate={new Date()} onChange={handleChange} />
      )}
      {Platform.OS === "android" && showTime && (
        <DateTimePicker value={tempDate} mode="time" display="default" onChange={handleChange} />
      )}

      {/* iOS modal */}
      {Platform.OS === "ios" && (showDate || showTime) && (
        <Modal visible transparent animationType="slide">
          <View style={modal.dateModalOverlay}>
            <View style={modal.dateModalCard}>
              <Text style={modal.dateModalTitle}>
                {pickerMode === "date" ? "Date limite" : "Heure limite"}
              </Text>
              <DateTimePicker
                value={tempDate}
                mode={pickerMode}
                display="spinner"
                locale="fr-FR"
                onChange={handleChange}
              />
              <View style={modal.dateModalActions}>
                <TouchableOpacity style={modal.dateModalCancel}
                  onPress={() => { setShowDate(false); setShowTime(false); }}>
                  <Text style={modal.dateModalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modal.dateModalConfirm} onPress={confirmIOS}>
                  <Text style={modal.dateModalConfirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

// ─── Dropdown ─────────────────────────────────────────────────────────────────
const Dropdown = ({ placeholder, options, value, onChange }: {
  placeholder: string;
  options: { label: string; value: any }[];
  value: any;
  onChange: (v: any) => void;
}) => {
  const [open, setOpen] = useState(false);
  const isEmpty = value === "" || value === null || value === undefined;
  const getLabel = (v: any) => options.find(o => o.value === v)?.label ?? "";

  return (
    <View style={{ zIndex: open ? 999 : 1 }}>
      <TouchableOpacity
        style={[modal.dropBtn, open && modal.dropBtnOpen]}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.85}
      >
        <Text style={[modal.dropValue, isEmpty && modal.dropPlaceholder]}>
          {!isEmpty ? getLabel(value) : placeholder}
        </Text>
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d={open ? "M18 15L12 9L6 15" : "M6 9L12 15L18 9"}
            stroke={COLORS.primary} strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
      </TouchableOpacity>
      {open && (
        <View style={modal.dropMenu}>
          {options.map(opt => (
            <TouchableOpacity
              key={String(opt.value)}
              style={[modal.dropOption, value === opt.value && modal.dropOptionSelected]}
              onPress={() => { onChange(opt.value); setOpen(false); }}
            >
              <Text style={[modal.dropOptionText, value === opt.value && modal.dropOptionTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── SectionLabel + ModalField ────────────────────────────────────────────────
const SectionLabel = ({ text }: { text: string }) => (
  <View style={modal.sectionWrap}>
    <Text style={modal.sectionText}>{text}</Text>
  </View>
);

const ModalField = ({
  label, value, onChange, placeholder, multiline = false, keyboard = "default",
}: {
  label?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboard?: "default" | "numeric";
}) => (
  <View style={{ marginBottom: 6 }}>
    {!!label && <Text style={modal.label}>{label}</Text>}
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

// ─── EditModal ────────────────────────────────────────────────────────────────
const EditModal = ({
  defi, visible, onClose, onSaved,
}: {
  defi: Defi | null; visible: boolean;
  onClose: () => void;
  onSaved: (updatedDefi: Defi, missions: MissionLocal[]) => void;
}) => {
  const [nom,         setNom]         = useState("");
  const [description, setDescription] = useState("");
  const [xp,          setXp]          = useState("");
  const [icon,        setIcon]        = useState<IconKey>("rocket");
  const [dateDebut,   setDateDebut]   = useState<Date | null>(null);
  const [dateFin,     setDateFin]     = useState<Date | null>(null);
  const [objMin,      setObjMin]      = useState("");
  const [statut,      setStatut]      = useState("actif");

  const [missions, setMissions] = useState<MissionLocal[]>([]);
  const [loadingM, setLoadingM] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [openIdx,  setOpenIdx]  = useState<number | null>(null);

  useEffect(() => {
    if (!defi || !visible) return;
    setNom(defi.title);
    setDescription(defi.subtitle);
    setXp(String(defi.xp));
    setIcon(defi.icon);
    setDateDebut(defi.date_debut ? new Date(defi.date_debut) : null);
    setDateFin(defi.date_fin   ? new Date(defi.date_fin)   : null);
    setObjMin(String(defi.objectif_minutes));
    setStatut(defi.statut);
    setOpenIdx(null);
    loadMissions(defi.id);
  }, [visible, defi]);

  const loadMissions = async (id_defi: number) => {
  console.log("📋 loadMissions id_defi =", id_defi)
  if (!id_defi) return
  setLoadingM(true)

  const { data, error } = await supabase
    .from("mission")
    .select("id_mission, titre, description, duree_min, difficulte, priorite, xp_gain, date_limite")
    // ✅ statut retiré
    .eq("id_defi", id_defi)
    .order("id_mission")

  console.log("📋 data =", data?.length, "error =", error)

  if (data) {
    setMissions(data.map((m: any) => ({
      id_mission:  m.id_mission,
      titre:       m.titre       ?? "",
      description: m.description ?? "",
      duree_min:   m.duree_min   ?? 30,
      difficulte:  (m.difficulte ?? 1) as 1|2|3,
      priorite:    (m.priorite   ?? 2) as 1|2|3|4,
      xp_gain:     m.xp_gain     ?? 50,
      date_limite: m.date_limite ? new Date(m.date_limite) : null,
      statut:      "actif",  // ✅ valeur locale uniquement
      dirty:       false,
    })))
  }
  setLoadingM(false)
}
  const updateMission = (idx: number, patch: Partial<MissionLocal>) =>
    setMissions(prev => prev.map((m, i) => i === idx ? { ...m, ...patch, dirty: true } : m));

  const deleteMission = (idx: number) => {
    Alert.alert("Supprimer", "Supprimer cette mission ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          const m = missions[idx];
          if (m.id_mission > 0)
            await supabase.from("mission").delete().eq("id_mission", m.id_mission);
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
      priorite: 2, xp_gain: 50, date_limite: null, statut: "actif", dirty: true,
    };
    setMissions(prev => [...prev, newM]);
    setOpenIdx(missions.length);
  };

  const handleSave = async () => {
    if (!defi || !nom.trim()) {
      Alert.alert("Champ requis", "Le nom du defi est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      const debutStr = dateDebut ? dateDebut.toISOString().split("T")[0] : undefined;
      const finStr   = dateFin   ? dateFin.toISOString().split("T")[0]   : undefined;

      const { error: errD } = await updateDefi(defi.id, {
        nom:              nom.trim(),
        description:      description.trim(),
        xp:               parseInt(xp) || 400,
        icon,
        date_debut:       debutStr,
        date_fin:         finStr,
        objectif_minutes: parseInt(objMin) || 120,
        statut:           statut as any,
      });
      if (errD) throw new Error(errD.message);

      for (const m of missions) {
        if (!m.dirty) continue;
        const payload = {
          titre:       m.titre,
          description: m.description,
          duree_min:   m.duree_min,
          difficulte:  m.difficulte,
          priorite:    m.priorite,
          xp_gain:     m.xp_gain,
          date_limite: m.date_limite ? m.date_limite.toISOString() : null,
          id_defi:     defi.id,
        };
        if (m.id_mission > 0)
          await supabase.from("mission").update(payload).eq("id_mission", m.id_mission);
        else
          await supabase.from("mission").insert(payload);
      }

      const updatedDefi: Defi = {
        ...defi,
        title:            nom.trim(),
        subtitle:         description.trim(),
        xp:               parseInt(xp) || 400,
        icon,
        date_debut:       debutStr ?? null,
        date_fin:         finStr   ?? null,
        objectif_minutes: parseInt(objMin) || 120,
        statut,
        duration: formatDuration(debutStr ?? null, finStr ?? null),
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

          <View style={modal.header}>
            <View>
              <Text style={modal.headerTitle}>Modifier le defi</Text>
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
            {/* ── Infos defi ── */}
            <SectionLabel text="Informations du defi" />

            <ModalField label="Titre *" value={nom} onChange={setNom} placeholder="Ex : 30 jours de lecture" />
            <ModalField label="Description" value={description} onChange={setDescription}
              placeholder="Decris l'objectif..." multiline />

            <View style={modal.row2}>
              <View style={{ flex: 1 }}>
                <Text style={modal.label}>Date debut</Text>
                <DatePickerBtn label="Choisir" date={dateDebut} onConfirm={setDateDebut} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={modal.label}>Date fin</Text>
                <DatePickerBtn label="Choisir" date={dateFin} onConfirm={setDateFin} />
              </View>
            </View>

            {/* Icone */}
            <Text style={modal.label}>Icone</Text>
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
                  <Text style={[modal.statutBtnText, statut === s && modal.statutTextActive]}>
                    {s === "actif" ? "En cours" : s === "en_attente" ? "En attente" : "Termine"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Missions ── */}
            <SectionLabel text={`Missions (${missions.length})`} />

            {loadingM ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
            ) : missions.length === 0 ? (
              <Text style={modal.emptyMissions}>Aucune mission. Ajoutes-en une !</Text>
            ) : (
              missions.map((m, i) => (
                <View key={`${m.id_mission}-${i}`} style={modal.missionCard}>
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
                        {m.duree_min} min · {DIFF_LABELS[m.difficulte]} · {PRIO_LABELS[m.priorite]} · {m.xp_gain} XP
                      </Text>
                    </View>
                    <Text style={modal.chevron}>{openIdx === i ? "▲" : "▼"}</Text>
                  </TouchableOpacity>

                  {openIdx === i && (
                    <View style={modal.missionBody}>
                      <ModalField label="Titre *" value={m.titre}
                        onChange={v => updateMission(i, { titre: v })} placeholder="Titre de la mission" />
                      <ModalField label="Description" value={m.description}
                        onChange={v => updateMission(i, { description: v })} multiline
                        placeholder="Decrivez la mission..." />

                      <Text style={modal.label}>Duree (min)</Text>
                      <TextInput
                        style={modal.input}
                        value={String(m.duree_min)}
                        onChangeText={v => updateMission(i, { duree_min: parseInt(v) || 0 })}
                        keyboardType="numeric"
                        placeholderTextColor={COLORS.textLight}
                      />

                      <View style={{ zIndex: 500 - i * 10 }}>
                        <Text style={modal.label}>Difficulte</Text>
                        <Dropdown
                          placeholder="Choisir"
                          options={DIFFICULTES_OPT}
                          value={m.difficulte}
                          onChange={v => updateMission(i, { difficulte: v })}
                        />
                      </View>

                      <View style={{ zIndex: 400 - i * 10, marginTop: 8 }}>
                        <Text style={modal.label}>Priorite</Text>
                        <Dropdown
                          placeholder="Choisir"
                          options={PRIORITES_OPT}
                          value={m.priorite}
                          onChange={v => updateMission(i, { priorite: v })}
                        />
                      </View>

                      {/* Date + Heure limite */}
                      <Text style={[modal.label, { marginTop: 8 }]}>Date et heure limite</Text>
                      <MissionDateTimePicker
                        date={m.date_limite}
                        onConfirm={d => updateMission(i, { date_limite: d })}
                      />

                      <TouchableOpacity style={modal.deleteMissionBtn} onPress={() => deleteMission(i)}>
                        <Text style={modal.deleteMissionText}>Supprimer cette mission</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}

            <TouchableOpacity style={modal.addMissionBtn} onPress={addMission}>
              <Text style={modal.addMissionText}>Ajouter une mission</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[modal.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={modal.saveBtnText}>Enregistrer les modifications</Text>
              }
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── DefiScreen ───────────────────────────────────────────────────────────────
export default function DefiScreen() {
  const router     = useRouter();
  const { userId } = useUser();

  const [activeTab,    setActiveTab]    = useState<TabKey>("mes_defis");
  const [defis,        setDefis]        = useState<Defi[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [editingDefi,  setEditingDefi]  = useState<Defi | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  // Filtrage reactif via useMemo — pas de state "filtered" séparé
  const filtered = React.useMemo(() => {
    if (!search.trim()) return defis;
    const q = search.toLowerCase().trim();
    return defis.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.subtitle.toLowerCase().includes(q)
    );
  }, [search, defis]);

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 55, friction: 9 }).start();
  }, []);

  // Reset search + reload quand on change d'onglet
  useEffect(() => {
    setSearch("");
    loadDefis();
  }, [activeTab]);

  const calculerProgression = async (id_defi: number): Promise<number> => {
  // 1. Récupère toutes les missions du défi
  const { data: missions } = await supabase
    .from("mission")
    .select("id_mission")
    .eq("id_defi", id_defi)

  if (!missions || missions.length === 0) return 0

  const missionIds = missions.map((m: any) => m.id_mission)

  // 2. Compte combien ont au moins une validation 'done' (peu importe qui)
  const { data: validations } = await supabase
    .from("mission_validation")
    .select("id_mission")
    .eq("statut", "done")
    .in("id_mission", missionIds)

  // 3. Compter les missions uniques complétées (éviter les doublons si plusieurs users)
  const missionsDone = new Set((validations ?? []).map((v: any) => v.id_mission))
  
  return Math.round((missionsDone.size / missions.length) * 100)
}

 // ✅ Plus simple et fiable
const getNbParticipants = async (id_defi: number): Promise<number> => {
  const { data } = await supabase
    .from("defi_participants")
    .select("id_user")
    .eq("id_defi", id_defi)

  return Math.max(1, (data ?? []).length)
}

  const loadDefis = useCallback(async () => {
    setLoading(true);
    const statutMap: Record<TabKey, string> = {
      mes_defis:  "actif",
      en_attente: "en_attente",
      termine:    "termine",
    };
    const { data, error } = await getDefisByStatut(userId ?? 1, statutMap[activeTab]);
    if (!error && data) {
      const enriched: Defi[] = await Promise.all(
  data.map(async (d: any) => {
    const [progression, participants] = await Promise.all([
      calculerProgression(d.id_defi),
      getNbParticipants(d.id_defi),
    ])
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
      isInvite:         d.id_user !== userId,  // ✅ pas le créateur = invité
    }
  })
);
      setDefis(enriched);
    } else {
      setDefis([]);
    }
    setLoading(false);
  }, [activeTab, userId]);

  const handleDelete = (id: number) => {
    Alert.alert("Supprimer", "Veux-tu vraiment supprimer ce defi ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          const { error } = await deleteDefi(id);
          if (!error) setDefis(prev => prev.filter(d => d.id !== id));
          else Alert.alert("Erreur", "Impossible de supprimer ce defi.");
        },
      },
    ]);
  };

  const handleEdit = (defi: Defi) => {
  console.log("✏️ handleEdit defi =", JSON.stringify(defi))  // ← ajoute ça
  setEditingDefi(defi)
  setModalVisible(true)
}

  const handleSaved = (updatedDefi: Defi) => {
    setDefis(prev => prev.map(d => d.id === updatedDefi.id ? updatedDefi : d));
  };

  // Navigation vers ProgressionDefiScreen
  const handlePress = (defi: Defi) => {
    router.push({
      pathname: "/frontend/screens/ProgressionDefis",
      params: {
        defiId:   String(defi.id),
        defiNom:  defi.title,
        defiDesc: defi.subtitle,
      },
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <Animated.View style={[styles.topIcons, {
        opacity:   headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-16,0] }) }],
      }]}>
        <NotifIcone onPress={() => {
  console.log("CLICK NOTIF");
  router.push("/frontend/screens/NotificationsScreen");
}} />
        <SettingIcone onPress={() => console.log("Settings")} />
      </Animated.View>

      <Sparkles />

      <Animated.View style={[styles.searchContainer, {
        opacity:   headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-10,0] }) }],
      }]}>
        <SearchBar value={search} onChange={setSearch} />
      </Animated.View>

      <TabBar active={activeTab} onSelect={setActiveTab} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "mes_defis" && (
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Tes defis actifs</Text>
              <Text style={styles.sectionSubtitle}>
                {filtered.length} defi{filtered.length !== 1 ? "s" : ""} en cours
              </Text>
            </View>
            <TouchableOpacity style={styles.refreshIconBtn} onPress={loadDefis}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path d="M1 4v6h6M23 20v-6h-6"
                  stroke={COLORS.primary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
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
            <Text style={styles.emptyTitle}>
              {search.trim() ? "Aucun resultat" : "Aucun defi ici"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search.trim()
                ? `Aucun defi ne correspond a "${search}"`
                : activeTab === "mes_defis"
                  ? "Lance ton premier defi !"
                  : "Cette section est vide pour l'instant."}
            </Text>
          </View>
        ) : (
          filtered.map((d, i) => (
            <DefiCard
              key={d.id}
              defi={d}
              index={i}
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
  onPress={() => router.push("/frontend/screens/DefisStat")}
>
  <Text style={styles.ctaBtnText}>Lancer un nouveau defi</Text>
</TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Navbar active="defis" onChange={() => {}} />

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
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 20 : 16,
    paddingHorizontal: SIZES.padding, paddingBottom: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.background,
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

  label:      { fontSize: 11, fontWeight: "700", color: COLORS.textLight, marginBottom: 5, marginTop: 10 },
  input: {
    backgroundColor: COLORS.card, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: COLORS.text, ...SHADOWS.light,
  },
  inputMulti: { minHeight: 64, textAlignVertical: "top" },
  row2:       { flexDirection: "row", gap: 8 },

  // DatePickerBtn (defi)
  dateBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.card, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    minHeight: 38, ...SHADOWS.light,
  },
  dateBtnText:       { fontSize: 12, color: COLORS.textLight, fontWeight: "500", flex: 1 },
  dateBtnTextFilled: { color: COLORS.primary, fontWeight: "700" },

  // MissionDateTimePicker
  dateTimeRow:     { flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 2 },
  dateTimeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.card, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 9, ...SHADOWS.light,
  },
  dateTimeBtnText: { fontSize: 11, color: COLORS.primary, fontWeight: "600", flex: 1 },
  dateSummary: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: `${COLORS.primary}15`, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7, marginTop: 4,
  },
  dateSummaryText: { fontSize: 11, color: COLORS.primary, fontWeight: "700" },

  // Date modal partagé (iOS)
  dateModalOverlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  dateModalCard:        { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  dateModalTitle:       { fontSize: 16, fontWeight: "800", color: "#17063B", textAlign: "center", marginBottom: 10 },
  dateModalActions:     { flexDirection: "row", gap: 12, marginTop: 16 },
  dateModalCancel:      { flex: 1, paddingVertical: 14, borderRadius: 32, alignItems: "center", borderWidth: 2, borderColor: "rgba(180,160,220,0.5)" },
  dateModalCancelText:  { fontSize: 14, fontWeight: "700", color: "rgba(100,70,160,0.7)" },
  dateModalConfirm:     { flex: 2, paddingVertical: 14, borderRadius: 32, alignItems: "center", backgroundColor: COLORS.primary },
  dateModalConfirmText: { fontSize: 14, fontWeight: "800", color: "#fff" },

  // Dropdown
  dropBtn:              { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                          borderRadius: 10, backgroundColor: COLORS.card,
                          paddingHorizontal: 12, paddingVertical: 10, minHeight: 38, ...SHADOWS.light },
  dropBtnOpen:          { borderWidth: 1, borderColor: COLORS.primary },
  dropValue:            { fontSize: 13, fontWeight: "600", color: COLORS.text, flex: 1 },
  dropPlaceholder:      { color: COLORS.textLight, fontWeight: "500" },
  dropMenu: {
    position: "absolute", top: 40, left: 0, right: 0,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: 10, zIndex: 9999,
    shadowColor: COLORS.primary, shadowOpacity: 0.15, shadowRadius: 10, elevation: 20,
  },
  dropOption:             { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.background },
  dropOptionSelected:     { backgroundColor: `${COLORS.primary}12` },
  dropOptionText:         { fontSize: 13, fontWeight: "500", color: COLORS.text },
  dropOptionTextSelected: { color: COLORS.primary, fontWeight: "700" },

  // Icon picker
  iconRow:          { flexDirection: "row", gap: 8, marginBottom: 4 },
  iconOpt:          { flex: 1, alignItems: "center", paddingVertical: 8, backgroundColor: COLORS.card,
                      borderRadius: 10, borderWidth: 2, borderColor: "transparent", ...SHADOWS.light },
  iconOptActive:    { borderColor: COLORS.primary },
  iconCircle:       { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.textLight + "33",
                      alignItems: "center", justifyContent: "center", marginBottom: 3 },
  iconCircleActive: { backgroundColor: COLORS.secondary },
  iconLabel:        { fontSize: 10, color: COLORS.textLight, fontWeight: "600", textAlign: "center" },
  iconLabelActive:  { color: COLORS.primary, fontWeight: "700" },

  // Statut buttons
  statutBtn:       { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.card,
                     alignItems: "center", borderWidth: 2, borderColor: "transparent", ...SHADOWS.light },
  statutBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "18" },
  statutBtnText:   { fontSize: 11, color: COLORS.textLight, fontWeight: "600" },
  statutTextActive:{ color: COLORS.primary, fontWeight: "700" },

  emptyMissions: { color: COLORS.textLight, textAlign: "center", paddingVertical: 16, fontSize: 13 },

  // Mission cards
  missionCard:      { backgroundColor: COLORS.card, borderRadius: 12, marginBottom: 8, overflow: "hidden", ...SHADOWS.light },
  missionHeader:    { flexDirection: "row", alignItems: "center", padding: 10, gap: 8 },
  missionBadge:     { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  missionBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  missionTitle:     { fontSize: 13, fontWeight: "700", color: COLORS.text },
  missionMeta:      { fontSize: 11, color: COLORS.textLight, marginTop: 1 },
  chevron:          { fontSize: 11, color: COLORS.textLight },
  missionBody:      { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: COLORS.background },

  deleteMissionBtn:  { marginTop: 10, paddingVertical: 8, backgroundColor: "#FFF0F0", borderRadius: 8, alignItems: "center" },
  deleteMissionText: { color: "#EF4444", fontSize: 12, fontWeight: "700" },

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
  screen:           { flex: 1, backgroundColor: COLORS.background },
  topIcons:         { flexDirection: "row", justifyContent: "flex-end",
                      paddingTop: Platform.OS === "android" ? 44 : 58,
                      paddingHorizontal: SIZES.padding, gap: 8 },
  sparklesSvg:      { position: "absolute", top: 0, left: 0 },
  searchContainer:  { paddingHorizontal: SIZES.padding, marginTop: 10, marginBottom: 4 },
  searchWrapper:    { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card,
                      borderRadius: SIZES.radiusFull, paddingHorizontal: 14, paddingVertical: 10, ...SHADOWS.light },
  searchIcon:       { marginRight: 8 },
  searchInput:      { flex: 1, fontSize: 15, color: COLORS.text, padding: 0 },
  tabBar:           { flexDirection: "row", marginHorizontal: SIZES.padding, marginTop: 14,
                      backgroundColor: COLORS.card, borderRadius: SIZES.radiusFull, padding: 4, ...SHADOWS.light },
  tabItem:          { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: SIZES.radiusFull },
  tabItemActive:    { backgroundColor: COLORS.primary, ...SHADOWS.purple },
  tabLabel:         { fontSize: 13, fontWeight: "600", color: COLORS.textLight },
  tabLabelActive:   { color: COLORS.white, fontWeight: "700" },
  scroll:           { flex: 1 },
  scrollContent:    { paddingHorizontal: SIZES.padding, paddingTop: 20, paddingBottom: 120 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle:     { fontSize: 20, fontWeight: "800", color: COLORS.text },
  sectionSubtitle:  { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  refreshIconBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card,
                      alignItems: "center", justifyContent: "center", ...SHADOWS.light },
  loadingWrap:      { paddingVertical: 60, alignItems: "center", gap: 12 },
  loadingText:      { fontSize: 14, color: COLORS.textLight, fontWeight: "600" },
  card:             { backgroundColor: COLORS.card, borderRadius: SIZES.radiusLg, marginBottom: 14,
                      overflow: "hidden", ...SHADOWS.medium },
  cardTagRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                      paddingHorizontal: 12, paddingTop: 10 },
  cardDateLabel:    { fontSize: 11, color: COLORS.textLight, fontWeight: "600" },
  cardInner:        { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 12,
                      paddingBottom: 10, gap: 10, marginTop: 8 },
  cardIconWrapper:  { marginTop: 2 },
  cardIconCircle:   { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.secondary,
                      alignItems: "center", justifyContent: "center", ...SHADOWS.purple },
  cardContent:      { flex: 1 },
  cardTitle:        { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 3 },
  cardSubtitle:     { fontSize: 11, color: COLORS.textLight, lineHeight: 15, marginBottom: 8 },
  avatarRow:        { flexDirection: "row", alignItems: "center" },
  avatar:           { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: COLORS.card,
                      alignItems: "center", justifyContent: "flex-end", overflow: "hidden" },
  avatarHead:       { width: 14, height: 14, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.7)", marginBottom: 1 },
  avatarBody:       { width: 20, height: 12, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: "rgba(255,255,255,0.5)" },
  moreParticipants: { width: 32, height: 32, borderRadius: 16, marginLeft: -10, zIndex: 1,
                      backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
                      borderWidth: 2, borderColor: COLORS.card },
  moreParticipantsText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  cardRight:        { alignItems: "flex-end", gap: 4, paddingTop: 2 },
  xpBadge:          { backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull, paddingHorizontal: 10, paddingVertical: 4 },
  xpText:           { color: COLORS.white, fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  cardDuration:     { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  cardObjectif:     { fontSize: 10, color: COLORS.textLight, fontWeight: "600" },
  cardProgressTrack:{ height: 5, backgroundColor: COLORS.progressBg, marginHorizontal: 12, borderRadius: 3, overflow: "hidden" },
  cardProgressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 3 },
  cardProgressLabel:{ fontSize: 10, color: COLORS.textLight, textAlign: "right",
                      paddingHorizontal: 12, paddingBottom: 4, marginTop: 2 },
  cardActionsBottom:{ flexDirection: "row", justifyContent: "flex-end",
                      paddingHorizontal: 12, paddingBottom: 10, gap: 10 },
  actionIconBtn:    { width: 30, height: 30, borderRadius: 8, backgroundColor: "rgba(120,90,180,0.07)",
                      alignItems: "center", justifyContent: "center" },
  statutPill:       { borderRadius: SIZES.radiusFull, paddingHorizontal: 10, paddingVertical: 3 },
  statutPillText:   { color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 0.2 },
  emptyContainer:   { paddingVertical: 60, alignItems: "center", gap: 10 },
  emptyTitle:       { fontSize: 18, fontWeight: "800", color: COLORS.text },
  emptySubtitle:    { fontSize: 13, color: COLORS.textLight, textAlign: "center", lineHeight: 18 },
  ctaBtn:           { width: "100%", backgroundColor: COLORS.primary, borderRadius: SIZES.radiusFull,
                      paddingVertical: 16, alignItems: "center", marginTop: 10, ...SHADOWS.purple },
  ctaBtnText:       { color: COLORS.white, fontSize: 16, fontWeight: "800", letterSpacing: 0.4 },
// Dans styles = StyleSheet.create({...})
inviteBadge: {
  borderRadius: SIZES.radiusFull,
  paddingHorizontal: 12,
  paddingVertical: 4,
  backgroundColor: `${COLORS.primary}15`,
  borderWidth: 1.5,
  borderColor: `${COLORS.primary}40`,
},
inviteBadgeText: {
  color: COLORS.primary,
  fontSize: 10,
  fontWeight: '800',
  letterSpacing: 0.3,
},
});