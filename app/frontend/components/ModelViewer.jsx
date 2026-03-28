import { Asset } from "expo-asset";
import { GLView } from "expo-gl";
import { Text, View } from "react-native";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function ModelViewer({ modelPath }) {
  // Si pas de modèle, afficher un placeholder
  if (!modelPath) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f7ff' }}>
        <Text>👤 Avatar</Text>
      </View>
    );
  }

  const onContextCreate = async (gl) => {
    try {
      const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 2;

      const renderer = new THREE.WebGLRenderer({
        canvas: {
          width,
          height,
          style: {},
          addEventListener: () => {},
          removeEventListener: () => {},
          clientHeight: height,
          clientWidth: width,
        },
        context: gl,
      });

      renderer.setSize(width, height);

      const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
      scene.add(light);

      // Charger le modèle depuis le chemin passé en props
      const asset = Asset.fromModule(modelPath);
      await asset.downloadAsync();

      const loader = new GLTFLoader();
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();

      loader.parse(
        arrayBuffer,
        "",
        (gltf) => {
          const model = gltf.scene;
          scene.add(model);
        },
        (error) => {
          console.log("GLTF error:", error);
        }
      );

      const render = () => {
        requestAnimationFrame(render);
        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      render();
    } catch (error) {
      console.log("Erreur chargement modèle 3D:", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
    </View>
  );
}