// Backward-compatible re-exports from the Luna design system
// Legacy code imports from here; new code should import from '../theme'

import { colors as themeColors } from '../theme/colors';
import { spacing as themeSpacing, layout as themeLayout } from '../theme/spacing';

export const colors = {
  primary: themeColors.accent,
  border: themeColors.glassBorder,
  red: themeColors.danger,
  pink: themeColors.accentLight,
  teal: themeColors.accent,
  grey: themeColors.textMuted,
  ...themeColors,
};

export const spacing = themeSpacing;
export const layout = themeLayout;
