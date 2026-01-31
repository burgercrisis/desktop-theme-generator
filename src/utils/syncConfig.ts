// Realtime Theme Sync Configuration

export interface SyncConfig {
  // Path to Opencode theme directory (relative to desktop-theme-generator root)
  opencodeThemePath: string;
  // Custom theme filename
  customThemeFilename: string;
  // Debounce time in milliseconds for file writes
  debounceMs: number;
  // Enable/disable real-time sync
  enabled: boolean;
}

export const defaultConfig: SyncConfig = {
  // Default path: go up from desktop-theme-generator to opencode/packages/ui/src/styles
  opencodeThemePath: '../../opencode/packages/ui/src/styles',
  customThemeFilename: 'custom-theme.css',
  debounceMs: 200,
  enabled: true
};

export const resolveOpencodeThemePath = (config: SyncConfig): string => {
  // In browser context, we can't use Node.js path module directly
  // This will be handled server-side or we need a different approach
  return config.opencodeThemePath;
};

export const getCustomThemeFilePath = (config: SyncConfig): string => {
  return `${config.opencodeThemePath}/${config.customThemeFilename}`;
};
