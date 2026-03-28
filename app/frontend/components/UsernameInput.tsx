import React, { useState } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import styles from "../styles/SetUpProfileStyle";


export default function UsernameInput({
  value = "",
  onChange,
  placeholder,
  icon = "user",
  secure = false,
}) {
  const [isSecure, setIsSecure] = useState(secure);

  return (
    <View style={styles.inputContainer}>
      {/* Icône gauche */}
  <Feather name="user" size={18} color="#bdbdbd" />

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#bdbdbd"
        value={value}
        onChangeText={onChange}
        secureTextEntry={isSecure}
      />

      {/* 🔥 Icône droite */}
      {secure ? (
        <TouchableOpacity onPress={() => setIsSecure(!isSecure)}>
          <Feather
            name={isSecure ? "eye-off" : "eye"}
            size={20}
            color="#cdcdcd"
          />
        </TouchableOpacity>
      ) : (
        value.length > 0 && (
          <Feather name="check-circle" size={20} color="#34C759" />
        )
      )}
    </View>
  );
}