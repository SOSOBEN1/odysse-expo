// HibouGuide.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';

type HibouState = 'happy' | 'confused' | 'fail' | 'sleepy' | 'success';

interface HibouGuideProps {
  emotion: HibouState;
  message: string;
  size?: number; // hauteur de l'image en pixels
}

const hibouImages: Record<HibouState, any> = {
  happy: require('../../assets/Hibou/happy.png'),
  confused: require('../../assets/Hibou/confused.png'),
  fail: require('../../assets/Hibou/fail.png'),
  sleepy: require('../../assets/Hibou/sleepy.png'),
  success: require('../../assets/Hibou/success.png'),
};

const HibouGuide: React.FC<HibouGuideProps> = ({ emotion, message, size = 150 }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [emotion]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={hibouImages[emotion]}
        style={[styles.hibouImage, { height: size, width: size, opacity: fadeAnim }]}
        resizeMode="contain"
      />
      <View style={styles.bubble}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

export default HibouGuide;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  hibouImage: {
    // largeur = hauteur, taille réglable via props
  },
  bubble: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});