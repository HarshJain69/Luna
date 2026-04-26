import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import Cell from '../components/Cell';
import GlassCard from '../components/ui/GlassCard';
import ScreenWrapper from '../components/ui/ScreenWrapper';
import { auth } from '../config/firebase';
import { buildInitials } from '../utils/chat';
import { colors } from '../theme/colors';
import { spacing, layout } from '../theme/spacing';

const Profile = () => {
  const initials = buildInitials(auth?.currentUser?.displayName || auth?.currentUser?.email || '');

  return (
    <ScreenWrapper>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{initials}</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <GlassCard>
          <Cell
            title="Name"
            icon="person-outline"
            subtitle={auth?.currentUser?.displayName || 'No name set'}
            showForwardIcon={false}
            tintColor={colors.surface}
            style={styles.cellDivider}
          />

          <Cell
            title="Email"
            subtitle={auth?.currentUser?.email}
            icon="mail-outline"
            showForwardIcon={false}
            tintColor={colors.surface}
            style={styles.cellDivider}
          />

          <Cell
            title="About"
            subtitle="Available"
            icon="information-circle-outline"
            showForwardIcon={false}
            tintColor={colors.surface}
          />
        </GlassCard>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    width: 96,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  avatarLabel: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: 'bold',
  },
  cellDivider: {
    borderBottomColor: colors.divider,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: layout.pageInset,
    width: '100%',
  },
});

export default Profile;
