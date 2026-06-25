import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import client from '../api/client';
import { COLORS, globalStyles } from '../components/Theme';

export default function ReportScreen({ navigation }) {
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access location was denied');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
    Alert.alert('Success', 'Location fetched successfully');
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const submitReport = async () => {
    if (!type || !description || !location) {
      Alert.alert('Error', 'Please provide type, description, and fetch location.');
      return;
    }
    setLoading(true);
    try {
      // 1. Create Incident
      const incidentRes = await client.post('/incidents', {
        type,
        description,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      const incidentId = incidentRes.data.id;

      // 2. Upload Evidence if available
      if (image) {
        const formData = new FormData();
        // Extract filename and type correctly for React Native
        const filename = image.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('file', {
          uri: image.uri,
          name: filename,
          type,
        });

        await client.post(`/incidents/${incidentId}/evidence`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      Alert.alert('Success', 'Incident reported successfully');
      setType('');
      setDescription('');
      setLocation(null);
      setImage(null);
      navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Report Incident</Text>
      <Text style={styles.subtitle}>Help keep the community safe.</Text>

      <TextInput
        style={styles.input}
        placeholder="Incident Type (e.g., Theft, Vandalism)"
        placeholderTextColor={COLORS.textSecondary}
        value={type}
        onChangeText={setType}
      />

      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        placeholder="Description"
        placeholderTextColor={COLORS.textSecondary}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <View style={styles.locationContainer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={fetchLocation}>
          <Text style={styles.secondaryButtonText}>
            {location ? 'Location Captured ✓' : 'Get Current Location'}
          </Text>
        </TouchableOpacity>
        {location && (
          <Text style={styles.locationText}>
            Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
        <Text style={styles.secondaryButtonText}>
          {image ? 'Change Photo Evidence' : 'Attach Photo Evidence'}
        </Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image.uri }} style={styles.imagePreview} />}

      <TouchableOpacity style={[styles.button, { marginTop: 24, marginBottom: 40 }]} onPress={submitReport} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    padding: 24,
  },
  title: globalStyles.title,
  subtitle: globalStyles.subtitle,
  input: globalStyles.input,
  button: globalStyles.button,
  buttonText: globalStyles.buttonText,
  secondaryButton: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  }
});
