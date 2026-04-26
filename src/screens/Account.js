import React, { useState } from 'react';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { View, Alert, ScrollView, StyleSheet } from 'react-native';

import Cell from '../components/Cell';
import GlassCard from '../components/ui/GlassCard';
import ScreenWrapper from '../components/ui/ScreenWrapper';
import { auth, database } from '../config/firebase';
import { colors } from '../theme/colors';
import { spacing, layout } from '../theme/spacing';

const Account = () => {
  const [activeAction, setActiveAction] = useState(null);

  const onSignOut = async () => {
    try {
      setActiveAction('logout');
      await signOut(auth);
    } catch (error) {
      Alert.alert('Logout failed', error.message);
    } finally {
      setActiveAction(null);
    }
  };

  const deleteAccount = async () => {
    const currentUser = auth?.currentUser;
    const userEmail = currentUser?.email;

    if (!currentUser || !userEmail) {
      Alert.alert('Delete failed', 'You must be signed in to delete your account.');
      return;
    }

    try {
      setActiveAction('delete');
      await deleteUser(currentUser);
      await deleteDoc(doc(database, 'users', userEmail));
    } catch (error) {
      Alert.alert('Delete failed', error.message);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.card}>
          <Cell
            title="Logout"
            subtitle={activeAction === 'logout' ? 'Signing you out...' : 'Sign out of this device'}
            icon="log-out-outline"
            tintColor={colors.surface}
            accessibilityHint="Shows a confirmation before signing out"
            onPress={() => {
              if (activeAction) {
                return;
              }

              Alert.alert(
                'Logout?',
                'You will need to sign in again to access your chats.',
                [
                  {
                    text: 'Logout',
                    onPress: onSignOut,
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                ],
                { cancelable: true }
              );
            }}
            showForwardIcon={false}
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Cell
            title="Delete my account"
            subtitle={
              activeAction === 'delete'
                ? 'Deleting your account...'
                : 'Permanently remove your profile and local access'
            }
            icon="trash-outline"
            tintColor={colors.dangerLight}
            iconColor={colors.danger}
            accessibilityHint="Shows a destructive confirmation before deleting your account"
            onPress={() => {
              if (activeAction) {
                return;
              }

              Alert.alert(
                'Delete account?',
                'This permanently removes your auth user and profile from this Firebase project.',
                [
                  {
                    text: 'Delete my account',
                    style: 'destructive',
                    onPress: deleteAccount,
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                ],
                { cancelable: true }
              );
            }}
            showForwardIcon={false}
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

export default Account;
