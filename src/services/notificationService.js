import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';

import { auth, database } from '../config/firebase';

const isExpoGoAndroid =
  Platform.OS === 'android'
  && (
    Constants.executionEnvironment === 'storeClient'
      || Constants.appOwnership === 'expo'
  );

let notificationsEnabled = false;
let notificationsModulePromise;
let notificationHandlerConfigured = false;

const getNotificationsModule = async () => {
  if (isExpoGoAndroid) {
    return null;
  }

  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications').then((Notifications) => {
      if (!notificationHandlerConfigured) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        notificationHandlerConfigured = true;
      }

      return Notifications;
    });
  }

  return notificationsModulePromise;
};

export const configureNotifications = async () => {
  try {
    if (isExpoGoAndroid) {
      notificationsEnabled = false;
      console.log(
        'Skipping expo-notifications setup in Expo Go for Android. Use a development build for push features.'
      );
      return false;
    }

    const Notifications = await getNotificationsModule();

    if (!Notifications) {
      notificationsEnabled = false;
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
      });
    }

    const settings = await Notifications.getPermissionsAsync();

    if (settings.granted) {
      notificationsEnabled = true;
      return true;
    }

    const requestedSettings = await Notifications.requestPermissionsAsync();
    notificationsEnabled = requestedSettings.granted;
    return notificationsEnabled;
  } catch (error) {
    console.log('Notification setup failed', error);
    notificationsEnabled = false;
    return false;
  }
};

/**
 * Get the FCM device push token and save it to the user's Firestore document.
 * Must be called after the user is authenticated.
 */
export const registerPushToken = async () => {
  try {
    const Notifications = await getNotificationsModule();

    if (!Notifications || !notificationsEnabled) {
      return null;
    }

    const currentUser = auth?.currentUser;

    if (!currentUser?.email) {
      return null;
    }

    // Get the native device push token (FCM token on Android, APNs on iOS)
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const pushToken = tokenData?.data;

    if (!pushToken) {
      console.log('Could not retrieve device push token');
      return null;
    }

    // Save token to the user's Firestore document
    await setDoc(
      doc(database, 'users', currentUser.email),
      { pushToken },
      { merge: true }
    );

    console.log('Push token registered:', pushToken.substring(0, 20) + '...');
    return pushToken;
  } catch (error) {
    console.log('Push token registration failed:', error);
    return null;
  }
};

/**
 * Clear the push token from Firestore when user logs out.
 */
export const unregisterPushToken = async () => {
  try {
    const currentUser = auth?.currentUser;

    if (!currentUser?.email) {
      return;
    }

    await setDoc(
      doc(database, 'users', currentUser.email),
      { pushToken: '' },
      { merge: true }
    );
  } catch (error) {
    console.log('Push token cleanup failed:', error);
  }
};

export const scheduleChatNotification = async ({ body, chatId, title }) => {
  if (!notificationsEnabled) {
    return;
  }

  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { chatId },
    },
    trigger: null,
  });
};
