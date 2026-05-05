/**
 * PuzzleCell — affiche UN fragment de l'image (découpage réel 3×3)
 *
 * Principe :
 *  - L'image entière fait (cellSize * GRID_COLS) × (cellSize * GRID_COLS)
 *  - On la positionne avec left/top négatifs pour ne montrer que la bonne portion
 *  - overflow: hidden sur le conteneur coupe le reste
 *
 * Exemple pour une grille 3×3 avec cellSize = 100 :
 *   image totale = 300×300
 *   pièce [1][2] (col=1, row=2) → left = -(1*100) = -100, top = -(2*100) = -200
 */

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, View } from "react-native";

const GRID_COLS = 3;

interface PuzzleCellProps {
  index:     number;
  revealed:  boolean;
  imageUri:  string;
  cellSize:  number;
  accent:    string;
}

export default function PuzzleCell({
  index, revealed, imageUri, cellSize, accent,
}: PuzzleCellProps) {
  const sc    = useRef(new Animated.Value(0)).current;
  const glow  = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;

  // Position dans la grille
  const col  = index % GRID_COLS;
  const row  = Math.floor(index / GRID_COLS);

  // Décalage de l'image pour montrer uniquement la bonne portion
  const imgLeft = -(col * cellSize);
  const imgTop  = -(row * cellSize);

  // Taille totale de l'image (toute la grille)
  const imgSize = cellSize * GRID_COLS;

  useEffect(() => {
    Animated.spring(sc, {
      toValue: 1,
      friction: 5,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (revealed) {
      // Flash blanc à l'apparition
      flash.setValue(1);
      Animated.timing(flash, {
        toValue: 0, duration: 800, useNativeDriver: true,
      }).start();

      // Glow continu
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
    }
  }, [revealed]);

  return (
    <Animated.View style={[
      styles.cell,
      {
        width:       cellSize,
        height:      cellSize,
        borderColor: revealed ? accent : "rgba(255,255,255,0.2)",
        transform:   [{ scale: sc }],
      },
    ]}>
      {revealed ? (
        <>
          {/* ── Fragment de l'image ── */}
          <View style={{ width: cellSize, height: cellSize, overflow: "hidden" }}>
            <Image
              source={{ uri: imageUri }}
              style={{
                width:    imgSize,
                height:   imgSize,
                position: "absolute",
                left:     imgLeft,
                top:      imgTop,
              }}
              resizeMode="cover"
            />
          </View>

          {/* Glow coloré */}
          <Animated.View style={[
            StyleSheet.absoluteFill,
            { backgroundColor: accent + "22", borderRadius: 10, opacity: glow },
          ]} />

          {/* Flash blanc */}
          <Animated.View style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 10, opacity: flash },
          ]} />

          {/* Checkmark */}
          <View style={[styles.check, { backgroundColor: accent }]}>
            <Ionicons name="checkmark" size={9} color="#fff" />
          </View>
        </>
      ) : (
        <View style={styles.locked}>
          <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.4)" />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderRadius: 10,
    overflow:     "hidden",
    borderWidth:  2,
    margin:       2,
    shadowColor:  "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius:  4,
    elevation:     3,
  },
  check: {
    position:        "absolute",
    bottom:          3,
    right:           3,
    width:           15,
    height:          15,
    borderRadius:    8,
    justifyContent:  "center",
    alignItems:      "center",
    borderWidth:     1.5,
    borderColor:     "#fff",
  },
  locked: {
    flex:            1,
    backgroundColor: "rgba(40,10,100,0.55)",
    justifyContent:  "center",
    alignItems:      "center",
  },
});