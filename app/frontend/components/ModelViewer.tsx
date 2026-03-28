import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function ModelViewer() {
  const [base64, setBase64] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const asset = Asset.fromModule(require('../assets/Avatar3D/fille1Corrige.glb'));
      await asset.downloadAsync();
      const b64 = await FileSystem.readAsStringAsync(asset.localUri!, {
      encoding: 'base64' as any,
      });
      setBase64(b64);
    };
    load();
  }, []);

  if (!base64) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; }
        body { background: #1a1a2e; overflow: hidden; }
        #status { position: fixed; top: 10px; left: 10px; color: white; font-size: 12px; font-family: monospace; z-index: 10; }
      </style>
    </head>
    <body>
      <div id="status">Initialisation...</div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <script>
        const status = document.getElementById('status');

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1, 3);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 1));
        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);

        // Touch controls
        let isDragging = false, lastX = 0, lastY = 0;
        renderer.domElement.addEventListener('touchstart', (e) => {
          isDragging = true;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
        });
        renderer.domElement.addEventListener('touchmove', (e) => {
          if (!isDragging) return;
          const dx = e.touches[0].clientX - lastX;
          const dy = e.touches[0].clientY - lastY;
          scene.rotation.y += dx * 0.01;
          scene.rotation.x += dy * 0.01;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
        });
        renderer.domElement.addEventListener('touchend', () => isDragging = false);

        window.addEventListener('resize', () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        });

        (function animate() {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        })();

        // Charger GLB depuis base64
        const glbScript = document.createElement('script');
        glbScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
        glbScript.onload = () => {
          status.textContent = 'Décodage GLB...';

          // Convertir base64 en ArrayBuffer
          const b64 = '${base64}';
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const buffer = bytes.buffer;

          status.textContent = 'Chargement modèle...';
          const loader = new THREE.GLTFLoader();
          loader.parse(
            buffer,
            '',
            (gltf) => {
              const model = gltf.scene;
              const box = new THREE.Box3().setFromObject(model);
              const center = box.getCenter(new THREE.Vector3());
              model.position.sub(center);
              const size = box.getSize(new THREE.Vector3()).length();
              model.scale.setScalar(2 / size);
              scene.add(model);
              status.textContent = '✅ Modèle chargé !';
              setTimeout(() => status.style.display = 'none', 2000);
            },
            (err) => {
              status.textContent = '❌ Erreur: ' + err.message;
            }
          );
        };
        document.head.appendChild(glbScript);
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', backgroundColor: '#1a1a2e' },
});