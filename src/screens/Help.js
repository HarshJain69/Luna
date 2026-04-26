import React from 'react';
import { View, Alert, Linking, ScrollView, StyleSheet } from 'react-native';

import Cell from '../components/Cell';
import GlassCard from '../components/ui/GlassCard';
import ScreenWrapper from '../components/ui/ScreenWrapper';
import { colors } from '../theme/colors';
import { spacing, layout } from '../theme/spacing';

const Help = () => {
  const openSupport = async () => {
    try {
      await Linking.openURL('https://github.com/Ctere1/react-native-chat/issues');
    } catch (error) {
      Alert.alert('Unable to open support', error.message);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard>
          <Cell
            title="Contact support"
            subtitle="Open issue reporting and technical help"
            icon="help-buoy-outline"
            tintColor={colors.surface}
            iconColor={colors.accent}
            onPress={openSupport}
            accessibilityHint="Opens the support page in your browser"
          />
          <Cell
            title="Firebase setup"
            subtitle="This project uses the Firebase config you provide"
            icon="cloud-outline"
            tintColor={colors.surface}
            iconColor={colors.success}
            showForwardIcon={false}
            accessibilityHint="Shows Firebase setup guidance"
            onPress={() => {
              Alert.alert(
                'Firebase setup',
                'This repository is a starter app. Authentication, Firestore, Storage, and project policies depend on the Firebase project configured by the person deploying it.'
              );
            }}
          />
          <Cell
            title="Troubleshooting"
            subtitle="Use the repository issues page for bugs and setup problems"
            icon="construct-outline"
            tintColor={colors.surface}
            iconColor={colors.warning}
            showForwardIcon={false}
            accessibilityHint="Shows troubleshooting guidance"
            onPress={() => {
              Alert.alert(
                'Troubleshooting',
                'If something breaks, collect the error details and open an issue in the repository so the behavior can be reproduced and fixed.'
              );
            }}
          />
        </GlassCard>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.lg,
    paddingHorizontal: layout.pageInset,
    paddingTop: layout.pageTopInset,
  },
});

export default Help;
