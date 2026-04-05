import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import GroupIcon from "../assets/images/Group.svg";
import WaveBackground from "../components/waveBackground";
import { useAvatar } from "../constants/AvatarContext";

// ─── AvatarCard ───────────────────────────────────────────────────────────────
const AvatarCard = React.memo(function AvatarCard({ modelRequire }: { modelRequire: any }) {
  const [base64, setBase64] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const asset = Asset.fromModule(modelRequire);
        await asset.downloadAsync();
        const b64 = await FileSystem.readAsStringAsync(asset.localUri!, {
          encoding: "base64" as any,
        });
        setBase64(b64);
      } catch (e) {
        try {
          const asset = Asset.fromModule(modelRequire);
          const destPath = `${FileSystem.cacheDirectory}model_${Date.now()}.glb`;
          await FileSystem.downloadAsync(asset.uri, destPath);
          const b64 = await FileSystem.readAsStringAsync(destPath, {
            encoding: "base64" as any,
          });
          setBase64(b64);
        } catch (e2) {
          console.error("Erreur chargement GLB:", e2);
        }
      }
    };
    load();
  }, [modelRequire]);

  if (!base64)
    return (
      <View style={avatarStyles.loader}>
        <ActivityIndicator size="small" color="#7f5af0" />
      </View>
    );

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; }
        body { background: #f8f7ff; overflow: hidden; }
        canvas { display: block; }
      </style>
    </head>
    <body>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <script>
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8f7ff);
        const w = window.innerWidth, h = window.innerHeight;
        const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputEncoding = 3001;
        document.body.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 2.5));
        const dir1 = new THREE.DirectionalLight(0xffffff, 3);
        dir1.position.set(2, 4, 3);
        scene.add(dir1);
        const dir2 = new THREE.DirectionalLight(0xffffff, 1.5);
        dir2.position.set(-2, 2, -2);
        scene.add(dir2);

        let dragging = false, lx = 0;
        renderer.domElement.addEventListener('touchstart', e => { dragging = true; lx = e.touches[0].clientX; });
        renderer.domElement.addEventListener('touchmove', e => {
          if (!dragging) return;
          scene.rotation.y += (e.touches[0].clientX - lx) * 0.015;
          lx = e.touches[0].clientX;
        });
        renderer.domElement.addEventListener('touchend', () => dragging = false);

        const glbScript = document.createElement('script');
        glbScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
        glbScript.onload = () => {
          const b64 = '${base64}';
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          new THREE.GLTFLoader().parse(bytes.buffer, '', (gltf) => {
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            model.position.sub(center);
            const height = size.y;
            const dist = (height / 2) / Math.tan((40 * Math.PI / 180) / 2);
            camera.position.set(0, 0, dist * 1.1);
            camera.lookAt(0, 0, 0);
            scene.add(model);
          });
        };
        document.head.appendChild(glbScript);

        (function animate() {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        })();
      </script>
    </body>
    </html>
  `;

  return (
    <WebView
      source={{ html }}
      style={avatarStyles.webview}
      originWhitelist={["*"]}
      javaScriptEnabled={true}
      scrollEnabled={false}
    />
  );
});

const avatarStyles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f7ff" },
  webview: { flex: 1, backgroundColor: "transparent" },
});

// ─── AvatarItem ───────────────────────────────────────────────────────────────
const AvatarItem = React.memo(
  function AvatarItem({
    item,
    isSelected,
    onPress,
  }: {
    item: (typeof avatars)[0];
    isSelected: boolean;
    onPress: (id: number) => void;
  }) {
    return (
      <TouchableOpacity
        onPress={() => onPress(item.id)}
        style={[styles.avatarBox, isSelected && styles.avatarSelected]}
      >
        <AvatarCard modelRequire={item.model} />
        {isSelected && (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  },
  (prev, next) => prev.isSelected === next.isSelected
);

// ─── Données : 6 féminins (2 pages × 3) + 6 masculins (2 pages × 3) ──────────
const avatars = [
  // ── Féminin page 0 ──
  { id: 1,  gender: "Feminin",  page: 0, model: require("../assets/Avatar3D/fille1.glb") },
  { id: 2,  gender: "Feminin",  page: 0, model: require("../assets/Avatar3D/fille3Corrige.glb") },
  { id: 3,  gender: "Feminin",  page: 0, model: require("../assets/Avatar3D/fille3.glb") },
  { id: 4,  gender: "Feminin",  page: 0, model: require("../assets/Avatar3D/fille1.glb") },
  { id: 5,  gender: "Feminin",  page: 0, model: require("../assets/Avatar3D/fille3Corrige.glb") },
  { id: 6,  gender: "Feminin",  page: 0, model: require("../assets/Avatar3D/fille3.glb") },
  // ── Féminin page 1 ──
  { id: 7,  gender: "Feminin",  page: 1, model: require("../assets/Avatar3D/fille4.glb") },
  { id: 8,  gender: "Feminin",  page: 1, model: require("../assets/Avatar3D/fille5.glb") },
  { id: 9,  gender: "Feminin",  page: 1, model: require("../assets/Avatar3D/fille6.glb") },
  // ── Masculin page 0 ──
  { id: 10,  gender: "Masculin", page: 0, model: require("../assets/Avatar3D/garcon1.glb") },
  { id: 11,  gender: "Masculin", page: 0, model: require("../assets/Avatar3D/garcon2.glb") },
  { id: 12,  gender: "Masculin", page: 0, model: require("../assets/Avatar3D/garcon8.glb") },
  // ── Masculin page 1 ──
  { id: 13, gender: "Masculin", page: 0, model: require("../assets/Avatar3D/garcon4.glb") },
  { id: 14, gender: "Masculin", page: 0, model: require("../assets/Avatar3D/garcon5.glb") },
  { id: 15, gender: "Masculin", page: 0, model: require("../assets/Avatar3D/garcon7.glb") },
   { id: 16, gender: "Masculin", page: 1, model: require("../assets/Avatar3D/garcon4.glb") },
  { id: 17, gender: "Masculin", page: 1, model: require("../assets/Avatar3D/garcon5.glb") },
  { id: 18, gender: "Masculin", page: 1, model: require("../assets/Avatar3D/garcon7.glb") },
];

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function SetUpProfileScreen() {
  const router = useRouter();
  const [gender, setGender] = useState<"Masculin" | "Feminin">("Masculin");
  const [selected, setSelected] = useState(7);
  // Pages indépendantes par genre
  const [femPage, setFemPage] = useState(0);
  const [mascPage, setMascPage] = useState(0);
  const { setSelectedModel } = useAvatar();

  const currentPage = gender === "Feminin" ? femPage : mascPage;
  const setCurrentPage = gender === "Feminin" ? setFemPage : setMascPage;

  const allForGender = avatars.filter((a) => a.gender === gender);
  const totalPages = Math.max(...allForGender.map((a) => a.page)) + 1;
  const filteredAvatars = allForGender.filter((a) => a.page === currentPage);

  const handleSelect = useCallback((id: number) => setSelected(id), []);

  const handleGenderChange = (newGender: "Masculin" | "Feminin") => {
    setGender(newGender);
    const page = newGender === "Feminin" ? femPage : mascPage;
    const first = avatars.find((a) => a.gender === newGender && a.page === page);
    if (first) setSelected(first.id);
  };

  const handlePageChange = (direction: "prev" | "next") => {
    const newPage = direction === "prev" ? currentPage - 1 : currentPage + 1;
    setCurrentPage(newPage);
    const first = avatars.find((a) => a.gender === gender && a.page === newPage);
    if (first) setSelected(first.id);
  };

  const goToPage = (p: number) => {
    setCurrentPage(p);
    const first = avatars.find((a) => a.gender === gender && a.page === p);
    if (first) setSelected(first.id);
  };

  const handleNext = () => {
    const chosen = avatars.find((a) => a.id === selected);
    if (chosen) setSelectedModel(chosen.model);
    router.push("/home");
  };

  const renderItem = ({ item }: { item: (typeof avatars)[0] }) => (
    <AvatarItem
      item={item}
      isSelected={selected === item.id}
      onPress={handleSelect}
    />
  );

  const stars = [
    { top: 10, left: 10, size: 20, opacity: 0.6 },
    { top: 10, right: 10, size: 12, opacity: 0.4 },
    { bottom: 10, left: 10, size: 15, opacity: 0.5 },
    { bottom: 10, right: 10, size: 10, opacity: 0.35 },
    { top: 30, left: 50, size: 8, opacity: 0.25 },
    { bottom: 40, right: 60, size: 22, opacity: 0.7 },
    { top: 40, right: 50, size: 22, opacity: 0.7 },
    { top: 60, left: 150, size: 14, opacity: 0.45 },
    { bottom: 80, left: 16, size: 18, opacity: 0.55 },
  ];

  return (
    <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
      <WaveBackground />

      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#6949a8" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconContainer}>
            <GroupIcon width={36} height={36} fill="#7f5af0" />
          </View>
          <Text style={styles.title}>Set Up Profile</Text>
        </View>
        <Text style={styles.subtitle}>Create Your Initial Profile To Get Started</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>

        {/* Barre genre */}
        <View style={styles.genderBar}>
          <TouchableOpacity
            onPress={() => handleGenderChange("Feminin")}
            style={[styles.genderButton, gender === "Feminin" && styles.genderButtonActive]}
          >
            <Text style={[styles.genderText, gender === "Feminin" && styles.genderTextActive]}>
              Feminin
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleGenderChange("Masculin")}
            style={[styles.genderButton, gender === "Masculin" && styles.genderButtonActive]}
          >
            <Text style={[styles.genderText, gender === "Masculin" && styles.genderTextActive]}>
              Masculin
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grille + flèches gauche / droite */}
        <View style={styles.gridRow}>

          {/* ← Flèche gauche */}
          <TouchableOpacity
            onPress={() => handlePageChange("prev")}
            disabled={currentPage === 0}
            style={[styles.arrowBtn, currentPage === 0 && styles.arrowBtnDisabled]}
            activeOpacity={0.7}
          >
            <View style={[styles.arrowCircle, currentPage === 0 && styles.arrowCircleDisabled]}>
              <Ionicons
                name="chevron-back"
                size={22}
                color={currentPage === 0 ? "#c8c0e0" : "#7f5af0"}
              />
            </View>
          </TouchableOpacity>

          {/* Grille centrale */}
          <View style={styles.gridWrapper}>
            <FlatList
              data={filteredAvatars}
              numColumns={3}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              extraData={selected}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />

            {/* Points de pagination */}
            <View style={styles.dotsRow}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <TouchableOpacity key={i} onPress={() => goToPage(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <View style={[styles.dot, i === currentPage && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* → Flèche droite */}
          <TouchableOpacity
            onPress={() => handlePageChange("next")}
            disabled={currentPage === totalPages - 1}
            style={[styles.arrowBtn, currentPage === totalPages - 1 && styles.arrowBtnDisabled]}
            activeOpacity={0.7}
          >
            <View style={[styles.arrowCircle, currentPage === totalPages - 1 && styles.arrowCircleDisabled]}>
              <Ionicons
                name="chevron-forward"
                size={22}
                color={currentPage === totalPages - 1 ? "#c8c0e0" : "#7f5af0"}
              />
            </View>
          </TouchableOpacity>

        </View>

        {/* Bouton suivant */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <LinearGradient colors={["#7f5af0", "#bbaaff"]} style={styles.nextButtonGradient}>
              <Text style={styles.nextButtonText}>Suivant</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </View>

      {/* Stars */}
      <View style={[styles.stars, { pointerEvents: "none" }]}>
        {stars.map((star, i) => (
          <MaterialIcons
            key={i}
            name="auto-awesome"
            size={star.size}
            color="#fff"
            style={{
              position: "absolute",
              ...(star.top !== undefined ? { top: star.top } : {}),
              ...(star.bottom !== undefined ? { bottom: star.bottom } : {}),
              ...(star.left !== undefined ? { left: star.left } : {}),
              ...(star.right !== undefined ? { right: star.right } : {}),
              opacity: star.opacity,
            }}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    position: "absolute",
    top: 54,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffffaa",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  header: {
    marginTop: 140,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#f0ecff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    shadowColor: "#7f5af0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#5c3ca8",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#9b87c9",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  genderBar: {
    flexDirection: "row",
    backgroundColor: "#f0edff",
    borderRadius: 40,
    padding: 4,
    marginBottom: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 36,
    alignItems: "center",
  },
  genderButtonActive: { backgroundColor: "#7f5af0" },
  genderText: { fontSize: 15, fontWeight: "600", color: "#7f5af0" },
  genderTextActive: { color: "#fff" },

  // ─── Grille + flèches ─────────────────────────────────────────────────────
  gridRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  arrowBtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  arrowBtnDisabled: {
    opacity: 0.35,
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f0ecff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#d4c9ff",
  },
  arrowCircleDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e8e8e8",
  },
  gridWrapper: {
    flex: 1,
  },
  grid: {
    paddingBottom: 4,
  },
  avatarBox: {
    flex: 1,
    margin: 4,
    borderRadius: 16,
    backgroundColor: "#f8f7ff",
    overflow: "hidden",
    aspectRatio: 0.75,
    position: "relative",
  },
  avatarSelected: {
    borderWidth: 2.5,
    borderColor: "#7f5af0",
    backgroundColor: "#f0ecff",
  },
  check: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "#7f5af0",
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
    zIndex: 10,
  },

  // ─── Points de pagination ─────────────────────────────────────────────────
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d4c9ff",
  },
  dotActive: {
    width: 22,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7f5af0",
  },

  // ─── Bouton suivant ───────────────────────────────────────────────────────
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  nextButton: { borderRadius: 25, overflow: "hidden", width: 100 },
  nextButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  nextButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  // ─── Stars ────────────────────────────────────────────────────────────────
  stars: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
});