import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, Alert, FlatList, StyleSheet } from 'react-native';

import Cell from '../components/Cell';
import GlassCard from '../components/ui/GlassCard';
import ScreenWrapper from '../components/ui/ScreenWrapper';
import { database } from '../config/firebase';
import { colors } from '../theme/colors';
import { spacing, layout } from '../theme/spacing';
import { buildInitials, dedupeUsersByEmail } from '../utils/chat';

const ChatInfo = ({ route }) => {
  const { chatId, chatName } = route.params;
  const [users, setUsers] = useState([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        const chatRef = doc(database, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);

        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          if (chatData) {
            if (Array.isArray(chatData.users)) {
              setUsers(chatData.users);
            }
            if (chatData.groupName) {
              setGroupName(chatData.groupName);
            }
          } else {
            setUsers([]);
          }
        } else {
          Alert.alert('Error', 'Chat does not exist');
        }
      } catch (error) {
        Alert.alert('Error', 'An error occurred while fetching chat info');
        console.error('Error fetching chat info: ', error);
      }
    };

    fetchChatInfo();
  }, [chatId]);

  const renderUser = ({ item }) => (
    <View style={styles.userContainer}>
      <View style={styles.userAvatar}>
        <Ionicons name="person" size={18} color={colors.textPrimary} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
    </View>
  );

  const uniqueUsers = useMemo(() => dedupeUsersByEmail(users), [users]);

  return (
    <ScreenWrapper>
      <View style={styles.headerSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{buildInitials(chatName)}</Text>
        </View>
        <View style={styles.chatHeader}>
          {groupName ? (
            <>
              <Text style={styles.groupLabel}>Group</Text>
              <Text style={styles.chatTitle}>{chatName}</Text>
            </>
          ) : (
            <Text style={styles.chatTitle}>{chatName}</Text>
          )}
        </View>
      </View>

      <View style={styles.cellContainer}>
        <GlassCard>
          <Cell
            title="About"
            subtitle="Available"
            icon="information-circle-outline"
            iconColor={colors.accent}
            tintColor={colors.surface}
            showForwardIcon={false}
          />
        </GlassCard>
      </View>

      <Text style={styles.usersTitle}>Members</Text>
      <View style={styles.membersContainer}>
        <GlassCard>
          <FlatList
            data={uniqueUsers}
            renderItem={renderUser}
            keyExtractor={(item) => item.email}
            contentContainerStyle={styles.usersList}
          />
        </GlassCard>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    alignSelf: 'center',
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
  avatarLabel: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: 'bold',
  },
  cellContainer: {
    marginBottom: spacing.sm,
    marginHorizontal: layout.pageInset,
  },
  chatHeader: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  chatTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  groupLabel: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xxs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerSection: {
    marginBottom: spacing.md,
    marginTop: layout.pageTopInset,
  },
  membersContainer: {
    flex: 1,
    marginHorizontal: layout.pageInset,
  },
  userAvatar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  userContainer: {
    alignItems: 'center',
    borderBottomColor: colors.divider,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  userEmail: {
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: 2,
  },
  userInfo: {
    marginLeft: spacing.sm,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  usersList: {
    overflow: 'hidden',
  },
  usersTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginHorizontal: layout.pageInset,
    textTransform: 'uppercase',
  },
});

ChatInfo.propTypes = {
  route: PropTypes.object.isRequired,
};

export default ChatInfo;
