import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Option = {
  id: string;
  label: string;
  value: number;
  order_index: number;
};

type Props = {
  question: string;
  options: Option[];
  onSelect: (value: number) => void;
  selectedValue?: number | null;
};

export default function QuestionScale({ question, options, onSelect, selectedValue }: Props) {
  const sorted = [...options].sort((a, b) => a.order_index - b.order_index);

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>

      {/* Labels extrêmes */}
      <View style={styles.labelsRow}>
        <Text style={styles.extremeLabel}>{sorted[0]?.label}</Text>
        <Text style={styles.extremeLabel}>{sorted[sorted.length - 1]?.label}</Text>
      </View>

      {/* Boutons de la scale */}
      <View style={styles.scaleRow}>
        {sorted.map((opt) => {
          const isSelected = selectedValue === opt.value;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onSelect(opt.value)}
              style={[styles.scaleButton, isSelected && styles.scaleButtonSelected]}
            >
              <Text style={[styles.scaleButtonText, isSelected && styles.scaleButtonTextSelected]}>
                {opt.value}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Label sélectionné */}
      {selectedValue !== null && selectedValue !== undefined && (
        <Text style={styles.selectedLabel}>
          {sorted.find((o) => o.value === selectedValue)?.label}
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
  labelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  extremeLabel: {
    fontSize: 12,
    color: "#9e86d4",
    fontWeight: "500",
    maxWidth: "40%",
    textAlign: "center",
  },
  scaleRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  scaleButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F4F0FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C9B8F0",
  },
  scaleButtonSelected: {
    backgroundColor: "#6949a8",
    borderColor: "#6949a8",
  },
  scaleButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6949a8",
  },
  scaleButtonTextSelected: {
    color: "#fff",
  },
  selectedLabel: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "600",
    color: "#6949a8",
  },
});
