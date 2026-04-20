import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Props = {
  question: string;
  min_value?: number;
  max_value?: number;
  onSelect: (value: number) => void;
  selectedValue?: number | null;
};

export default function QuestionStar({ question, min_value = 1, max_value = 5, onSelect, selectedValue }: Props) {
  const stars = Array.from({ length: max_value }, (_, i) => i + min_value);

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>

      <View style={styles.starsRow}>
        {stars.map((star) => (
          <TouchableOpacity key={star} onPress={() => onSelect(star)} style={styles.starButton}>
            <MaterialIcons
              name={selectedValue !== null && selectedValue !== undefined && star <= selectedValue ? "star" : "star-border"}
              size={48}
              color={selectedValue !== null && selectedValue !== undefined && star <= selectedValue ? "#F4C430" : "#C9B8F0"}
            />
          </TouchableOpacity>
        ))}
      </View>

      {selectedValue !== null && selectedValue !== undefined && (
        <Text style={styles.ratingLabel}>
          {selectedValue === 1 && "Très mauvais"}
          {selectedValue === 2 && "Mauvais"}
          {selectedValue === 3 && "Moyen"}
          {selectedValue === 4 && "Bon"}
          {selectedValue === 5 && "Excellent"}
        </Text>
      )}
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
    marginBottom: 40,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "600",
    color: "#6949a8",
  },
});
