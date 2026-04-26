import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, FlatList, StyleSheet } from 'react-native';
import { query, where, orderBy, collection, onSnapshot } from 'firebase/firestore';

import Cell from '../components/Cell';
import ContactRow from '../components/ContactRow';
import GlassCard from '../components/ui/GlassCard';
import ScreenWrapper from '../components/ui/ScreenWrapper';
import { auth, database } from '../config/firebase';
import { createDirectChat } from '../services/chatService';
import { colors } from '../theme/colors';
import { spacing, layout } from '../theme/spacing';
import { backfillCurrentUserChatMetadata } from '../services/chatMessageService';
import { getDisplayName, getUserStatusText, isChatVisibleForUser } from '../utils/chat';

const Users = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [existingChats, setExistingChats] = useState([]);

  useEffect(() => {
    let unsubscribeUsers = () => {};
    let unsubscribeChats = () => {};

    const subscribeToData = async () => {
      await backfillCurrentUserChatMetadata(auth?.currentUser?.email);

      const collectionUserRef = collection(database, 'users');
      const q = query(collectionUserRef, orderBy('name', 'asc'));
      unsubscribeUsers = onSnapshot(q, (snapshot) => {
        setUsers(snapshot.docs);
      });

      const collectionChatsRef = collection(database, 'chats');
      const q2 = query(
        collectionChatsRef,
        where('userEmails', 'array-contains', auth?.currentUser?.email)
      );
      unsubscribeChats = onSnapshot(q2, (snapshot) => {
        const existing = snapshot.docs
          .filter(
            (existingChat) =>
              !existingChat.data().groupName
              && isChatVisibleForUser(existingChat.data(), auth?.currentUser?.email)
          )
          .map((existingChat) => ({
            chatId: existingChat.id,
            userEmails:
              existingChat.data().userEmails
              ?? (existingChat.data().users ?? []).map((chatUser) => chatUser.email),
          }));
        setExistingChats(existing);
      });
    };

    subscribeToData().catch((error) => {
      Alert.alert('Unable to load users', error.message);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeChats();
    };
  }, []);

  const handleNewGroup = useCallback(() => {
    navigation.navigate('Group');
  }, [navigation]);

  const handleNavigate = useCallback(
    async (user) => {
      let navigationChatID = '';
      let messageYourselfChatID = '';
      const selectedUser = user.data();

      existingChats.forEach((existingChat) => {
        const isCurrentUserInTheChat = existingChat.userEmails.includes(auth?.currentUser?.email);
        const isMessageYourselfExists = existingChat.userEmails.filter(
          (email) => email === selectedUser.email
        ).length;

        if (
          isCurrentUserInTheChat &&
          existingChat.userEmails.includes(selectedUser.email)
        ) {
          navigationChatID = existingChat.chatId;
        }

        if (isMessageYourselfExists === 2) {
          messageYourselfChatID = existingChat.chatId;
        }

        if (auth?.currentUser?.email === selectedUser.email) {
          navigationChatID = '';
        }
      });

      try {
        if (messageYourselfChatID) {
          navigation.navigate('Chat', { id: messageYourselfChatID, chatName: handleName(user) });
        } else if (navigationChatID) {
          navigation.navigate('Chat', { id: navigationChatID, chatName: handleName(user) });
        } else {
          const chatId = await createDirectChat({
            currentUser: auth?.currentUser,
            otherUser: selectedUser,
          });

          navigation.navigate('Chat', { id: chatId, chatName: handleName(user) });
        }
      } catch (error) {
        Alert.alert('Unable to open chat', error.message);
      }
    },
    [existingChats, handleName, navigation]
  );

  const handleSubtitle = useCallback(
    (user) => getUserStatusText(user.data().email, auth?.currentUser?.email),
    []
  );

  const handleName = useCallback(
    (user) => getDisplayName(user.data(), auth?.currentUser?.email),
    []
  );

  const renderUser = useCallback(
    ({ item }) => (
      <ContactRow
        name={handleName(item)}
        subtitle={handleSubtitle(item)}
        onPress={() => handleNavigate(item)}
        showForwardIcon={false}
      />
    ),
    [handleName, handleNavigate, handleSubtitle]
  );

  const renderUsersHeader = useCallback(
    () => <Text style={styles.registeredUsersLabel}>Registered users</Text>,
    []
  );

  return (
    <ScreenWrapper>
      <Cell
        title="New group"
        icon="people"
        tintColor={colors.accent}
        onPress={handleNewGroup}
        style={styles.newGroupCell}
      />

      {users.length === 0 ? (
        <View style={styles.pageContent}>
          <GlassCard style={styles.listCard}>
            <View style={styles.blankContainer}>
              <Text style={styles.textContainer}>No registered users yet</Text>
            </View>
          </GlassCard>
        </View>
      ) : (
        <View style={styles.pageContent}>
          <GlassCard style={styles.listCard}>
            <FlatList
              data={users}
              renderItem={renderUser}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={renderUsersHeader}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
            />
          </GlassCard>
        </View>
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  blankContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  listCard: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  newGroupCell: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    marginHorizontal: layout.pageInset,
    marginTop: layout.pageTopInset,
    overflow: 'hidden',
  },
  pageContent: {
    flex: 1,
    paddingBottom: spacing.lg,
    paddingHorizontal: layout.pageInset,
    paddingTop: layout.pageTopInset,
  },
  registeredUsersLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textContainer: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '300',
  },
});

export default Users;
