import React, { useRef } from "react";
import { View, TextInput, StyleSheet } from "react-native";

type OtpInputProps = {
  code: string[];
  status: "idle" | "success" | "error";
  onChange: (text: string, index: number) => void;
};

export default function OtpInput({ code, status, onChange }: OtpInputProps) {
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    onChange(text, index);
    
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  return (
    <View style={styles.codeRow}>
      {code.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputs.current[index] = ref;
          }}
          style={[
            styles.codeInput,
            status === "success" && styles.codeInputSuccess,
            status === "error" && styles.codeInputError,
          ]}
          keyboardType="number-pad"
          maxLength={1}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  codeInput: {
    width: 50,
    height: 55,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  codeInputSuccess: {
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },
  codeInputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
});