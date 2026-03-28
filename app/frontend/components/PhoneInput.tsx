import React from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";

type PhoneInputProps = {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
};

export default function PhoneInput({ value, onChange, placeholder = "Enter phone number" }: PhoneInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.prefix}>+213</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  prefix: {
    marginRight: 10,
    color: "#6949a8",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
});