import React from 'react';
import { Text, View, ScrollView, StyleSheet } from 'react-native';

import GlassCard from '../components/ui/GlassCard';
import ScreenWrapper from '../components/ui/ScreenWrapper';
import { colors } from '../theme/colors';
import { spacing, layout } from '../theme/spacing';

const sections = [
  {
    title: 'About Luna',
    body:
      'Luna – The Moon Project is a premium messaging experience built with Expo and Firebase. Designed for direct and group messaging, media sharing, and real-time updates.',
  },
  {
    title: 'Your Firebase project',
    body:
      'Auth, Firestore, Storage, security rules, and operational policies come from the Firebase project configured by whoever deploys this app.',
  },
  {
    title: 'Repository support',
    body:
      'For source code, setup guidance, and bug reports, use the GitHub repository linked from Settings.',
  },
];

const About = () => (
  <ScreenWrapper>
    <ScrollView contentContainerStyle={styles.content}>
      {sections.map((section) => (
        <GlassCard key={section.title} style={styles.card}>
          <View style={styles.cardInner}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardBody}>{section.body}</Text>
          </View>
        </GlassCard>
      ))}
    </ScrollView>
  </ScreenWrapper>
);

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  cardBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  cardInner: {
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: layout.pageInset,
    paddingTop: layout.pageTopInset,
  },
});

export default About;
