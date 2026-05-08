import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Dimensions, FlatList, StyleSheet, Text,
  TouchableOpacity, View, ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";

import BackButton from "../components/BackButton";
import ChangeAvatarModal from "../components/ChangeAvatarModal";
import ResultModal from "../components/ResultModal";
import WaveBackground from "../components/waveBackground";
import Navbar from "../components/Navbar";
import CoinPrice from "../components/CoinPrice";

import { supabase } from "../constants/supabase";
import { useUser } from "../constants/UserContext";
import { useAvatar } from "../constants/AvatarContext";
import { AVATAR_MAP, resolveAvatarModel } from "../constants/avatarMap";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width / 3) - 16;

// ─── Liste complète — féminin + masculin ──────────────────────────────────────
const AVATARS_STATIC_ALL = [
  // ── Boutique Féminin ──
  { id: "f1", avatarKey: "avatar_boutique_f_1", price: 50,   itemId: 1,  gender: "Feminin"  },
  { id: "f2", avatarKey: "avatar_boutique_f_2", price: 30,   itemId: 2,  gender: "Feminin"  },
  { id: "f3", avatarKey: "avatar_boutique_f_3", price: 1200, itemId: 3,  gender: "Feminin"  },
  { id: "f4", avatarKey: "avatar_boutique_f_4", price: 40,   itemId: 4,  gender: "Feminin"  },
  { id: "f5", avatarKey: "avatar_boutique_f_5", price: 100,  itemId: 5,  gender: "Feminin"  },
  { id: "f6", avatarKey: "avatar_boutique_f_6", price: 250,  itemId: 6,  gender: "Feminin"  },
  { id: "f7", avatarKey: "avatar_boutique_f_7", price: 900,  itemId: 7,  gender: "Feminin"  },
  { id: "f8", avatarKey: "avatar_boutique_f_8", price: 1100, itemId: 8,  gender: "Feminin"  },
  { id: "f9", avatarKey: "avatar_boutique_f_9", price: 1300, itemId: 9,  gender: "Feminin"  },
  // ── Boutique Masculin ──
  { id: "m1", avatarKey: "avatar_boutique_m_1", price: 50,   itemId: 10, gender: "Masculin" },
  { id: "m2", avatarKey: "avatar_boutique_m_2", price: 30,   itemId: 11, gender: "Masculin" },
  { id: "m3", avatarKey: "avatar_boutique_m_3", price: 1200, itemId: 12, gender: "Masculin" },
  { id: "m4", avatarKey: "avatar_boutique_m_4", price: 40,   itemId: 13, gender: "Masculin" },
  { id: "m5", avatarKey: "avatar_boutique_m_5", price: 100,  itemId: 14, gender: "Masculin" },
  { id: "m6", avatarKey: "avatar_boutique_m_6", price: 250,  itemId: 15, gender: "Masculin" },
  { id: "m7", avatarKey: "avatar_boutique_m_7", price: 900,  itemId: 16, gender: "Masculin" },
  { id: "m8", avatarKey: "avatar_boutique_m_8", price: 1100, itemId: 17, gender: "Masculin" },
  { id: "m9", avatarKey: "avatar_boutique_m_9", price: 1300, itemId: 18, gender: "Masculin" },
];

// ─── Noms & descriptions par id ───────────────────────────────────────────────
const AVATAR_DETAILS: Record<string, { name: string; description: string }> = {
  f1: { name: "Léa",    description: "Douce et rêveuse."       },
  f2: { name: "Chloé",  description: "Pétillante et sportive." },
  f3: { name: "Mia",    description: "Passionnée par l'art."   },
  f4: { name: "Sarah",  description: "Curieuse de tout."       },
  f5: { name: "Jade",   description: "Un style unique."        },
  f6: { name: "Emma",   description: "La joie de vivre."       },
  f7: { name: "Inès",   description: "Calme et réfléchie."     },
  f8: { name: "Lina",   description: "Pleine d'énergie."       },
  f9: { name: "Sophie", description: "Douée en sciences."      },
  m1: { name: "Axel",   description: "Courageux et direct."    },
  m2: { name: "Noah",   description: "Sportif et compétitif."  },
  m3: { name: "Lucas",  description: "Créatif et curieux."     },
  m4: { name: "Tom",    description: "Toujours prêt."          },
  m5: { name: "Léo",    description: "Stratège né."            },
  m6: { name: "Hugo",   description: "Calme et posé."          },
  m7: { name: "Théo",   description: "Plein d'humour."         },
  m8: { name: "Enzo",   description: "Vif et déterminé."       },
  m9: { name: "Maxime", description: "Leader naturel."         },
};

// ─── Éclairage partagé ────────────────────────────────────────────────────────
const LIGHTING_SCRIPT = `
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 1.05;
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  scene.add(new THREE.HemisphereLight(0xffffff, 0xfff0e0, 0.8));
  const front = new THREE.DirectionalLight(0xffffff, 1.8);
  front.position.set(0, 2, 5); scene.add(front);
  const fill = new THREE.DirectionalLight(0xfff5ee, 0.9);
  fill.position.set(-3, 1, 2); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xddeeff, 1.1);
  rim.position.set(2, 3, -4); scene.add(rim);
`;

// ─── Renderer statique ────────────────────────────────────────────────────────
const AvatarRendererStatic = React.memo(
  ({ model, grayscale = false }: { model: any; grayscale?: boolean }) => {
    const [base64, setBase64] = useState<string | null>(null);

    useEffect(() => {
      let ok = true;
      (async () => {
        try {
          const a = Asset.fromModule(model);
          await a.downloadAsync();
          const b = await FileSystem.readAsStringAsync(a.localUri!, { encoding: "base64" as any });
          if (ok) setBase64(b);
        } catch (e) { console.error(e); }
      })();
      return () => { ok = false; };
    }, [model]);

    const html = useMemo(() => {
      if (!base64) return "";
      return `<html><head><style>body{margin:0;background:#F8F9FF;overflow:hidden;filter:${grayscale ? "grayscale(1) brightness(0.65)" : "none"}}canvas{width:100vw;height:100vh;display:block}</style></head><body>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
        <script>
          const scene=new THREE.Scene();scene.background=new THREE.Color(0xF8F9FF);
          const camera=new THREE.PerspectiveCamera(40,window.innerWidth/window.innerHeight,0.1,100);
          const renderer=new THREE.WebGLRenderer({antialias:true});
          renderer.setSize(window.innerWidth,window.innerHeight);document.body.appendChild(renderer.domElement);
          ${LIGHTING_SCRIPT}
          const bytes=new Uint8Array(atob('${base64}').split('').map(c=>c.charCodeAt(0)));
          new THREE.GLTFLoader().parse(bytes.buffer,'',(gltf)=>{
            const model=gltf.scene;
            const box=new THREE.Box3().setFromObject(model);
            const center=box.getCenter(new THREE.Vector3());
            const size=box.getSize(new THREE.Vector3());
            model.position.sub(center);
            camera.position.set(0,0,(size.y/2)/Math.tan((40*Math.PI/180)/2)*1.35);
            scene.add(model);renderer.render(scene,camera);
          });
        </script></body></html>`;
    }, [base64, grayscale]);

    if (!base64) return <ActivityIndicator size="small" color="#765EFF" />;
    return (
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={{ backgroundColor: "transparent" }}
        javaScriptEnabled
        scrollEnabled={false}
      />
    );
  }
);

// ─── Renderer rotatif ────────────────────────────────────────────────────────
const AvatarRendererRotating = React.memo(({ model }: { model: any }) => {
  const [base64, setBase64] = useState<string | null>(null);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const a = Asset.fromModule(model);
        await a.downloadAsync();
        const b = await FileSystem.readAsStringAsync(a.localUri!, { encoding: "base64" as any });
        if (ok) setBase64(b);
      } catch (e) { console.error(e); }
    })();
    return () => { ok = false; };
  }, [model]);

  const html = useMemo(() => {
    if (!base64) return "";
    return `<html><head><style>body{margin:0;background:#ffffff;overflow:hidden}canvas{width:100vw;height:100vh;display:block}</style></head><body>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
      <script>
        const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
        const camera=new THREE.PerspectiveCamera(40,window.innerWidth/window.innerHeight,0.1,100);
        const renderer=new THREE.WebGLRenderer({antialias:true});
        renderer.setSize(window.innerWidth,window.innerHeight);document.body.appendChild(renderer.domElement);
        ${LIGHTING_SCRIPT}
        const bytes=new Uint8Array(atob('${base64}').split('').map(c=>c.charCodeAt(0)));
        new THREE.GLTFLoader().parse(bytes.buffer,'',(gltf)=>{
          const model=gltf.scene;
          const box=new THREE.Box3().setFromObject(model);
          const center=box.getCenter(new THREE.Vector3());
          const size=box.getSize(new THREE.Vector3());
          model.position.sub(center);
          camera.position.set(0,0,(size.y/2)/Math.tan((40*Math.PI/180)/2)*1.35);
          scene.add(model);
          function anim(){requestAnimationFrame(anim);model.rotation.y+=0.02;renderer.render(scene,camera);}
          anim();
        });
      </script></body></html>`;
  }, [base64]);

  if (!base64) return <ActivityIndicator size="small" color="#765EFF" />;
  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      style={{ backgroundColor: "transparent" }}
      javaScriptEnabled
      scrollEnabled={false}
    />
  );
});

// ─── Types ────────────────────────────────────────────────────────────────────
type AvatarItem = {
  id: string;
  avatarKey: string;
  price: number;
  itemId: number;
  gender: string;
  model: any;
  owned: boolean;
  active: boolean;
};

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function BoutiqueScreen() {
  const { userId, gender } = useUser(); // ✅ gender lu depuis le contexte global
  const { setSelectedModel } = useAvatar();

  const [activeTab, setActiveTab]     = useState<"mes_avatars" | "boutique">("mes_avatars");
  const [userCoins, setUserCoins]     = useState(0);
  const [avatarsData, setAvatarsData] = useState<AvatarItem[]>([]);
  const [loading, setLoading]         = useState(true);

  const [selectedAvatar, setSelectedAvatar]         = useState<any>(null);
  const [resultVisible, setResultVisible]           = useState(false);
  const [modalType, setModalType]                   = useState<"success" | "error">("success");
  const [changeModalVisible, setChangeModalVisible] = useState(false);

  const [modalCoins, setModalCoins]           = useState(0);
  const [modalNewBalance, setModalNewBalance] = useState(0);

  // ✅ Filtre la liste complète selon le genre de l'utilisateur connecté
  // Si genre non défini (edge case), on affiche tout
  const AVATARS_STATIC = useMemo(
    () =>
      gender
        ? AVATARS_STATIC_ALL.filter((a) => a.gender === gender)
        : AVATARS_STATIC_ALL,
    [gender]
  );

  // ── Chargement Supabase ───────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: user } = await supabase
        .from("users")
        .select("gold, avatar_url")
        .eq("id_user", userId)
        .single();

      const { data: ownedItems } = await supabase
        .from("user_items")
        .select("id_item")
        .eq("id_user", userId);

      const ownedIds        = new Set((ownedItems ?? []).map((i: any) => i.id_item));
      const activeAvatarKey = user?.avatar_url ?? null;

      const enriched: AvatarItem[] = AVATARS_STATIC.map((a) => ({
        ...a,
        model:  AVATAR_MAP[a.avatarKey] ?? AVATAR_MAP["avatar_1"],
        owned:  ownedIds.has(a.itemId),
        active: a.avatarKey === activeAvatarKey,
      }));

      setUserCoins(user?.gold ?? 0);
      setAvatarsData(enriched);
    } catch (e) {
      console.error("loadData error:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, AVATARS_STATIC]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // ── Achat ────────────────────────────────────────────────────────────────
  const handleBuyPress = useCallback(async (item: AvatarItem) => {
    if (!userId) return;

    const snapshotCoins = userCoins;
    setSelectedAvatar({ ...item, ...AVATAR_DETAILS[item.id] });
    setModalCoins(snapshotCoins);

    if (snapshotCoins < item.price) {
      setModalNewBalance(snapshotCoins);
      setModalType("error");
      setResultVisible(true);
      return;
    }

    try {
      const { error: goldError } = await supabase
        .from("users")
        .update({ gold: snapshotCoins - item.price })
        .eq("id_user", userId);
      if (goldError) throw goldError;

      await supabase
        .from("user_items")
        .upsert({ id_user: userId, id_item: item.itemId, quantite: 1 });

      const after = snapshotCoins - item.price;

      setUserCoins(after);
      setAvatarsData((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, owned: true } : a))
      );
      setModalNewBalance(after);
      setModalType("success");
      setResultVisible(true);
    } catch (e) {
      console.error("Achat échoué:", e);
      setModalNewBalance(snapshotCoins);
      setModalType("error");
      setResultVisible(true);
    }
  }, [userId, userCoins]);

  // ── Choisir avatar actif ─────────────────────────────────────────────────
  const handleChangePress = useCallback((item: AvatarItem) => {
    setSelectedAvatar({ ...item, ...AVATAR_DETAILS[item.id] });
    setChangeModalVisible(true);
  }, []);

  const handleConfirmChange = useCallback(async () => {
    if (!userId || !selectedAvatar) return;
    try {
      await supabase
        .from("users")
        .update({ avatar_url: selectedAvatar.avatarKey })
        .eq("id_user", userId);

      setSelectedModel(resolveAvatarModel(selectedAvatar.avatarKey));
      setAvatarsData((prev) =>
        prev.map((a) => ({ ...a, active: a.id === selectedAvatar.id }))
      );
    } catch (e) {
      console.error("Changement avatar échoué:", e);
    } finally {
      setChangeModalVisible(false);
    }
  }, [userId, selectedAvatar, setSelectedModel]);

  // ── Dérivés ───────────────────────────────────────────────────────────────
  const ownedCount   = useMemo(() => avatarsData.filter((a) => a.owned).length,  [avatarsData]);
  const activeAvatar = useMemo(() => avatarsData.find((a) => a.active),           [avatarsData]);

  // ── Rendu carte ───────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: AvatarItem }) => {
      const isBoutique = activeTab === "boutique";
      const isLocked   = !item.owned && !isBoutique;
      const details    = AVATAR_DETAILS[item.id];

      return (
        <View style={[styles.card, isLocked && styles.cardLocked]}>
          {!isBoutique && (
            <>
              {item.active ? (
                <View style={[styles.statusBadge, styles.badgeActive]}>
                  <Text style={styles.badgeText}>Actif</Text>
                </View>
              ) : item.owned ? (
                <View style={[styles.statusBadge, styles.badgeOwned]}>
                  <Text style={styles.badgeText}>Possédé</Text>
                </View>
              ) : null}
              {isLocked && (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={12} color="white" />
                </View>
              )}
            </>
          )}

          <View style={styles.avatarContainer}>
            <AvatarRendererStatic model={item.model} grayscale={isLocked} />
            {item.active && !isBoutique && (
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#765EFF" />
              </View>
            )}
          </View>

          <Text style={styles.itemName}>{details?.name ?? "Avatar"}</Text>
          <Text style={styles.itemDesc} numberOfLines={1}>{details?.description ?? ""}</Text>

          {isBoutique ? (
            item.owned ? (
              <View style={[styles.chooseBtn, { backgroundColor: "#81D4FA" }]}>
                <Text style={styles.chooseBtnText}>✓ Possédé</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => handleBuyPress(item)}>
                <CoinPrice price={item.price} label="Acheter" iconSize={8} />
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity
              style={[styles.chooseBtn, item.active && styles.chooseBtnActive]}
              onPress={() => !item.active && !isLocked && handleChangePress(item)}
              disabled={isLocked || item.active}
            >
              <Text style={styles.chooseBtnText}>{item.active ? "✓" : "Choisir"}</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [activeTab, handleBuyPress, handleChangePress]
  );

  if (loading) {
    return (
      <LinearGradient colors={["#F0F4FF", "#FFFFFF"]} style={styles.container}>
        <ActivityIndicator size="large" color="#765EFF" style={{ flex: 1 }} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#F0F4FF", "#FFFFFF"]} style={styles.container}>
      <WaveBackground />

      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>Ma boutique</Text>
        <CoinPrice
          price={userCoins.toLocaleString()}
          colors={["#5A4C91", "#5A4C91"]}
          iconSize={14}
        />
      </View>

      {/* Avatar actif rotatif */}
      <View style={styles.profileArea}>
        <View style={styles.profileCircle}>
          {activeAvatar
            ? <AvatarRendererRotating model={activeAvatar.model} />
            : <ActivityIndicator color="#765EFF" />
          }
        </View>
      </View>

      {/* Onglets */}
      <View style={styles.tabsWrapper}>
        <View style={styles.tabsPill}>
          {(["mes_avatars", "boutique"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab)}
            >
              <LinearGradient
                colors={
                  activeTab === tab
                    ? ["#BAAAE7", "#6949A8"]
                    : ["transparent", "transparent"]
                }
                style={styles.tabGradient}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === "mes_avatars" ? "Mes avatars" : "Boutique"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.counterText}>
        {ownedCount}/{avatarsData.length} avatars disponibles
      </Text>

      <FlatList
        data={avatarsData}
        renderItem={renderItem}
        keyExtractor={(item) => `item-${activeTab}-${item.id}`}
        numColumns={3}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {activeTab === "mes_avatars" && (
        <View style={styles.fixedFooter}>
          <View style={styles.footerFrame}>
            <Text style={styles.footerTitle}>Débloque plus d'avatars</Text>
            <Text style={styles.footerSub}>Rends ta collection unique !</Text>
            <TouchableOpacity
              style={styles.footerBtn}
              onPress={() => setActiveTab("boutique")}
            >
              <LinearGradient colors={["#BAAAE7", "#6949A8"]} style={styles.footerBtnGradient}>
                <Text style={styles.footerBtnText}>Aller à la boutique</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ChangeAvatarModal
        visible={changeModalVisible}
        avatar={selectedAvatar}
        onClose={() => setChangeModalVisible(false)}
        onConfirm={handleConfirmChange}
      />

      <ResultModal
        visible={resultVisible}
        type={modalType}
        avatarName={selectedAvatar?.name}
        avatarPrice={selectedAvatar?.price ?? 0}
        userCoins={modalCoins}
        newBalance={modalNewBalance}
        onClose={() => setResultVisible(false)}
      />

      <Navbar active="shop" onChange={() => {}} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1 },
  header:            { marginTop: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  title:             { fontSize: 20, fontWeight: "bold", color: "#5A4C91" },
  profileArea:       { alignItems: "center", marginVertical: 10 },
  profileCircle:     { width: 90, height: 90, borderRadius: 45, backgroundColor: "white", elevation: 5, overflow: "hidden", borderWidth: 2, borderColor: "#BAAAE7" },
  tabsWrapper:       { paddingHorizontal: 40, marginBottom: 10 },
  tabsPill:          { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 25, padding: 3 },
  tabItem:           { flex: 1 },
  tabGradient:       { paddingVertical: 8, borderRadius: 22, alignItems: "center" },
  tabText:           { fontWeight: "bold", color: "#5A4C91", fontSize: 13 },
  tabTextActive:     { color: "white" },
  counterText:       { textAlign: "center", color: "#5A4C91", fontWeight: "bold", marginBottom: 10 },
  list:              { paddingHorizontal: 10, paddingBottom: 220 },
  card:              { width: CARD_WIDTH, backgroundColor: "#F8F9FF", borderRadius: 15, padding: 8, margin: 5, alignItems: "center", elevation: 2 },
  cardLocked:        { backgroundColor: "#D1D1D1" },
  statusBadge:       { position: "absolute", top: 6, left: 6, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, zIndex: 10 },
  badgeActive:       { backgroundColor: "#66BB6A" },
  badgeOwned:        { backgroundColor: "#81D4FA" },
  badgeText:         { color: "white", fontSize: 7, fontWeight: "bold" },
  lockBadge:         { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 10, padding: 3, zIndex: 10 },
  avatarContainer:   { width: 65, height: 65, backgroundColor: "white", borderRadius: 12, overflow: "hidden", marginBottom: 5 },
  checkIcon:         { position: "absolute", bottom: -5, right: -5 },
  itemName:          { fontSize: 11, fontWeight: "bold", color: "#333" },
  itemDesc:          { fontSize: 8, color: "#777", marginBottom: 6, textAlign: "center" },
  chooseBtn:         { backgroundColor: "#BAAAE7", paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12 },
  chooseBtnActive:   { backgroundColor: "#6949A8" },
  chooseBtnText:     { color: "white", fontSize: 10, fontWeight: "bold" },
  fixedFooter:       { position: "absolute", bottom: 100, left: 20, right: 20 },
  footerFrame:       { backgroundColor: "rgba(235, 231, 255, 0.9)", borderRadius: 20, padding: 15, alignItems: "center", borderWidth: 1, borderColor: "white" },
  footerTitle:       { fontSize: 16, fontWeight: "900", color: "#5A4C91" },
  footerSub:         { fontSize: 11, color: "#555", marginBottom: 10 },
  footerBtn:         { width: "80%", borderRadius: 20, overflow: "hidden" },
  footerBtnGradient: { paddingVertical: 10, alignItems: "center" },
  footerBtnText:     { color: "white", fontWeight: "bold", fontSize: 12 },
});