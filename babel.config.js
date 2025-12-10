// smartbudget/babel.config.js

module.exports = function(api) {
  api.cache(true);
  return {
    // ⭐️ Use presets to handle Expo and NativeWind config ⭐️
    presets: [
      // 1. Base Expo Preset
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      
      // 2. NativeWind Preset/Plugin
      'nativewind/babel',
    ],
    
    // ⭐️ Use plugins array for the necessary Reanimated/Worklets plugin ⭐️
    plugins: [
      // 3. CRITICAL: The Worklets plugin MUST be the last entry in the plugins array
      'react-native-worklets/plugin',
    ],
  };
};