import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Option = {
  id: string;
  label: string;
  value: any;
  order_index: number;
};

type Props = {
  question: string;
  options: Option[];
  onSelect: (value: any) => void;
  selectedValue?: any;
};

export default function QuestionChoix({ question, options, onSelect, selectedValue }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.listContainer}>
        {options
          ?.sort((a, b) => a.order_index - b.order_index)
          .map((opt) => {
            const isSelected = selectedValue === opt.value;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.listItem, isSelected && styles.selectedListItem]}
                onPress={() => onSelect(opt.value)}
              >
                <View style={[styles.circle, isSelected && { backgroundColor: "#fff", borderColor: "#fff" }]}>
                  {isSelected && <MaterialIcons name="check" size={18} color="#4CAF50" />}
                </View>
                <Text style={[styles.listText, isSelected && styles.selectedListText]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  question: {
    fontSize: 22,
    fontWeight: "700",
    color: "#6949a8",
    textAlign: "center",
    marginBottom: 30,
  },
  listContainer: {
    gap: 15,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#F4F0FF",
  },
  selectedListItem: {
    backgroundColor: "#BBAAF5",
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#6949a8",
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  listText: {
    fontSize: 15,
    color: "#6949a8",
    fontWeight: "500",
  },
  selectedListText: {
    color: "#fff",
    fontWeight: "600",
  },
});