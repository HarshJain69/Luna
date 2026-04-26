import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { View, Alert, Share, Linking, ScrollView, StyleSheet } from 'react-native';

import Cell from '../components/Cell';
import { auth } from '../config/firebase';
import ContactRow from '../components/ContactRow';
import GlassCard from '../components/ui/GlassCard';
import ScreenWrapper from '../components/ui/ScreenWrapper';
import { colors } from '../theme/colors';
import { spacing, layout } from '../theme/spacing';

const Settings = ({ navigation }) => {
  const githubUrl = 'https://github.com/Ctere1/react-native-chat';

  const openExternalLink = useCallback(async (url, errorTitle) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(errorTitle, error.message);
    }
  }, []);

  const handleInviteFriend = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out Luna – The Moon Project: ${githubUrl}`,
      });
    } catch (error) {
      Alert.alert('Unable to share', error.message);
    }
  }, [githubUrl]);

  const handleOpenProfile = useCallback(() => navigation.navigate('Profile'), [navigation]);
  const handleOpenAccount = useCallback(() => navigation.navigate('Account'), [navigation]);
  const handleOpenHelp = useCallback(() => navigation.navigate('Help'), [navigation]);
  const handleOpenAbout = useCallback(() => navigation.navigate('About'), [navigation]);
  const handleOpenGithub = useCallback(
    () => openExternalLink(githubUrl, 'Unable to open GitHub'),
    [githubUrl, openExternalLink]
  );

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.card}>
          <ContactRow
            name={auth?.currentUser?.displayName ?? 'No name'}
            subtitle={auth?.currentUser?.email ?? 'No email'}
            onPress={handleOpenProfile}
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Cell
            title="Account"
            subtitle="Privacy, logout, and account deletion"
            icon="key-outline"
            onPress={handleOpenAccount}
            tintColor={colors.surface}
            accessibilityHint="Opens account actions"
          />

          <Cell
            title="Help"
            subtitle="Support, troubleshooting, and project help"
            icon="help-circle-outline"
            tintColor={colors.surface}
            onPress={handleOpenHelp}
            accessibilityHint="Opens help and support"
          />

          <Cell
            title="About"
            subtitle="Project details and Luna information"
            icon="information-circle-outline"
            tintColor={colors.surface}
            onPress={handleOpenAbout}
            accessibilityHint="Opens app information"
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Cell
            title="Invite a friend"
            subtitle="Share Luna with someone you trust"
            icon="people-outline"
            tintColor={colors.surface}
            onPress={handleInviteFriend}
            showForwardIcon={false}
            accessibilityHint="Opens the system share sheet"
          />

          <Cell
            title="Open source project"
            subtitle="View the repository and release history"
            icon="logo-github"
            tintColor={colors.surface}
            onPress={handleOpenGithub}
            accessibilityHint="Opens the GitHub repository in your browser"
          />
        </GlassCard>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  content: {
    paddingBottom: spacing.lg,
    paddingHorizontal: layout.pageInset,
    paddingTop: layout.pageTopInset,
  },
});

Settings.propTypes = {
  navigation: PropTypes.object.isRequired,
};

export default Settings;
