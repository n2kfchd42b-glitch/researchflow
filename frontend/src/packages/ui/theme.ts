// ─── Shared Theme Tokens ──────────────────────────────────────────────────────
// Single source of truth for product-specific theming.
// Import the token map and look up by ProductContext value.

export type ProductContext = 'student' | 'ngo' | 'journal';

export interface ThemeToken {
  accent: string;
  accentDark: string;
  accentLight: string;
  accentBg: string;
  mode: 'wizard' | 'dashboard' | 'verification';
  fontWeightStrong: number;
  // Mobile breakpoints (min-width px)
  breakpoints: { sm: number; md: number; lg: number };
}

export const THEME_TOKENS: Record<ProductContext, ThemeToken> = {
  student: {
    accent: '#1a5c3a',
    accentDark: '#134429',
    accentLight: '#5A8A6A',
    accentBg: '#E9F7EF',
    mode: 'wizard',
    fontWeightStrong: 700,
    breakpoints: { sm: 480, md: 768, lg: 1024 },
  },
  ngo: {
    accent: '#c8793a',
    accentDark: '#9a5520',
    accentLight: '#e8a06a',
    accentBg: '#FDF3EA',
    mode: 'dashboard',
    fontWeightStrong: 700,
    breakpoints: { sm: 480, md: 768, lg: 1024 },
  },
  journal: {
    accent: '#2a4a7a',
    accentDark: '#1a2e4a',
    accentLight: '#5b7fba',
    accentBg: '#EEF2F9',
    mode: 'verification',
    fontWeightStrong: 700,
    breakpoints: { sm: 480, md: 768, lg: 1024 },
  },
};

export function getTheme(context: ProductContext): ThemeToken {
  return THEME_TOKENS[context];
}
