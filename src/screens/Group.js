import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState, useEffect } from 'react';
import { query, orderBy, collection, onSnapshot } from 'firebase/firestore';
import {
  Text,
  View,
  Alert,
  Modal,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import ContactRow from '../components/ContactRow';
import GlassCard from '../components/ui/GlassCard';
import ScreenWrapper from '../components/ui/ScreenWrapper';
import { auth, database } from '../config/firebase';
import { createGroupChat } from '../services/chatService';
import { colors } from '../theme/colors';
import { spacing, layout } from '../theme/spacing';
import { getDisplayName, getUserStatusText } from '../utils/chat';

const Group = () => {
  const navigation = useNavigation();
  const [selectedItems, setSelectedItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useEffect(() => {
    const collectionUserRef = collection(database, 'users');
    const q = query(collectionUserRef, orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        selectedItems.length > 0 && <Text style={styles.itemCount}>{selectedItems.length}</Text>,
    });
  }, [navigation, selectedItems]);

  const handleName = (user) => getDisplayName(user.data(), auth?.currentUser?.email);

  const handleSubtitle = (user) => getUserStatusText(user.data().email, auth?.currentUser?.email);

  const handleOnPress = (user) => {
    selectItems(user);
  };

  const selectItems = (user) => {
    setSelectedItems((prevItems) => {
      if (prevItems.includes(user.id)) {
        return prevItems.filter((item) => item !== user.id);
      }
      return [...prevItems, user.id];
    });
  };

  const getSelected = (user) => selectedItems.includes(user.id);

  const deSelectItems = () => {
    setSelectedItems([]);
  };

  const handleFabPress = () => {
    setModalVisible(true);
  };

  const selectableUsers = useMemo(
    () => users.filter((user) => user.data().email !== auth?.currentUser?.email),
    [users]
  );

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Missing group name', 'Group name cannot be empty.');
      return;
    }

    const usersToAdd = users
      .filter((user) => selectedItems.includes(user.id))
      .map((user) => user.data());

    try {
      setIsCreatingGroup(true);
      const chatId = await createGroupChat({
        currentUser: auth?.currentUser,
        groupName,
        selectedUsers: usersToAdd,
      });

      navigation.navigate('Chat', { id: chatId, chatName: groupName.trim() });
      deSelectItems();
      setModalVisible(false);
      setGroupName('');
    } catch (error) {
      Alert.alert('Unable to create group', error.message);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const renderUser = ({ item }) => (
    <ContactRow
      style={getSelected(item) ? styles.selectedContactRow : undefined}
      name={handleName(item)}
      subtitle={handleSubtitle(item)}
      onPress={() => handleOnPress(item)}
      selected={getSelected(item)}
      showForwardIcon={false}
    />
  );

  return (
    <ScreenWrapper>
      <Pressable style={styles.container} onPress={deSelectItems}>
        {selectableUsers.length === 0 ? (
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
                data={selectableUsers}
                renderItem={renderUser}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
              />
            </GlassCard>
          </View>
        )}
        {selectedItems.length > 0 && (
          <TouchableOpacity style={styles.fab} onPress={handleFabPress} disabled={isCreatingGroup}>
            <View style={styles.fabContainer}>
              <Ionicons name="arrow-forward-outline" size={24} color="white" />
            </View>
          </TouchableOpacity>
        )}
        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.modalBackdrop}>
            <GlassCard style={styles.modalCard}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>Enter Group Name</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setGroupName}
                  value={groupName}
                  placeholder="Group Name"
                  placeholderTextColor={colors.textMuted}
                  editable={!isCreatingGroup}
                  onSubmitEditing={handleCreateGroup}
                />
                <TouchableOpacity
                  style={[styles.createButton, isCreatingGroup ? styles.createButtonDisabled : undefined]}
                  onPress={handleCreateGroup}
                  disabled={isCreatingGroup}
                >
                  {isCreatingGroup ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.createButtonLabel}>Create group</Text>
                  )}
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </Modal>
      </Pressable>
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
  container: {
    flex: 1,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: '100%',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    bottom: layout.fabOffset,
    position: 'absolute',
    right: layout.fabOffset,
  },
  fabContainer: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: layout.fabRadius,
    elevation: 8,
    height: layout.fabSize,
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    width: layout.fabSize,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.textPrimary,
    height: 48,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    width: '100%',
  },
  itemCount: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '400',
    marginRight: spacing.sm,
  },
  listCard: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 88,
    paddingTop: spacing.xs,
  },
  modalBackdrop: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: layout.cardRadius + spacing.xxs,
  },
  modalText: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalView: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  pageContent: {
    flex: 1,
    paddingHorizontal: layout.pageInset,
    paddingTop: layout.pageTopInset,
  },
  selectedContactRow: {
    backgroundColor: colors.accentGlow,
  },
  textContainer: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});

export default Group;
