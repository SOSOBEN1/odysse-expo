
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1edff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },

  header: {
    marginTop: 40,
    marginBottom: 20,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#6949a8",
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#fdfdff",
    borderRadius: 25,
    padding: 20,
    marginTop: 25,
  },

  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },

  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    alignItems: "center",
  },

  remember: {
    flexDirection: "row",
    alignItems: "center",
  
  },

  checkbox: {
  width: 20,
  height: 20,
  borderWidth: 1,
  borderRadius: 4,
  borderColor: "#aaa",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#fff",
},
checkboxActive: {
  backgroundColor: "#0043a7",
  borderColor: "#0043a7",
},

  rememberText: {
    fontSize: 13,
    color: "#333",
      fontWeight:"bold",
  },

  forgot: {
    fontSize: 13,
    color: "#6949a8",
    fontWeight: "bold",
  },

  buttonWrapper: {
    marginTop: 20,
  },

  button: {
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 7,
     width: 250,          // largeur fixe (moins large)
  alignSelf: "center", 
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  registerText: {
    fontSize: 13,
    textAlign: "center",
  },

  registerLink: {
    color: "#6949a8",
    fontWeight: "bold",
  },

  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 20,
  },

  socialBtn: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  stars: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 0, // derrière tout
}
});