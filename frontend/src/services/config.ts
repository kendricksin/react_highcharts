// src/services/config.ts
/**
 * Configuration service for managing environment variables
 * For React applications, environment variables must start with REACT_APP_
 */

interface Config {
    apiBaseUrl: string;
    defaultChartLimit: number;
    enableDebug: boolean;
  }
  
  // Default values (used if environment variables are not set)
  const defaultConfig: Config = {
    apiBaseUrl: 'http://localhost:8000',
    defaultChartLimit: 10,
    enableDebug: false,
  };
  
  // Load config from environment variables
  const config: Config = {
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL || defaultConfig.apiBaseUrl,
    defaultChartLimit: Number(process.env.REACT_APP_DEFAULT_CHART_LIMIT) || defaultConfig.defaultChartLimit,
    enableDebug: process.env.REACT_APP_ENABLE_DEBUG === 'true' || defaultConfig.enableDebug,
  };
  
  // Helper function to log configuration during development
  const logConfig = (): void => {
    if (config.enableDebug) {
      console.log('App configuration:', config);
    }
  };
  
  // Initialize the configuration
  const initialize = (): void => {
    logConfig();
  };
  
  // Get the configuration
  const getConfig = (): Config => {
    return config;
  };
  
  export default {
    initialize,
    getConfig,
  };