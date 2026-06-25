import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { COLORS, globalStyles } from '../components/Theme';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter all fields');
      return;
    }
    setLoading(true);
    const result = await register(email, password);
    setLoading(false);
    
    if (!result.success) {
      setErrorMessage(result.error || 'Unknown registration error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join SafeReport to help your community</Text>

      {errorMessage ? <Text style={{ color: COLORS.error, marginBottom: 16 }}>{errorMessage}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={COLORS.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={COLORS.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    padding: 24,
    justifyContent: 'center',
  },
  title: globalStyles.title,
  subtitle: globalStyles.subtitle,
  input: globalStyles.input,
  button: globalStyles.button,
  buttonText: globalStyles.buttonText,
  link: globalStyles.link,
});
