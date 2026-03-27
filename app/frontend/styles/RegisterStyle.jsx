
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
    marginBottom: 20,
    elevation: 10,
  },

  header: {
    marginBottom: 20,
    marginTop: 50,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#6949a8",
    fontWeight: "bold",
  },

  card: {
  backgroundColor: "#fdfdff",
  borderRadius: 20,
  padding: 20,

  width: "100%",        // plein écran
  alignSelf: "center",

  marginTop: 8,
  opacity: 0.9,
},

  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
    color: "#000",
  },

  buttonWrapper: {
  marginTop: 25,
    paddingHorizontal: 5, // 👈 léger décalage stylé

},

  button: {
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 7,
     width: 240,          // largeur fixe (moins large)
  alignSelf: "center", 
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
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