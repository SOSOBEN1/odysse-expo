import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  modelRequire: any;
  bgColor?: string;
};

const AvatarCard3D = React.memo(function AvatarCard3D({ modelRequire, bgColor = "#f5f3ff" }: Props) {
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
      <View style={[styles.loader, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="small" color="#6949a8" />
      </View>
    );

  const bgHex = bgColor.replace("#", "");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; }
        body { background: #${bgHex}; overflow: hidden; }
        canvas { display: block; }
      </style>
    </head>
    <body>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <script>
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x${bgHex});

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
      style={styles.webview}
      originWhitelist={["*"]}
      javaScriptEnabled={true}
      scrollEnabled={false}
    />
  );
});

export default AvatarCard3D;

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});