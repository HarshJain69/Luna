import React from 'react';
import PropTypes from 'prop-types';
import { useNavigation } from '@react-navigation/native';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';

import { buildInitials } from '../utils/chat';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const ChatHeader = ({ chatName, chatId }) => {
  const navigation = useNavigation();
  const handleOpenChatInfo = () => navigation.navigate('ChatInfo', { chatId, chatName });

  return (
    <TouchableOpacity
      accessibilityHint="Opens chat details"
      accessibilityLabel={`${chatName}. Open chat details`}
      accessibilityRole="button"
      style={styles.container}
      onPress={handleOpenChatInfo}
    >
      <View style={styles.avatar}>
        <View>
          <Text style={styles.avatarLabel}>{buildInitials(chatName)}</Text>
        </View>
      </View>

      <Text style={styles.chatName}>{chatName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 40,
  },
  avatarLabel: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  chatName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
});

ChatHeader.propTypes = {
  chatName: PropTypes.string.isRequired,
  chatId: PropTypes.string.isRequired,
};

export default ChatHeader;
