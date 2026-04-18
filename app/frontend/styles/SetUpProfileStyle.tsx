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
          borderColor:"#b2b4c0",

    
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
  borderRadius: 25,
  padding: 20,
  width: "100%",      // <-- prend toute la largeur
  alignSelf: "center", // centre au cas où
},

  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
  },

  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#d9d9d9",
    justifyContent: "center",
    alignItems: "center",
  },

  editIcon: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: "#4da3ff",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
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

   stars: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 0, // derrière tout
},

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#baaae7",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    height: 50,
  },

  input: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 14,
    color: "#333",
  },
  
});