import 'react-native-get-random-values';
import { registerRootComponent } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { MenuProvider } from 'react-native-popup-menu';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';

import Chat from './screens/Chat';
import Help from './screens/Help';
import Chats from './screens/Chats';
import Login from './screens/Login';
import Users from './screens/Users';
import About from './screens/About';
import Group from './screens/Group';
import SignUp from './screens/SignUp';
import Profile from './screens/Profile';
import Account from './screens/Account';
import Settings from './screens/Settings';
import ChatInfo from './screens/ChatInfo';
import { colors } from './theme/colors';
import ChatMenu from './components/ChatMenu';
import ChatHeader from './components/ChatHeader';
import { configureNotifications } from './services/notificationService';
import { UnreadMessagesContext, UnreadMessagesProvider } from './contexts/UnreadMessagesContext';
import {
  AuthenticatedUserContext,
  AuthenticatedUserProvider,
} from './contexts/AuthenticatedUserContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { unreadCount } = useContext(UnreadMessagesContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = route.name === 'Chats' ? 'chatbubbles' : 'settings';
          iconName += focused ? '' : '-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarAccessibilityLabel: route.name,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomColor: colors.tabBarBorder,
          borderBottomWidth: 0.5,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          color: colors.textPrimary,
          fontSize: 20,
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 0.5,
        },
      })}
    >
      <Tab.Screen
        name="Chats"
        options={{
          headerTitle: 'Luna',
          tabBarBadge: unreadCount > 0 ? unreadCount : null,
          tabBarBadgeStyle: {
            backgroundColor: colors.accent,
            color: colors.textPrimary,
            fontSize: 11,
            fontWeight: '700',
          },
        }}
      >
        {() => <Chats />}
      </Tab.Screen>
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
};

const darkStackScreenOptions = {
  headerStyle: {
    backgroundColor: colors.background,
    borderBottomColor: colors.tabBarBorder,
    borderBottomWidth: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  headerBackTitleVisible: false,
  cardStyle: {
    backgroundColor: colors.background,
  },
};

const MainStack = () => (
  <Stack.Navigator screenOptions={darkStackScreenOptions}>
    <Stack.Screen name="Home" component={TabNavigator} options={{ headerShown: false }} />
    <Stack.Screen
      name="Chat"
      component={Chat}
      options={({ route }) => ({
        headerTitle: () => <ChatHeader chatName={route.params.chatName} chatId={route.params.id} />,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ChatMenu chatName={route.params.chatName} chatId={route.params.id} />
          </View>
        ),
      })}
    />
    <Stack.Screen name="Users" component={Users} options={{ title: 'Select User' }} />
    <Stack.Screen name="Profile" component={Profile} />
    <Stack.Screen name="About" component={About} />
    <Stack.Screen name="Help" component={Help} />
    <Stack.Screen name="Account" component={Account} />
    <Stack.Screen name="Group" component={Group} options={{ title: 'New Group' }} />
    <Stack.Screen name="ChatInfo" component={ChatInfo} options={{ title: 'Chat Information' }} />
  </Stack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={Login} />
    <Stack.Screen name="SignUp" component={SignUp} />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const { user } = useContext(AuthenticatedUserContext);

  if (typeof user === 'undefined') {
    return (
      <LinearGradient colors={[colors.background, colors.backgroundEnd]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </LinearGradient>
    );
  }

  return (
    <NavigationContainer
      theme={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: colors.accent,
          background: colors.background,
          card: colors.background,
          text: colors.textPrimary,
          border: colors.tabBarBorder,
          notification: colors.accent,
        },
      }}
    >
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const App = () => {
  useEffect(() => {
    configureNotifications();
  }, []);

  return (
    <MenuProvider>
      <AuthenticatedUserProvider>
        <UnreadMessagesProvider>
          <RootNavigator />
        </UnreadMessagesProvider>
      </AuthenticatedUserProvider>
    </MenuProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export default registerRootComponent(App);
