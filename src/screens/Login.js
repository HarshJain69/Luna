import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import {
  Text,
  View,
  Alert,
  TextInput,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { auth } from '../config/firebase';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onHandleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Missing details', 'Please enter both your email and password.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
    } catch (error) {
      Alert.alert('Login failed', error.message);
    }
  };

  return (
    <LinearGradient colors={[colors.background, colors.backgroundEnd]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.form}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="moon" size={40} color={colors.accent} />
            </View>
            <Text style={styles.brandName}>Luna</Text>
            <Text style={styles.brandSubtitle}>The Moon Project</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoFocus
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              textContentType="password"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={onHandleLogin}>
            <LinearGradient
              colors={[colors.accent, colors.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonLabel}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  brandName: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: spacing.md,
  },
  brandSubtitle: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 2,
    marginTop: spacing.xxs,
    textTransform: 'uppercase',
  },
  button: {
    borderRadius: 16,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  buttonGradient: {
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
  },
  buttonLabel: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
  },
  footerLink: {
    color: colors.accentLight,
    fontSize: 14,
    fontWeight: '600',
  },
  footerRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: '400',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  input: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 16,
    height: 56,
    paddingVertical: 0,
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  keyboardView: {
    flex: 1,
  },
  logoCircle: {
    alignItems: 'center',
    backgroundColor: colors.accentGlow,
    borderColor: colors.glassBorder,
    borderRadius: 36,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
});

Login.propTypes = {
  navigation: PropTypes.object.isRequired,
};
