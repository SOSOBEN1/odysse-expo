import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface AvatarCardProps {
  model: any;
  bgColor?: string;
  isTransparent?: boolean;
}

export default function AvatarCrd({ model, bgColor = "#ffffff", isTransparent = false }: AvatarCardProps) {
  const [base64, setBase64] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const asset = Asset.fromModule(model);
        await asset.downloadAsync();
        const b64 = await FileSystem.readAsStringAsync(asset.localUri!, {
          encoding: 'base64' as any,
        });
        if (isMounted) setBase64(b64);
      } catch (e) {
        console.error("Erreur chargement avatar:", e);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [model]);

  const html = useMemo(() => {
    if (!base64) return "";
    const bg = isTransparent ? 'transparent' : bgColor;
    const threeBg = isTransparent ? 'null' : `0x${bgColor.replace("#", "")}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: ${bg}; }
          canvas { display: block; width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
        <script>
          (function() {
            let scene, camera, renderer, modelAnim;
            function init() {
              scene = new THREE.Scene();
              if(${!isTransparent}) scene.background = new THREE.Color(${threeBg});

              camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
              renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
              renderer.setSize(window.innerWidth, window.innerHeight);
              renderer.setPixelRatio(window.devicePixelRatio);
              document.body.appendChild(renderer.domElement);

              const light = new THREE.AmbientLight(0xffffff, 2.5);
              scene.add(light);
              const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
              dirLight.position.set(2, 2, 5);
              scene.add(dirLight);

              const bytes = new Uint8Array(atob("${base64}").split('').map(c => c.charCodeAt(0)));
              new THREE.GLTFLoader().parse(bytes.buffer, '', (gltf) => {
                modelAnim = gltf.scene;
                const box = new THREE.Box3().setFromObject(modelAnim);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                modelAnim.position.sub(center);
                scene.add(modelAnim);
                const maxDim = Math.max(size.x, size.y, size.z);
                camera.position.z = maxDim * 2.5;
                camera.lookAt(0, 0, 0);
              });
              animate();
            }
            function animate() {
              requestAnimationFrame(animate);
              if (modelAnim) modelAnim.rotation.y += 0.015;
              renderer.render(scene, camera);
            }
            init();
          })();
        </script>
      </body>
      </html>
    `;
  }, [base64, bgColor, isTransparent]);

  if (!base64) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color="#765EFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled={true}
        androidLayerType="hardware"
        transparent={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  webview: { backgroundColor: 'transparent', flex: 1, opacity: 0.99 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});