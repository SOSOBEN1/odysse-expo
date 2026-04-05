import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  question: string;
  options: string[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  layout?: "stars" | "list" | "choice" | "scale";
};

export default function QuestionCard({
  question,
  options,
  selectedValue,
  onSelect,
  layout = "stars",
}: Props) {
  const selectedIndex = options.indexOf(selectedValue || "");
  const position = useRef(new Animated.Value(0)).current;
  const step = 300 / (options.length - 1);

  useEffect(() => {
    if (selectedIndex >= 0 && layout === "scale") {
      Animated.spring(position, {
        toValue: selectedIndex * step,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedValue]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => layout === "scale",
      onMoveShouldSetPanResponder: () => layout === "scale",
      onPanResponderMove: (_, gesture) => {
        let newX = selectedIndex * step + gesture.dx;
        newX = Math.max(0, Math.min(newX, step * (options.length - 1)));
        position.setValue(newX);
      },
      onPanResponderRelease: (_, gesture) => {
        let newIndex = Math.round((selectedIndex * step + gesture.dx) / step);
        newIndex = Math.max(0, Math.min(newIndex, options.length - 1));
        onSelect(options[newIndex]);
      },
    })
  ).current;

  return (
    <LinearGradient 
      colors={["rgba(255,255,255,1)", "rgba(255,255,255,0)"]} 
      style={styles.card}
    >
      <Text style={styles.questionText}>{question}</Text>

      {/* ⭐ STARS */}
      {layout === "stars" && (
        <>
          <View style={styles.starsContainer}>
            {options.map((opt, index) => (
              <TouchableOpacity key={index} onPress={() => onSelect(opt)}>
                <MaterialIcons
                  name="star"
                  size={44}
                  color={index <= selectedIndex ? "#FFD700" : "#D1C4E9"}
                />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.labelsContainer}>
            {options.map((opt, index) => {
              const isSelected = selectedValue === opt;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => onSelect(opt)}
                  style={[styles.labelButton, isSelected && styles.selectedLabelButton]}
                >
                  <Text style={[styles.labelText, isSelected && styles.selectedLabelText]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* 📋 LIST - CERCLE BLANC / CHECK VERT */}
      {layout === "list" && (
        <View style={styles.listContainer}>
          {options.map((opt, index) => {
            const isSelected = selectedValue === opt;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => onSelect(opt)}
                style={[styles.listItem, isSelected && styles.selectedListItem]}
              >
                <View style={[
                  styles.circle, 
                  isSelected && { backgroundColor: "#fff", borderColor: "#fff" }
                ]}>
                  {isSelected && <MaterialIcons name="check" size={18} color="#4CAF50" />}
                </View>
                <Text style={[styles.listText, isSelected && styles.selectedListText]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ✅ CHOICE */}
      {layout === "choice" && (
        <View style={styles.choiceContainer}>
          {options.map((opt, index) => {
            const isSelected = selectedValue === opt;
            const isYes = opt.toLowerCase() === "oui";
            return (
              <TouchableOpacity
                key={index}
                onPress={() => onSelect(opt)}
                style={[
                  styles.choiceButton,
                  isYes ? styles.yesButton : styles.noButton,
                  isSelected && (isYes ? styles.yesSelected : styles.noSelected),
                ]}
              >
                <View style={[styles.iconCircle, isYes ? styles.yesIcon : styles.noIcon]}>
                  <MaterialIcons name={isYes ? "check" : "close"} size={18} color="#fff" />
                </View>
                <Text style={[styles.choiceText, isSelected && styles.selectedChoiceText]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* 🎯 SCALE */}
      {layout === "scale" && (
        <View style={styles.scaleWrapper}>
          <View style={styles.scaleContainer} {...panResponder.panHandlers}>
            <View style={styles.scaleLine} />
            {options.map((_, index) => <View key={index} style={styles.dotStatic} />)}
            <Animated.View style={[styles.activeDot, { transform: [{ translateX: position }] }]}>
              <MaterialIcons name="check" size={14} color="#fff" />
            </Animated.View>
          </View>
          <View style={styles.scaleLabels}>
            {options.map((opt, index) => {
              const isSelected = selectedValue === opt;
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => onSelect(opt)}
                  style={[styles.scaleOption, isSelected && styles.scaleOptionSelected]}
                >
                  <Text style={[styles.scaleText, isSelected && styles.scaleTextSelected]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingVertical: 40, paddingHorizontal: 25, flex: 1 },
  questionText: { fontSize: 22, fontWeight: "700", textAlign: "center", color: "#6949a8", marginBottom: 30 },
  starsContainer: { flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 25 },
  labelsContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  labelButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: "#F1ECFB" },
  selectedLabelButton: { backgroundColor: "#6949a8" },
  labelText: { fontSize: 11, color: "#6949a8" },
  selectedLabelText: { color: "#fff", fontWeight: "600" },
  listContainer: { gap: 15 },
  listItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 20, borderRadius: 20, backgroundColor: "#F4F0FF" },
  selectedListItem: { backgroundColor: "#BBAAF5" },
  circle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#6949a8", marginRight: 15, justifyContent: "center", alignItems: "center" },
  listText: { fontSize: 15, color: "#6949a8", fontWeight: "500" },
  selectedListText: { color: "#fff", fontWeight: "600" },
  choiceContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  choiceButton: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 20, borderRadius: 20, width: "48%", justifyContent: "center", gap: 10 },
  yesButton: { backgroundColor: "#DFF5E1" },
  noButton: { backgroundColor: "#FBE4E2" },
  yesSelected: { backgroundColor: "#A5D6A7" },
  noSelected: { backgroundColor: "#EF9A9A" },
  iconCircle: { width: 26, height: 26, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  yesIcon: { backgroundColor: "#34C759" },
  noIcon: { backgroundColor: "#E53935" },
  choiceText: { fontSize: 16, fontWeight: "600", color: "#6949a8" },
  selectedChoiceText: { color: "#fff" },
  scaleWrapper: { marginTop: 20, alignItems: "center" },
  scaleContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: 300, height: 40 },
  scaleLine: { position: "absolute", height: 4, width: "100%", backgroundColor: "#D1C4E9", borderRadius: 10 },
  dotStatic: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#E0D7F5" },
  activeDot: { position: "absolute", width: 26, height: 26, borderRadius: 13, backgroundColor: "#6949a8", justifyContent: "center", alignItems: "center" },
  scaleLabels: { flexDirection: "row", justifyContent: "space-between", width: 300, marginTop: 10 },
  scaleOption: { width: 60, paddingVertical: 6, borderRadius: 10, alignItems: "center" },
  scaleOptionSelected: { backgroundColor: "#6949a8" },
  scaleText: { fontSize: 10, color: "#6949a8", textAlign: "center" },
  scaleTextSelected: { color: "#fff", fontWeight: "600" },
});