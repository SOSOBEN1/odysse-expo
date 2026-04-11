import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Props = {
  question: string;
  onSelect: (value: boolean) => void;
  selectedValue?: boolean | null;
};

export default function QuestionYesNo({ question, onSelect, selectedValue }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.choiceContainer}>
        <TouchableOpacity
          style={[styles.choiceButton, styles.yesButton, selectedValue === true && styles.yesSelected]}
          onPress={() => onSelect(true)}
        >
          <View style={[styles.iconCircle, styles.yesIcon]}>
            <MaterialIcons name="check" size={18} color="#fff" />
          </View>
          <Text style={[styles.choiceText, selectedValue === true && styles.selectedChoiceText]}>Oui</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.choiceButton, styles.noButton, selectedValue === false && styles.noSelected]}
          onPress={() => onSelect(false)}
        >
          <View style={[styles.iconCircle, styles.noIcon]}>
            <MaterialIcons name="close" size={18} color="#fff" />
          </View>
          <Text style={[styles.choiceText, selectedValue === false && styles.selectedChoiceText]}>Non</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  question: {
    fontSize: 22,
    fontWeight: "700",
    color: "#6949a8",
    textAlign: "center",
    marginBottom: 30,
  },
  choiceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  choiceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: "48%",
    justifyContent: "center",
    gap: 10,
  },
  yesButton: { backgroundColor: "#DFF5E1" },
  noButton: { backgroundColor: "#FBE4E2" },
  yesSelected: { backgroundColor: "#A5D6A7" },
  noSelected: { backgroundColor: "#EF9A9A" },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  yesIcon: { backgroundColor: "#34C759" },
  noIcon: { backgroundColor: "#E53935" },
  choiceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6949a8",
  },
  selectedChoiceText: { color: "#fff" },
});