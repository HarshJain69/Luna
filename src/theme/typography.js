// Luna – The Moon Project
// Typography scale

import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  h1: {
    fontFamily,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  h2: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  h3: {
    fontFamily,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  title: {
    fontFamily,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 25,
  },
  headline: {
    fontFamily,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  callout: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  subhead: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
  },
  footnote: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  caption1: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  caption2: {
    fontFamily,
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 13,
  },
};
