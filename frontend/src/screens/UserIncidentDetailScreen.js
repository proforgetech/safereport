import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Dimensions } from 'react-native';
import client from '../api/client';
import { COLORS, globalStyles } from '../components/Theme';

export default function UserIncidentDetailScreen({ route, navigation }) {
  const { incidentId } = route.params;
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchIncidentDetail = async () => {
    try {
      // Fetch only the current user's incidents to enforce privacy
      const response = await client.get('/users/me/incidents');
      const found = response.data.find(i => i.id === incidentId);
      if (found) {
        setIncident(found);
      } else {
        Alert.alert('Error', 'Incident not found or unauthorized access');
        navigation.goBack();
      }
    } catch (error) {
      console.log('Failed to fetch user incident details', error);
      Alert.alert('Error', 'Failed to retrieve incident status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentDetail();
  }, [incidentId]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!incident) return null;

  // Resolve Image URI
  let evidenceImageUri = null;
  if (incident.evidence && incident.evidence.length > 0) {
    const filePath = incident.evidence[0].file_path;
    const filename = filePath.split(/[\\/]/).pop();
    const baseUrl = client.defaults.baseURL || 'http://192.168.120.250:8000';
    evidenceImageUri = `${baseUrl}/uploads/${filename}`;
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return COLORS.secondary;
      case 'responded':
        return '#FFB300';
      default:
        return COLORS.primary;
    }
  };

  const getStatusIndex = (status) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 2;
      case 'responded':
        return 1;
      default:
        return 0;
    }
  };

  const statusIdx = getStatusIndex(incident.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Incident Tracker</Text>
      </View>

      {/* Incident Details Card */}
      <View style={styles.detailCard}>
        <View style={styles.titleRow}>
          <Text style={styles.typeText}>{incident.type}</Text>
          <View style={[styles.statusBadge, { borderColor: getStatusColor(incident.status) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(incident.status) }]}>
              {incident.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.timestamp}>
          📅 Submitted on {new Date(incident.timestamp).toLocaleString()}
        </Text>
        
        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.descriptionText}>{incident.description}</Text>
      </View>

      {/* Interactive Status Timeline Tracker */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Resolution Progress</Text>
        
        <View style={styles.timeline}>
          {/* Step 1: Reported */}
          <View style={styles.timelineStep}>
            <View style={[styles.stepDot, styles.stepCompleted]}>
              <Text style={styles.stepDotText}>✓</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Report Submitted</Text>
              <Text style={styles.stepSub}>Your incident was logged in the secure system.</Text>
            </View>
          </View>
          
          <View style={[styles.timelineLine, statusIdx >= 1 && styles.lineCompleted]} />

          {/* Step 2: Under Review / Responded */}
          <View style={styles.timelineStep}>
            <View style={[styles.stepDot, statusIdx >= 1 ? styles.stepCompleted : styles.stepPending]}>
              {statusIdx >= 1 ? <Text style={styles.stepDotText}>✓</Text> : <Text style={styles.stepDotText}>2</Text>}
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, statusIdx < 1 && styles.textPending]}>Dispatcher Review</Text>
              <Text style={styles.stepSub}>Admins are reviewing details and dispatching community alerts.</Text>
            </View>
          </View>

          <View style={[styles.timelineLine, statusIdx >= 2 && styles.lineCompleted]} />

          {/* Step 3: Resolved */}
          <View style={styles.timelineStep}>
            <View style={[styles.stepDot, statusIdx >= 2 ? styles.stepCompleted : styles.stepPending]}>
              {statusIdx >= 2 ? <Text style={styles.stepDotText}>✓</Text> : <Text style={styles.stepDotText}>3</Text>}
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, statusIdx < 2 && styles.textPending]}>Resolved</Text>
              <Text style={styles.stepSub}>Emergency responders handled the hazard. Report closed.</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Location Details */}
      <View style={styles.locationCard}>
        <Text style={styles.sectionTitle}>📍 Location Coordinates</Text>
        <Text style={styles.coordsText}>
          Latitude: {incident.latitude.toFixed(6)} • Longitude: {incident.longitude.toFixed(6)}
        </Text>
      </View>

      {/* Photos */}
      {evidenceImageUri && (
        <View style={styles.evidenceCard}>
          <Text style={styles.sectionTitle}>📎 Uploaded Evidence</Text>
          <Image source={{ uri: evidenceImageUri }} style={styles.evidenceImage} resizeMode="cover" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 60,
  },
  detailCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timestamp: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  descriptionText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  locationCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  coordsText: {
    color: COLORS.text,
    fontSize: 14,
  },
  evidenceCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  evidenceImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  timelineCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCompleted: {
    backgroundColor: COLORS.secondary,
  },
  stepPending: {
    backgroundColor: COLORS.border,
  },
  stepDotText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepContent: {
    marginLeft: 16,
    flex: 1,
  },
  stepTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  stepSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  textPending: {
    color: COLORS.textSecondary,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.border,
    marginLeft: 11,
    marginVertical: 4,
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: COLORS.secondary,
  },
});
