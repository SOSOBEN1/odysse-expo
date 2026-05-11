import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from "expo-av";
import { useEffect, useRef } from "react";

const SOUNDS = {
  missionReussie: require("../assets/sounds/mission-reussie.mp3"),
  missionEchouee: require("../assets/sounds/mission-echouee.wav"),
  missionCreee:   require("../assets/sounds/mission-cree.mp3"),
  changerMDP:     require("../assets/sounds/changer-MDP-sauvegarderProfil.mp3"),
  acceuil:        require("../assets/sounds/acceuil.wav"),
};

export type SoundKey = keyof typeof SOUNDS;

export function useSounds() {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const playSound = async (key: SoundKey, volume = 1.0) => {
    try {
      // ── Vérifier si le son est activé ──
      const soundPref = await AsyncStorage.getItem('pref_sound')
      if (soundPref === 'false') return // ← son désactivé dans les paramètres

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(SOUNDS[key], {
        shouldPlay: true,
        volume,
      });
      soundRef.current = sound;

      await new Promise<void>((resolve) => {
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            resolve();
          }
        });
      });
    } catch (e) {
      console.warn("Erreur son:", e);
    }
  };

  return { playSound };
}