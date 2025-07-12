const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  if (config.devServer) {
    config.devServer.client = {
      ...config.devServer.client,
      overlay: {
        errors: true,
        warnings: false, // disables warning overlay
      },
    };
  }
  return config;
}; 