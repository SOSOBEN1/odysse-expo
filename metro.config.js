const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  // Configuration pour SVG
  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  };
  
  config.resolver = {
    ...resolver,
    // Ajouter glb et gltf aux assetExts
    assetExts: [...resolver.assetExts.filter((ext) => ext !== "svg"), "glb", "gltf"],
    sourceExts: [...resolver.sourceExts, "svg"],
  };

  return config;
})();
