import { StyleSheet, Text, View } from "react-native";
import NewPasswordScreen from './frontend/screens/NewPassword';
import SetUpProfileScreen from "./frontend/screens/SetUpProfile";
import RegisterScreen from "./frontend/screens/Register";
import LoginScreen from "./frontend/screens/Login";

export default function Page() {
  // return <NewPasswordScreen />;
  //  return <SetUpProfileScreen/>
  // return <RegisterScreen/>
  //  return <LoginScreen/>
}




const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 960,
    marginHorizontal: "auto",
  },
  title: {
    fontSize: 64,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 36,
    color: "#38434D",
  },
});
