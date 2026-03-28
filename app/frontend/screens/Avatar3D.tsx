import { Asset } from "expo-asset";
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

function Avatar3D({ source }) {
  const asset = Asset.fromModule(source);
  const { scene } = useGLTF(asset.uri);

  useFrame(() => {
    scene.rotation.y += 0.01;
  });

  return <primitive object={scene} scale={1.5} />;
}