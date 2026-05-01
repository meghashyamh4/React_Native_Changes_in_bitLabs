module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        blocklist: null,
        safe: true,
        allowUndefined: true,
      },
    ],
    [
      'module-resolver',
      {
        alias: {
          '@assests': './src/assests',
          '@components': './src/components',
          '@context': './src/context',
          '@models': './src/models',
          '@viewmodel': './src/viewmodel',
          '@routes': './src/routes',
          '@screens': './src/screens',
          '@services': './src/services',
        },
      },
    ],
  
  'react-native-reanimated/plugin',
],
};
