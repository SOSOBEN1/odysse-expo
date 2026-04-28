import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

import BackButton from "../components/BackButton";
import ChangeAvatarModal from "../components/ChangeAvatarModal";
import ResultModal from "../components/ResultModal";
import WaveBackground from "../components/waveBackground";
import Navbar from "../components/Navbar";
import CoinPrice from "../components/CoinPrice";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width / 3) - 16;

const avatarDetails: { [key: string]: { name: string; description: string } } = {
  '1': { name: 'Léa',   description: 'Douce et rêveuse.'        },
  '2': { name: 'Chloé', description: 'Pétillante et sportive.'  },
  '3': { name: 'Mia',   description: "Passionnée par l'art."    },
  '4': { name: 'Sarah', description: 'Curieuse de tout.'        },
  '5': { name: 'Jade',  description: 'Un style unique.'         },
  '6': { name: 'Emma',  description: 'La joie de vivre.'        },
  '7': { name: 'Inès',  description: 'Calme et réfléchie.'      },
  '8': { name: 'Lina',  description: "Pleine d'énergie."        },
  '9': { name: 'Sophie',description: 'Douée en sciences.'       },
};

// ─── Éclairage Bitmoji-style : couleurs vives, pas surexposé ─────────────────
const LIGHTING_SCRIPT = `
  // Tone mapping doux qui préserve les couleurs saturées
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 1.05;

  // Ambiance de base modérée
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));

  // Hémisphérique : ciel blanc / sol légèrement chaud
  scene.add(new THREE.HemisphereLight(0xffffff, 0xfff0e0, 0.8));

  // Lumière frontale principale — pas trop forte pour garder les couleurs
  const front = new THREE.DirectionalLight(0xffffff, 1.8);
  front.position.set(0, 2, 5);
  scene.add(front);

  // Fill légère côté gauche — douceur sans aplatir
  const fill = new THREE.DirectionalLight(0xfff5ee, 0.9);
  fill.position.set(-3, 1, 2);
  scene.add(fill);

  // Rim light derrière — contour propre style cartoon/Bitmoji
  const rim = new THREE.DirectionalLight(0xddeeff, 1.1);
  rim.position.set(2, 3, -4);
  scene.add(rim);
`;

// ─── Avatar cartes : statique ─────────────────────────────────────────────────
const AvatarRendererStatic = React.memo(({ model, grayscale = false }: { model: any; grayscale?: boolean }) => {
  const [base64, setBase64] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const asset = Asset.fromModule(model);
        await asset.downloadAsync();
        const b64 = await FileSystem.readAsStringAsync(asset.localUri!, { encoding: "base64" as any });
        if (isMounted) setBase64(b64);
      } catch (e) { console.error(e); }
    };
    load();
    return () => { isMounted = false; };
  }, [model]);

  const html = useMemo(() => {
    if (!base64) return "";
    return `
      <html>
      <head>
        <style>
          body {
            margin: 0;
            background: #F8F9FF;
            overflow: hidden;
            filter: ${grayscale ? 'grayscale(1) brightness(0.65)' : 'none'};
          }
          canvas { width: 100vw; height: 100vh; display: block; }
        </style>
      </head>
      <body>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
        <script>
          const scene = new THREE.Scene();
          scene.background = new THREE.Color(0xF8F9FF);

          const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
          const renderer = new THREE.WebGLRenderer({ antialias: true });
          renderer.setSize(window.innerWidth, window.innerHeight);
          document.body.appendChild(renderer.domElement);

          ${LIGHTING_SCRIPT}

          const bytes = new Uint8Array(atob('${base64}').split('').map(c => c.charCodeAt(0)));
          new THREE.GLTFLoader().parse(bytes.buffer, '', (gltf) => {
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            model.position.sub(center);
            camera.position.set(0, 0, (size.y / 2) / Math.tan((40 * Math.PI / 180) / 2) * 1.35);
            scene.add(model);
            // Rendu unique — pas de boucle, pas de rotation
            renderer.render(scene, camera);
          });
        </script>
      </body>
      </html>
    `;
  }, [base64, grayscale]);

  if (!base64) return <ActivityIndicator size="small" color="#765EFF" />;
  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      style={{ backgroundColor: 'transparent' }}
      javaScriptEnabled
      scrollEnabled={false}
    />
  );
});

// ─── Avatar profil en haut : rotation ────────────────────────────────────────
const AvatarRendererRotating = React.memo(({ model }: { model: any }) => {
  const [base64, setBase64] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const asset = Asset.fromModule(model);
        await asset.downloadAsync();
        const b64 = await FileSystem.readAsStringAsync(asset.localUri!, { encoding: "base64" as any });
        if (isMounted) setBase64(b64);
      } catch (e) { console.error(e); }
    };
    load();
    return () => { isMounted = false; };
  }, [model]);

  const html = useMemo(() => {
    if (!base64) return "";
    return `
      <html>
      <head>
        <style>
          body { margin: 0; background: #ffffff; overflow: hidden; }
          canvas { width: 100vw; height: 100vh; display: block; }
        </style>
      </head>
      <body>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
        <script>
          const scene = new THREE.Scene();
          scene.background = new THREE.Color(0xffffff);

          const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
          const renderer = new THREE.WebGLRenderer({ antialias: true });
          renderer.setSize(window.innerWidth, window.innerHeight);
          document.body.appendChild(renderer.domElement);

          ${LIGHTING_SCRIPT}

          const bytes = new Uint8Array(atob('${base64}').split('').map(c => c.charCodeAt(0)));
          new THREE.GLTFLoader().parse(bytes.buffer, '', (gltf) => {
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            model.position.sub(center);
            camera.position.set(0, 0, (size.y / 2) / Math.tan((40 * Math.PI / 180) / 2) * 1.35);
            scene.add(model);
            function anim() {
              requestAnimationFrame(anim);
              model.rotation.y += 0.02;
              renderer.render(scene, camera);
            }
            anim();
          });
        </script>
      </body>
      </html>
    `;
  }, [base64]);

  if (!base64) return <ActivityIndicator size="small" color="#765EFF" />;
  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      style={{ backgroundColor: 'transparent' }}
      javaScriptEnabled
      scrollEnabled={false}
    />
  );
});

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function BoutiqueScreen() {
  const [activeTab, setActiveTab] = useState<'mes_avatars' | 'boutique'>('mes_avatars');
  const [userCoins, setUserCoins] = useState(1250);

  const [avatarsData, setAvatarsData] = useState([
    { id: '1', model: require('../assets/Avatar3D/Girl1Boutique.glb'), price: 50,   owned: true,  active: true  },
    { id: '2', model: require('../assets/Avatar3D/Girl2Boutique.glb'), price: 30,   owned: true,  active: false },
    { id: '3', model: require('../assets/Avatar3D/Girl3Boutique.glb'), price: 1200, owned: true,  active: false },
    { id: '4', model: require('../assets/Avatar3D/Girl4Boutique.glb'), price: 40,   owned: false, active: false },
    { id: '5', model: require('../assets/Avatar3D/Girl5Boutique.glb'), price: 100,  owned: false, active: false },
    { id: '6', model: require('../assets/Avatar3D/Girl6Boutique.glb'), price: 250,  owned: false, active: false },
    { id: '7', model: require('../assets/Avatar3D/Girl7Boutique.glb'), price: 900,  owned: false, active: false },
    { id: '8', model: require('../assets/Avatar3D/Girl6Boutique.glb'), price: 1100, owned: false, active: false },
    { id: '9', model: require('../assets/Avatar3D/Girl7Boutique.glb'), price: 1300, owned: false, active: false },
  ]);

  const [selectedAvatar, setSelectedAvatar]         = useState<any>(null);
  const [resultVisible, setResultVisible]           = useState(false);
  const [modalType, setModalType]                   = useState<"success" | "error">("success");
  const [changeModalVisible, setChangeModalVisible] = useState(false);

  const ownedCount   = useMemo(() => avatarsData.filter(a => a.owned).length, [avatarsData]);
  const activeAvatar = useMemo(() => avatarsData.find(a => a.active), [avatarsData]);

  const handleBuyPress = (item: any) => {
    setSelectedAvatar({ ...item, ...avatarDetails[item.id] });
    if (userCoins >= item.price) {
      setModalType("success");
      setAvatarsData(prev => prev.map(a => a.id === item.id ? { ...a, owned: true } : a));
      setUserCoins(prev => prev - item.price);
    } else {
      setModalType("error");
    }
    setResultVisible(true);
  };

  const handleChangePress = (item: any) => {
    setSelectedAvatar({ ...item, ...avatarDetails[item.id] });
    setChangeModalVisible(true);
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isBoutique = activeTab === 'boutique';
    const isLocked   = !item.owned && !isBoutique;
    const details    = avatarDetails[item.id];

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

        <Text style={styles.itemName}>{details.name}</Text>
        <Text style={styles.itemDesc} numberOfLines={1}>{details.description}</Text>

        {isBoutique ? (
          !item.owned && (
            <TouchableOpacity onPress={() => handleBuyPress(item)}>
              <CoinPrice price={item.price} label="Acheter" iconSize={8} />
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity
            style={[styles.chooseBtn, item.active && styles.chooseBtnActive]}
            onPress={() => !item.active && !isLocked && handleChangePress(item)}
            disabled={isLocked}
          >
            <Text style={styles.chooseBtnText}>{item.active ? '✓' : 'Choisir'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [activeTab]);

  return (
    <LinearGradient colors={["#F0F4FF", "#FFFFFF"]} style={styles.container}>
      <WaveBackground />

      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>Ma boutique</Text>
        <CoinPrice price={userCoins.toLocaleString()} colors={["#5A4C91", "#5A4C91"]} iconSize={14} />
      </View>

      <View style={styles.profileArea}>
        <View style={styles.profileCircle}>
          <AvatarRendererRotating model={activeAvatar?.model} />
        </View>
      </View>

      <View style={styles.tabsWrapper}>
        <View style={styles.tabsPill}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('mes_avatars')}>
            <LinearGradient
              colors={activeTab === 'mes_avatars' ? ["#BAAAE7", "#6949A8"] : ["transparent", "transparent"]}
              style={styles.tabGradient}
            >
              <Text style={[styles.tabText, activeTab === 'mes_avatars' && styles.tabTextActive]}>Mes avatars</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('boutique')}>
            <LinearGradient
              colors={activeTab === 'boutique' ? ["#BAAAE7", "#6949A8"] : ["transparent", "transparent"]}
              style={styles.tabGradient}
            >
              <Text style={[styles.tabText, activeTab === 'boutique' && styles.tabTextActive]}>Boutique</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.counterText}>{ownedCount}/{avatarsData.length} avatars disponibles</Text>

      <FlatList
        data={avatarsData}
        renderItem={renderItem}
        keyExtractor={item => `item-${activeTab}-${item.id}`}
        numColumns={3}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {activeTab === 'mes_avatars' && (
        <View style={styles.fixedFooter}>
          <View style={styles.footerFrame}>
            <Text style={styles.footerTitle}>Débloque plus d'avatars</Text>
            <Text style={styles.footerSub}>Rends ta collection unique !</Text>
            <TouchableOpacity style={styles.footerBtn} onPress={() => setActiveTab('boutique')}>
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
        onConfirm={() => {
          setAvatarsData(prev => prev.map(a => ({ ...a, active: a.id === selectedAvatar.id })));
          setChangeModalVisible(false);
        }}
      />
      <ResultModal
        visible={resultVisible}
        type={modalType}
        avatarName={selectedAvatar?.name}
        onClose={() => setResultVisible(false)}
      />
      <Navbar active="shop" onChange={() => {}} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1 },
  header:            { marginTop: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  title:             { fontSize: 20, fontWeight: 'bold', color: '#5A4C91' },
  profileArea:       { alignItems: 'center', marginVertical: 10 },
  profileCircle:     { width: 90, height: 90, borderRadius: 45, backgroundColor: 'white', elevation: 5, overflow: 'hidden', borderWidth: 2, borderColor: '#BAAAE7' },
  tabsWrapper:       { paddingHorizontal: 40, marginBottom: 10 },
  tabsPill:          { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 25, padding: 3 },
  tabItem:           { flex: 1 },
  tabGradient:       { paddingVertical: 8, borderRadius: 22, alignItems: 'center' },
  tabText:           { fontWeight: 'bold', color: '#5A4C91', fontSize: 13 },
  tabTextActive:     { color: 'white' },
  counterText:       { textAlign: 'center', color: '#5A4C91', fontWeight: 'bold', marginBottom: 10 },
  list:              { paddingHorizontal: 10, paddingBottom: 220 },
  card:              { width: CARD_WIDTH, backgroundColor: '#F8F9FF', borderRadius: 15, padding: 8, margin: 5, alignItems: 'center', elevation: 2 },
  cardLocked:        { backgroundColor: '#D1D1D1' },
  statusBadge:       { position: 'absolute', top: 6, left: 6, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, zIndex: 10 },
  badgeActive:       { backgroundColor: '#66BB6A' },
  badgeOwned:        { backgroundColor: '#81D4FA' },
  badgeText:         { color: 'white', fontSize: 7, fontWeight: 'bold' },
  lockBadge:         { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 3, zIndex: 10 },
  avatarContainer:   { width: 65, height: 65, backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', marginBottom: 5 },
  checkIcon:         { position: 'absolute', bottom: -5, right: -5 },
  itemName:          { fontSize: 11, fontWeight: 'bold', color: '#333' },
  itemDesc:          { fontSize: 8, color: '#777', marginBottom: 6, textAlign: 'center' },
  chooseBtn:         { backgroundColor: '#BAAAE7', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12 },
  chooseBtnActive:   { backgroundColor: '#6949A8' },
  chooseBtnText:     { color: 'white', fontSize: 10, fontWeight: 'bold' },
  fixedFooter:       { position: 'absolute', bottom: 100, left: 20, right: 20 },
  footerFrame:       { backgroundColor: 'rgba(235, 231, 255, 0.9)', borderRadius: 20, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: 'white' },
  footerTitle:       { fontSize: 16, fontWeight: '900', color: '#5A4C91' },
  footerSub:         { fontSize: 11, color: '#555', marginBottom: 10 },
  footerBtn:         { width: '80%', borderRadius: 20, overflow: 'hidden' },
  footerBtnGradient: { paddingVertical: 10, alignItems: 'center' },
  footerBtnText:     { color: 'white', fontWeight: 'bold', fontSize: 12 },
});