import React from 'react';
import PropTypes from 'prop-types';
import { View, Platform, StyleSheet } from 'react-native';

import { colors } from '../../theme/colors';

let BlurView;
try {
  BlurView = require('expo-blur').BlurView;
} catch (e) {
  BlurView = null;
}

const GlassCard = ({ children, style, intensity = 40, blurTint = 'dark' }) => {
  const canBlur = Platform.OS === 'ios' && BlurView;

  if (canBlur) {
    return (
      <View style={[styles.container, style]}>
        <BlurView intensity={intensity} tint={blurTint} style={StyleSheet.absoluteFill} />
        <View style={styles.overlay} />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  // Android / web fallback – no blur, just semi-transparent glass
  return (
    <View style={[styles.container, styles.fallbackBg, style]}>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderColor: colors.glassBorder,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    zIndex: 1,
  },
  fallbackBg: {
    backgroundColor: colors.glass,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.glass,
  },
});

GlassCard.propTypes = {
  blurTint: PropTypes.string,
  children: PropTypes.node,
  intensity: PropTypes.number,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default GlassCard;
