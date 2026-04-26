import React from 'react';
import PropTypes from 'prop-types';
import { StatusBar, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../theme/colors';

const ScreenWrapper = ({ children, style, edges = ['bottom'] }) => (
  <LinearGradient
    colors={[colors.background, colors.backgroundEnd]}
    style={[styles.gradient, style]}
  >
    <StatusBar barStyle="light-content" backgroundColor={colors.background} />
    <SafeAreaView style={styles.safe} edges={edges}>
      {children}
    </SafeAreaView>
  </LinearGradient>
);

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
});

ScreenWrapper.propTypes = {
  children: PropTypes.node,
  edges: PropTypes.array,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default ScreenWrapper;
