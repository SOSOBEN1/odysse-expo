import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface AvatarCardProps {
  model: any;
  size: number;
}

export default function AvatarCard({ model, size }: AvatarCardProps) {
  const [base64, setBase64] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const asset = Asset.fromModule(model);
      await asset.downloadAsync();
      const b64 = await FileSystem.readAsStringAsync(asset.localUri!, {
        encoding: 'base64' as any,
      });
      setBase64(b64);
    };
    load();
  }, [model]);

  if (!base64) return (
    <View style={[styles.loader, { width: size, height: size }]}>
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
        body { background: transparent; overflow: hidden; }
        canvas { display: block; }
      </style>
    </head>
    <body>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
      <script>
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 1, 3);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(${size}, ${size});
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 1.2));
        const dir = new THREE.DirectionalLight(0xffffff, 1.5);
        dir.position.set(2, 4, 3);
        scene.add(dir);

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
            const size3d = box.getSize(new THREE.Vector3()).length();
            model.position.sub(center);
            model.scale.setScalar(1.8 / size3d);
            // Remonter légèrement pour centrer le personnage
            model.position.y -= 0.2;
            scene.add(model);
          });
        };
        document.head.appendChild(glbScript);

        // Rotation auto douce
        let angle = 0;
        (function animate() {
          requestAnimationFrame(animate);
          angle += 0.008;
          scene.rotation.y = angle;
          renderer.render(scene, camera);
        })();
      </script>
    </body>
    </html>
  `;

  return (
    <WebView
      source={{ html }}
      style={{ width: size, height: size, backgroundColor: 'transparent' }}
      scrollEnabled={false}
      originWhitelist={['*']}
      javaScriptEnabled={true}
      androidLayerType="hardware"
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9e6ff',
    borderRadius: 30,
  },
});