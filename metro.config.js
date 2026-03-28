const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ajouter les extensions GLB et GLTF
config.resolver.assetExts.push("glb", "gltf");

module.exports = config;
