import React from 'react';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, StyleSheet } from 'react-native';

import { buildInitials } from '../utils/chat';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import ScalePressable from './ui/AnimatedPressable';

const ContactRow = ({
  name,
  subtitle,
  onPress,
  style,
  onLongPress,
  selected,
  showForwardIcon = true,
  subtitle2,
  newMessageCount,
}) => (
  <ScalePressable
    accessibilityHint={newMessageCount > 0 ? `${newMessageCount} unread messages` : undefined}
    accessibilityLabel={`${name}. ${subtitle}${subtitle2 ? `. ${subtitle2}` : ''}`}
    accessibilityRole="button"
    style={[styles.row, style]}
    onPress={onPress}
    onLongPress={onLongPress}
  >
    <View style={styles.avatar}>
      <Text style={styles.avatarLabel}>{buildInitials(name)}</Text>
    </View>

    <View style={styles.textsContainer}>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
    </View>

    <View style={styles.rightContainer}>
      <Text style={styles.subtitle2}>{subtitle2}</Text>

      {newMessageCount > 0 && (
        <View style={styles.newMessageBadge}>
          <Text style={styles.newMessageText}>{newMessageCount}</Text>
        </View>
      )}

      {selected && (
        <View style={styles.overlay}>
          <Ionicons name="checkmark-outline" size={16} color="white" />
        </View>
      )}

      {showForwardIcon && <Ionicons name="chevron-forward-outline" size={20} color={colors.textTertiary} />}
    </View>
  </ScalePressable>
);

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 26,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  avatarLabel: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  newMessageBadge: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    justifyContent: 'center',
    marginBottom: spacing.xxs,
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newMessageText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.glassBorder,
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 22,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    minWidth: 52,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.divider,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 18,
    marginTop: spacing.xxs,
    maxWidth: 200,
  },
  subtitle2: {
    color: colors.textTertiary,
    fontSize: 12,
    marginBottom: spacing.xxs,
  },
  textsContainer: {
    flex: 1,
    marginStart: spacing.sm,
  },
});

ContactRow.propTypes = {
  name: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  style: PropTypes.object,
  onLongPress: PropTypes.func,
  selected: PropTypes.bool,
  showForwardIcon: PropTypes.bool,
  subtitle2: PropTypes.string,
  newMessageCount: PropTypes.number,
};

export default ContactRow;
