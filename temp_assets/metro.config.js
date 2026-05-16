const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package exports support to resolve modern library structures
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
