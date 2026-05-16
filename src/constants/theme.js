export const COLORS = {
  primary: '#FF6B44',     // New Morgan Orange
  secondary: '#A5C07B',   // New Morgan Green
  accent: '#FF6B44',      // Matching Orange for consistency
  background: '#E8E4D9',  // Image-accurate Beige background
  white: '#ffffff',
  black: '#231F20',       // Deep Carbon Black
  gray: {
    100: '#F5F1E9',       
    200: '#E8E4D9',       // Matches background
    300: '#A39E93',       // Muted brown-gray for text
    400: '#94a3b8',
    500: '#64748b',
  },
  success: '#A5C07B',
  warning: '#FDBB2D',
  danger: '#EF4444',
  transparent: 'transparent',
  gold: '#C9A227',
  slate: '#64748b',
  taupe: '#8B7E74',
};

export const SHADOWS = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.02, // Extremely subtle
    shadowRadius: 20,
    elevation: 0, // Removing elevation to avoid square shadows on Android
  },
  medium: {
    shadowColor: '#282829',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 4,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const SIZES = {
  radius: 12,
  radius_sm: 8,
  radius_lg: 20,
};


