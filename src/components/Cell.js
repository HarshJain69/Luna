import React from 'react';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const Cell = ({
  title,
  icon,
  iconColor = colors.textPrimary,
  tintColor,
  style,
  onPress,
  secondIcon,
  subtitle,
  showForwardIcon = true,
  accessibilityHint,
}) => (
  <TouchableOpacity
    accessibilityHint={accessibilityHint}
    accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
    accessibilityRole={onPress ? 'button' : 'text'}
    style={[styles.cell, style]}
    onPress={onPress}
  >
    <View style={[styles.iconContainer, { backgroundColor: tintColor || colors.surface }]}>
      <Ionicons name={icon} size={24} marginStart={4} color={iconColor} />
    </View>

    <View style={styles.textsContainer}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    {showForwardIcon && <Ionicons name={secondIcon ?? 'chevron-forward-outline'} size={20} color={colors.textTertiary} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconContainer: {
    alignContent: 'center',
    borderRadius: spacing.xs,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xxs,
  },
  textsContainer: {
    flex: 1,
    marginStart: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 20,
  },
});

Cell.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  iconColor: PropTypes.string,
  tintColor: PropTypes.string,
  style: PropTypes.object,
  onPress: PropTypes.func,
  secondIcon: PropTypes.string,
  subtitle: PropTypes.string,
  showForwardIcon: PropTypes.bool,
  accessibilityHint: PropTypes.string,
};

export default Cell;
