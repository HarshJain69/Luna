import PropTypes from 'prop-types';
import uuid from 'react-native-uuid';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import EmojiModal from 'react-native-emoji-modal';
import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Send, Bubble, GiftedChat, InputToolbar } from 'react-native-gifted-chat';
import { ref, getStorage, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import {
  View,
  Text,
  Alert,
  AppState,
  Keyboard,
  StyleSheet,
  BackHandler,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { auth } from '../config/firebase';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import MessageVideo from '../components/MessageVideo';
import {
  mergeMessages,
  MESSAGE_STATUS,
  normalizeMessage,
} from '../utils/chat';
import {
  markChatAsRead,
  getChatMetadata,
  sendChatMessage,
  ensureChatSchema,
  loadPendingMessages,
  flushPendingMessages,
  removePendingMessage,
  upsertPendingMessage,
  subscribeToChatMessages,
  clearDeliveredPendingMessages,
} from '../services/chatMessageService';

const RenderLoadingUpload = () => (
  <View style={styles.loadingContainerUpload}>
    <ActivityIndicator size="large" color={colors.accent} />
  </View>
);

const RenderLoading = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.accent} />
  </View>
);

const RenderBubble = (props) => (
  <Bubble
    {...props}
    wrapperStyle={{
      right: styles.bubbleRight,
      left: styles.bubbleLeft,
    }}
    textStyle={{
      right: styles.bubbleTextRight,
      left: styles.bubbleTextLeft,
    }}
    timeTextStyle={{
      right: styles.timeTextRight,
      left: styles.timeTextLeft,
    }}
    usernameStyle={styles.usernameStyle}
  />
);

const RenderAttach = (props) => (
  <TouchableOpacity
    {...props}
    accessibilityHint="Attach a photo or video"
    accessibilityLabel="Attach media"
    accessibilityRole="button"
    style={styles.addImageIcon}
  >
    <View>
      <Ionicons name="attach-outline" size={28} color={colors.accent} />
    </View>
  </TouchableOpacity>
);

const RenderInputToolbar = (props, handleEmojiPanel) => (
  <View style={styles.inputBarOuter}>
    <View style={styles.inputBarGlass}>
      <InputToolbar
        {...props}
        renderActions={() => RenderActions(handleEmojiPanel)}
        containerStyle={styles.inputToolbar}
        primaryStyle={styles.inputPrimary}
      />
      <Send
        {...props}
        accessibilityHint="Sends the current message"
        accessibilityLabel="Send message"
        accessibilityRole="button"
      >
        <View style={styles.sendIconContainer}>
          <View style={styles.sendButton}>
            <Ionicons name="arrow-up" size={20} color={colors.textPrimary} />
          </View>
        </View>
      </Send>
    </View>
  </View>
);

const RenderActions = (handleEmojiPanel) => (
  <TouchableOpacity
    accessibilityHint="Open emoji picker"
    accessibilityLabel="Open emojis"
    accessibilityRole="button"
    style={styles.emojiIcon}
    onPress={handleEmojiPanel}
  >
    <View>
      <Ionicons name="happy-outline" size={28} color={colors.accent} />
    </View>
  </TouchableOpacity>
);

const buildOutgoingMessage = (message = {}) =>
  normalizeMessage({
    ...message,
    _id: message._id ?? String(uuid.v4()),
    createdAt: message.createdAt ?? new Date(),
    status: message.status ?? MESSAGE_STATUS.SENDING,
    user: {
      _id: auth?.currentUser?.email,
      name: auth?.currentUser?.displayName,
      avatar: 'https://i.pravatar.cc/300',
      ...message.user,
    },
  });

function Chat({ route }) {
  const [serverMessages, setServerMessages] = useState([]);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const lastReadMessageIdRef = useRef(null);

  const displayedMessages = useMemo(
    () => mergeMessages(serverMessages, pendingMessages),
    [pendingMessages, serverMessages]
  );
  const failedMessagesCount = pendingMessages.filter(
    (message) => message.status === MESSAGE_STATUS.FAILED
  ).length;
  const sendingMessagesCount = pendingMessages.filter(
    (message) => message.status === MESSAGE_STATUS.SENDING
  ).length;

  const syncPendingMessages = useCallback(async () => {
    const storedPendingMessages = await loadPendingMessages(route.params.id);
    setPendingMessages(storedPendingMessages);
  }, [route.params.id]);

  const markLatestMessageAsRead = useCallback(
    async (messages) => {
      const latestMessage = messages[0];

      if (
        !latestMessage?._id ||
        latestMessage.user?._id === auth?.currentUser?.email ||
        lastReadMessageIdRef.current === latestMessage._id
      ) {
        return;
      }

      lastReadMessageIdRef.current = latestMessage._id;
      await markChatAsRead({
        chatId: route.params.id,
        userEmail: auth?.currentUser?.email,
      });
    },
    [route.params.id]
  );

  const sendMessage = useCallback(
    async (message, { showFailureAlert = true } = {}) => {
      const optimisticMessage = buildOutgoingMessage(message);

      setPendingMessages((previousMessages) =>
        mergeMessages([], [
          optimisticMessage,
          ...previousMessages.filter((previousMessage) => previousMessage._id !== optimisticMessage._id),
        ])
      );
      await upsertPendingMessage(route.params.id, optimisticMessage);

      try {
        await sendChatMessage({
          chatId: route.params.id,
          message: optimisticMessage,
        });
        await removePendingMessage(route.params.id, optimisticMessage._id);

        setPendingMessages((previousMessages) =>
          previousMessages.map((previousMessage) =>
            previousMessage._id === optimisticMessage._id
              ? { ...previousMessage, status: MESSAGE_STATUS.SENT }
              : previousMessage
          )
        );
      } catch (error) {
        const failedMessage = {
          ...optimisticMessage,
          errorMessage: error.message,
          status: MESSAGE_STATUS.FAILED,
        };

        setPendingMessages((previousMessages) =>
          previousMessages.map((previousMessage) =>
            previousMessage._id === optimisticMessage._id ? failedMessage : previousMessage
          )
        );
        await upsertPendingMessage(route.params.id, failedMessage);

        if (showFailureAlert) {
          Alert.alert('Message not sent', 'The message is still in the chat. Retry it when you are back online.');
        }
      }
    },
    [route.params.id]
  );

  const retryMessage = useCallback(
    async (message) => {
      const sendingMessage = {
        ...message,
        status: MESSAGE_STATUS.SENDING,
      };

      setPendingMessages((previousMessages) =>
        previousMessages.map((previousMessage) =>
          previousMessage._id === sendingMessage._id ? sendingMessage : previousMessage
        )
      );
      await upsertPendingMessage(route.params.id, sendingMessage);
      await sendMessage(sendingMessage, { showFailureAlert: true });
    },
    [route.params.id, sendMessage]
  );

  useEffect(() => {
    let unsubscribe = () => {};

    const initializeChat = async () => {
      try {
        const chatData = await getChatMetadata(route.params.id);

        if (chatData) {
          await ensureChatSchema({ chatId: route.params.id, chatData });
        }

        await syncPendingMessages();

        unsubscribe = subscribeToChatMessages(
          route.params.id,
          async (messages) => {
            setServerMessages(messages);
            setLoading(false);
            await markLatestMessageAsRead(messages);
          },
          (error) => {
            setLoading(false);
            Alert.alert('Unable to load messages', error.message);
          }
        );

        await flushPendingMessages({ chatId: route.params.id });
      } catch (error) {
        setLoading(false);
        Alert.alert('Unable to open chat', error.message);
      }
    };

    initializeChat();

    return () => unsubscribe();
  }, [markLatestMessageAsRead, route.params.id, syncPendingMessages]);

  useEffect(() => {
    const deliveredMessageIds = serverMessages.map((message) => message._id);

    clearDeliveredPendingMessages(route.params.id, deliveredMessageIds)
      .then((nextPendingMessages) => {
        setPendingMessages(nextPendingMessages);
      })
      .catch((error) => {
        console.log('Unable to reconcile pending messages', error);
      });
  }, [route.params.id, serverMessages]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Keyboard.dismiss();
      if (modal) {
        setModal(false);
        return true;
      }
      return false;
    });

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      if (modal) {
        setModal(false);
      }
    });

    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        flushPendingMessages({ chatId: route.params.id })
          .then(syncPendingMessages)
          .catch((error) => {
            console.log('Unable to flush pending messages', error);
          });
      }
    });

    return () => {
      backHandler.remove();
      keyboardDidShowListener.remove();
      appStateListener.remove();
    };
  }, [modal, route.params.id, syncPendingMessages]);

  const uploadMediaAsync = useCallback(
    async (asset) => {
      setUploading(true);

      try {
        const blob = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.onload = () => resolve(xhr.response);
          xhr.onerror = () => reject(new TypeError('Network request failed'));
          xhr.responseType = 'blob';
          xhr.open('GET', asset.uri, true);
          xhr.send(null);
        });

        const messageId = String(uuid.v4());
        const fileExtension = asset.uri.split('.').pop()?.split('?')[0] || 'bin';
        const fileRef = ref(getStorage(), `${messageId}.${fileExtension}`);
        const uploadTask = uploadBytesResumable(fileRef, blob);

        uploadTask.on(
          'state_changed',
          undefined,
          (error) => {
            setUploading(false);
            Alert.alert('Upload failed', error.message);
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setUploading(false);
            await sendMessage({
              _id: messageId,
              createdAt: new Date(),
              text: '',
              image: asset.type === 'image' ? downloadUrl : undefined,
              video: asset.type === 'video' ? downloadUrl : undefined,
            });
          }
        );
      } catch (error) {
        setUploading(false);
        Alert.alert('Upload failed', error.message);
      }
    },
    [sendMessage]
  );

  const pickMedia = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo library access to attach media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      await uploadMediaAsync(result.assets[0]);
    }
  }, [uploadMediaAsync]);

  const captureMedia = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow camera access to capture media.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      await uploadMediaAsync(result.assets[0]);
    }
  }, [uploadMediaAsync]);

  const handleAttachmentPress = useCallback(() => {
    Alert.alert('Share media', 'Choose how to attach media to this chat.', [
      { text: 'Take photo or video', onPress: captureMedia },
      { text: 'Choose from library', onPress: pickMedia },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [captureMedia, pickMedia]);

  const handleEmojiPanel = useCallback(() => {
    setModal((prevModal) => {
      Keyboard.dismiss();
      return !prevModal;
    });
  }, []);

  const renderTicks = useCallback((currentMessage) => {
    if (!currentMessage || currentMessage.user?._id !== auth?.currentUser?.email) {
      return null;
    }

    switch (currentMessage.status) {
      case MESSAGE_STATUS.SENDING:
        return <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.6)" />;
      case MESSAGE_STATUS.FAILED:
        return <Ionicons name="alert-circle-outline" size={14} color="#ffa0a0" />;
      case MESSAGE_STATUS.READ:
        return <Ionicons name="checkmark-done" size={14} color="#a5b4fc" />;
      default:
        return <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.7)" />;
    }
  }, []);

  const handleMessageLongPress = useCallback(
    (_context, message) => {
      if (message.status !== MESSAGE_STATUS.FAILED) {
        return;
      }

      Alert.alert('Failed message', 'Retry sending this message?', [
        {
          text: 'Retry',
          onPress: () => retryMessage(message),
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const nextPendingMessages = pendingMessages.filter(
              (pendingMessage) => pendingMessage._id !== message._id
            );

            setPendingMessages(nextPendingMessages);
            await removePendingMessage(route.params.id, message._id);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [pendingMessages, retryMessage, route.params.id]
  );

  return (
    <>
      {uploading && RenderLoadingUpload()}
      <LinearGradient
        colors={[colors.background, colors.backgroundEnd]}
        style={styles.gradientContainer}
      >
        <GiftedChat
          messages={displayedMessages}
          showAvatarForEveryMessage={false}
          showUserAvatar={false}
          onSend={(messagesToSend) => sendMessage(messagesToSend[0])}
          imageStyle={{ height: 212, width: 212, borderRadius: 16 }}
          messagesContainerStyle={styles.messagesContainer}
          textInputStyle={styles.textInput}
          textInputProps={{
            placeholderTextColor: colors.textMuted,
          }}
          user={{
            _id: auth?.currentUser?.email,
            name: auth?.currentUser?.displayName,
            avatar: 'https://i.pravatar.cc/300',
          }}
          renderBubble={RenderBubble}
          renderMessageVideo={MessageVideo}
          renderSend={(props) => RenderAttach({ ...props, onPress: handleAttachmentPress })}
          renderUsernameOnMessage
          renderAvatarOnTop
          renderInputToolbar={(props) => RenderInputToolbar(props, handleEmojiPanel)}
          minInputToolbarHeight={64}
          scrollToBottom
          onPressActionButton={handleEmojiPanel}
          scrollToBottomStyle={styles.scrollToBottomStyle}
          renderLoading={loading ? RenderLoading : undefined}
          renderTicks={renderTicks}
          renderChatFooter={() => {
            if (uploading) {
              return <Text style={styles.statusBanner}>Uploading media...</Text>;
            }

            if (failedMessagesCount > 0) {
              return (
                <Text style={styles.statusBanner}>
                  {failedMessagesCount} message{failedMessagesCount > 1 ? 's' : ''} failed. Long-press to retry or remove.
                </Text>
              );
            }

            if (sendingMessagesCount > 0) {
              return (
                <Text style={styles.statusBanner}>
                  Sending {sendingMessagesCount} message{sendingMessagesCount > 1 ? 's' : ''}...
                </Text>
              );
            }

            return null;
          }}
          onLongPress={handleMessageLongPress}
        />
      </LinearGradient>

      {modal && (
        <EmojiModal
          onPressOutside={handleEmojiPanel}
          modalStyle={styles.emojiModal}
          containerStyle={styles.emojiContainerModal}
          backgroundStyle={styles.emojiBackgroundModal}
          columns={5}
          emojiSize={66}
          activeShortcutColor={colors.accent}
          onEmojiSelected={(emoji) => {
            sendMessage({
              _id: String(uuid.v4()),
              createdAt: new Date(),
              text: emoji,
            });
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  addImageIcon: {
    alignItems: 'center',
    borderRadius: 22,
    bottom: 4,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  bubbleLeft: {
    backgroundColor: colors.bubbleReceived,
    borderColor: colors.bubbleReceivedBorder,
    borderRadius: 20,
    borderWidth: 0.5,
    marginBottom: spacing.xxs,
    paddingVertical: 2,
  },
  bubbleRight: {
    backgroundColor: colors.bubbleSent,
    borderColor: colors.bubbleSentBorder,
    borderRadius: 20,
    borderWidth: 0.5,
    marginBottom: spacing.xxs,
    paddingVertical: 2,
  },
  bubbleTextLeft: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextRight: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
  emojiBackgroundModal: {},
  emojiContainerModal: {
    height: 348,
    width: 396,
  },
  emojiIcon: {
    alignItems: 'center',
    borderRadius: 22,
    bottom: 4,
    height: 44,
    justifyContent: 'center',
    marginLeft: 4,
    width: 44,
  },
  emojiModal: {},
  gradientContainer: {
    flex: 1,
  },
  inputBarGlass: {
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderRadius: 28,
    borderWidth: 0.5,
    flexDirection: 'row',
    marginHorizontal: spacing.sm,
    paddingRight: spacing.xxs,
  },
  inputBarOuter: {
    paddingBottom: spacing.xs,
    paddingTop: spacing.xxs,
  },
  inputPrimary: {
    alignItems: 'center',
  },
  inputToolbar: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.xxs,
    paddingVertical: spacing.xxs,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainerUpload: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 999,
  },
  messagesContainer: {
    backgroundColor: 'transparent',
    paddingBottom: spacing.xs,
  },
  scrollToBottomStyle: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  sendIconContainer: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginHorizontal: spacing.xxs,
    width: 44,
  },
  statusBanner: {
    color: colors.textSecondary,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  textInput: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    paddingTop: 8,
  },
  timeTextLeft: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  timeTextRight: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
  },
  usernameStyle: {
    color: colors.accentLight,
    fontSize: 12,
    fontWeight: '600',
  },
});

Chat.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default Chat;
