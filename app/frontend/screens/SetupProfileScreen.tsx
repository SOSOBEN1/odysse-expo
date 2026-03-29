import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import GroupIcon from "../assets/images/Group.svg";

import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import WaveBackground from "../components/waveBackground";

// ─── AvatarCard ───────────────────────────────────────────────────────────────
function AvatarCard({ modelRequire }: { modelRequire: any }) {
  const [base64, setBase64] = useState<string | null>(null);

  useEffect(() => {
  const load = async () => {
    try {
      const asset = Asset.fromModule(modelRequire);
      
      // Essai 1 : téléchargement normal
      await asset.downloadAsync();
      const b64 = await FileSystem.readAsStringAsync(asset.localUri!, {
        encoding: "base64" as any,
      });
      setBase64(b64);
    } catch (e) {
      // Essai 2 : copier depuis l'URI local Metro vers le cache
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
      renderer.outputEncoding = 3001; // sRGBEncoding
      document.body.appendChild(renderer.domElement);

      // Lumières fortes
      scene.add(new THREE.AmbientLight(0xffffff, 2.5));
      const dir1 = new THREE.DirectionalLight(0xffffff, 3);
      dir1.position.set(2, 4, 3);
      scene.add(dir1);
      const dir2 = new THREE.DirectionalLight(0xffffff, 1.5);
      dir2.position.set(-2, 2, -2);
      scene.add(dir2);

      let dragging = false, lx = 0;
      renderer.domElement.addEventListener('touchstart', e => {
        dragging = true; lx = e.touches[0].clientX;
      });
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

          // Centrer
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          model.position.sub(center);

          // Remplir l'écran : caméra adaptée à la hauteur du modèle
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
}

const avatarStyles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f7ff",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});

// ─── Données ──────────────────────────────────────────────────────────────────
const avatars = [
  // 👩 FEMININ
  { id: 1, gender: "Feminin", model: require("../assets/Avatar3D/fille1Corrige.glb") },
  { id: 2, gender: "Feminin", model: require("../assets/Avatar3D/fille2Corrige.glb") },
  { id: 3, gender: "Feminin", model: require("../assets/Avatar3D/fille3Corrige.glb") },
  // 👨 MASCULIN
  { id: 4, gender: "Masculin", model: require("../assets/Avatar3D/garcon1Corrige.glb") },
  { id: 5, gender: "Masculin", model: require("../assets/Avatar3D/garcon2Corrige.glb") },
  { id: 6, gender: "Masculin", model: require("../assets/Avatar3D/garcon3Corrige.glb") },
];

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function SetUpProfileScreen() {
  const [gender, setGender] = useState("Masculin");
  const [selected, setSelected] = useState(4);

  // ← seulement 3 avatars par genre
  const filteredAvatars = avatars.filter((a) => a.gender === gender).slice(0, 3);

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

  const renderItem = ({ item }: { item: (typeof avatars)[0] }) => {
    const isSelected = selected === item.id;
    return (
      <TouchableOpacity
        onPress={() => setSelected(item.id)}
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
  };

  return (
    <LinearGradient colors={["#ffffff", "#dcd2f9"]} style={styles.container}>
      <WaveBackground />

      {/* Back */}
      <TouchableOpacity style={styles.backBtn}>
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
        <Text style={styles.subtitle}>
          Create Your Initial Profile To Get Started
        </Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* Barre genre */}
        <View style={styles.genderBar}>
          <TouchableOpacity
            onPress={() => {
              setGender("Feminin");
              const first = avatars.find((a) => a.gender === "Feminin");
              if (first) setSelected(first.id);
            }}
            style={[styles.genderButton, gender === "Feminin" && styles.genderButtonActive]}
          >
            <Text style={[styles.genderText, gender === "Feminin" && styles.genderTextActive]}>
              Feminin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setGender("Masculin");
              const first = avatars.find((a) => a.gender === "Masculin");
              if (first) setSelected(first.id);
            }}
            style={[styles.genderButton, gender === "Masculin" && styles.genderButtonActive]}
          >
            <Text style={[styles.genderText, gender === "Masculin" && styles.genderTextActive]}>
              Masculin
            </Text>
          </TouchableOpacity>
        </View>

        {/* Grille 3 avatars */}
        <FlatList
          data={filteredAvatars}
          numColumns={3}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />

        {/* Bouton suivant */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.nextButton}>
            <LinearGradient
              colors={["#7f5af0", "#bbaaff"]}
              style={styles.nextButtonGradient}
            >
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
       {/* ✅ Navbar */}
      <Navbar active="home" onChange={() => {}} />
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
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#5c3ca8",
    letterSpacing: 0.5,
    //marginLeft: 12,
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
    marginBottom: 8,
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
  grid: { paddingBottom: 8, marginTop: 12 },
  avatarBox: {
    flex: 1,
    margin: 6,
    borderRadius: 20,
    backgroundColor: "#f8f7ff",
    overflow: "hidden",       // ← important pour WebView
    aspectRatio: 0.75,        // ← format portrait
    position: "relative",
  },
  avatarSelected: {
    borderWidth: 2.5,
    borderColor: "#7f5af0",
    backgroundColor: "#f0ecff",
  },
  check: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#7f5af0",
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
    zIndex: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  nextButton: { borderRadius: 25, overflow: "hidden", width: 100 },
  nextButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  nextButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  stars: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  iconContainer: {
  width: 36,
  height: 36,
  borderRadius: 12,
  backgroundColor: "#f0ecff",
  justifyContent: "center",
  alignItems: "center",
  marginRight: 10,

  // Ombre iOS
  shadowColor: "#7f5af0",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,

  // Ombre Android
  elevation: 4,
},
});