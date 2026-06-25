import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Dimensions } from 'react-native';
import client from '../api/client';
import { COLORS, globalStyles } from '../components/Theme';

const { width } = Dimensions.get('window');

export default function AdminIncidentDetailScreen({ route, navigation }) {
  const { incidentId } = route.params;
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchIncidentDetail = async () => {
    try {
      // The current backend get /incidents returns all incidents including evidence
      const response = await client.get('/incidents');
      const found = response.data.find(i => i.id === incidentId);
      if (found) {
        setIncident(found);
      } else {
        Alert.alert('Error', 'Incident not found');
        navigation.goBack();
      }
    } catch (error) {
      console.log('Failed to fetch details', error);
      Alert.alert('Error', 'Failed to retrieve incident details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentDetail();
  }, [incidentId]);

  const updateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      await client.patch(`/incidents/${incidentId}`, { status: newStatus });
      Alert.alert('Success', `Incident status updated to: ${newStatus}`);
      fetchIncidentDetail();
    } catch (error) {
      console.log('Failed to update status', error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!incident) return null;

  // Compute Image URL
  let evidenceImageUri = null;
  if (incident.evidence && incident.evidence.length > 0) {
    const filePath = incident.evidence[0].file_path;
    const filename = filePath.split(/[\\/]/).pop();
    // Resolve absolute base URL of client
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
        return COLORS.error;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Report</Text>
      </View>

      {/* Main Info Card */}
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
          📅 {new Date(incident.timestamp).toLocaleString()}
        </Text>

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{incident.description}</Text>
      </View>

      {/* Location Details */}
      <View style={styles.locationCard}>
        <Text style={styles.sectionTitle}>📍 Location Coordinates</Text>
        <View style={styles.coordinateRow}>
          <View style={styles.coordBox}>
            <Text style={styles.coordLabel}>LATITUDE</Text>
            <Text style={styles.coordVal}>{incident.latitude.toFixed(6)}</Text>
          </View>
          <View style={styles.coordBox}>
            <Text style={styles.coordLabel}>LONGITUDE</Text>
            <Text style={styles.coordVal}>{incident.longitude.toFixed(6)}</Text>
          </View>
        </View>
        <View style={styles.mockMap}>
          <Text style={styles.mockMapText}>Map View Pinpoint Ready</Text>
          <Text style={styles.mockMapSub}>Coordinate targeting successful</Text>
        </View>
      </View>

      {/* Evidence Image */}
      {evidenceImageUri ? (
        <View style={styles.evidenceCard}>
          <Text style={styles.sectionTitle}>📎 Photo Evidence</Text>
          <Image source={{ uri: evidenceImageUri }} style={styles.evidenceImage} resizeMode="cover" />
        </View>
      ) : (
        <View style={styles.evidenceCard}>
          <Text style={styles.sectionTitle}>📎 Photo Evidence</Text>
          <Text style={styles.noEvidenceText}>No file attachments provided for this report.</Text>
        </View>
      )}

      {/* Action panel */}
      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>Dispatcher Actions</Text>
        
        {actionLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.actionButtons}>
            {incident.status === 'pending' && (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: 'rgba(255, 179, 0, 0.1)', borderColor: '#FFB300', borderWidth: 1.5 }]} 
                onPress={() => updateStatus('responded')}
              >
                <Text style={[styles.actionBtnText, { color: '#FFB300' }]}>Mark Responded</Text>
              </TouchableOpacity>
            )}
            
            {incident.status !== 'resolved' && (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: 'rgba(3, 218, 198, 0.1)', borderColor: COLORS.secondary, borderWidth: 1.5 }]} 
                onPress={() => updateStatus('resolved')}
              >
                <Text style={[styles.actionBtnText, { color: COLORS.secondary }]}>Mark Resolved</Text>
              </TouchableOpacity>
            )}

            {incident.status === 'resolved' && (
              <View style={styles.resolvedBanner}>
                <Text style={styles.resolvedBannerText}>✓ INCIDENT RESOLVED</Text>
                <Text style={styles.resolvedBannerSub}>This incident is closed. No further action needed.</Text>
              </View>
            )}
          </View>
        )}
      </View>
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
    marginRight: 60, // Balance the back button spacing
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
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  descriptionText: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
  },
  locationCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  coordinateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  coordBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  coordLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  coordVal: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  mockMap: {
    height: 120,
    backgroundColor: '#171717',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
  },
  mockMapText: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  mockMapSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  evidenceCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  evidenceImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noEvidenceText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  actionsCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primaryVariant,
    marginBottom: 16,
  },
  actionsTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButtons: {
    gap: 10,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  resolvedBanner: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(3, 218, 198, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  resolvedBannerText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  resolvedBannerSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});
