import PropTypes from 'prop-types';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useMemo, useState, useEffect, createContext } from 'react';

import { auth } from '../config/firebase';
import { registerPushToken, unregisterPushToken } from '../services/notificationService';

export const AuthenticatedUserContext = createContext({});

export const AuthenticatedUserProvider = ({ children }) => {
  const [user, setUser] = useState();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        setUser(authenticatedUser);

        // Register FCM push token when user signs in
        registerPushToken().catch((error) => {
          console.log('Push token registration error:', error);
        });
      } else {
        // Clear push token before setting user to null (logout)
        await unregisterPushToken().catch(() => {});
        setUser(null);
      }
    });
    return unsubscribeAuth;
  }, []);

  const value = useMemo(() => ({ user, setUser }), [user, setUser]);

  return (
    <AuthenticatedUserContext.Provider value={value}>{children}</AuthenticatedUserContext.Provider>
  );
};

AuthenticatedUserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
