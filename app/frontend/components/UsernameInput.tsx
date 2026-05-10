 





import React, { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import styles from "../styles/SetUpProfileStyle";

type FeatherIconName = keyof typeof Feather.glyphMap;

type Props = {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  icon?: FeatherIconName;
  secure?: boolean;
  validate?: (val: string) => boolean; // ← nouveau
};

export default function UsernameInput({
  value,
  onChange,
  placeholder,
  icon = "user",
  secure = false,
  validate, // ← nouveau
}: Props) {
  const [isSecure, setIsSecure] = useState(secure);

  const isValid = validate ? validate(value) : value.length > 0; // ← nouveau

  return (
    <View style={styles.inputContainer}>
      <Feather name={icon} size={18} color="#bdbdbd" />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#bdbdbd"
        value={value}
        onChangeText={onChange}
        secureTextEntry={isSecure}
      />
      {secure ? (
        <TouchableOpacity onPress={() => setIsSecure(!isSecure)}>
          <Feather name={isSecure ? "eye-off" : "eye"} size={20} color="#cdcdcd" />
        </TouchableOpacity>
      ) : value.length > 0 ? (
        <Feather
          name={isValid ? "check-circle" : "x-circle"}
    size={20}
    color={isValid ? "#34C759" : "#FF3B30"}
        />
      ) : null}
    </View>
  );
}