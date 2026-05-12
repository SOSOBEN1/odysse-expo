import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio } from 'expo-av'
import { useEffect, useRef } from 'react'

export function useBackgroundMusic() {
  const soundRef = useRef<Audio.Sound | null>(null)

  const start = async () => {
    try {
      const musicPref = await AsyncStorage.getItem('pref_music')
      if (musicPref === 'false') return

      if (soundRef.current) {
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }

      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/background.mp3'),
        {
          shouldPlay: true,
          isLooping: true,
          volume: 0.3,
        }
      )
      soundRef.current = sound
    } catch (e) {
      console.warn('Erreur musique fond:', e)
    }
  }

  const stop = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync()
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }
    } catch (e) {
      console.warn('Erreur stop musique:', e)
    }
  }

  useEffect(() => {
    start()
    return () => {
      stop()
    }
  }, [])

  return { start, stop }
}