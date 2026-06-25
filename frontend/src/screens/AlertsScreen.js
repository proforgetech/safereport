import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import client from '../api/client';
import { COLORS, globalStyles } from '../components/Theme';

export default function AlertsScreen({ navigation }) {
  const [myIncidents, setMyIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [incidentsRes, alertsRes] = await Promise.all([
        client.get('/users/me/incidents'),
        client.get('/alerts')
      ]);
      setMyIncidents(incidentsRes.data);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.log('Failed to fetch tracking data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

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

  const getAlertColor = (messageText) => {
    if (messageText.startsWith('[CRITICAL]')) return COLORS.error;
    if (messageText.startsWith('[ADVISORY]')) return '#FFB300';
    return COLORS.secondary;
  };

  const getAlertBgColor = (messageText) => {
    if (messageText.startsWith('[CRITICAL]')) return 'rgba(207, 102, 121, 0.1)';
    if (messageText.startsWith('[ADVISORY]')) return 'rgba(255, 179, 0, 0.1)';
    return 'rgba(3, 218, 198, 0.1)';
  };

  const cleanMessage = (messageText) => {
    return messageText.replace(/^\[(CRITICAL|ADVISORY|INFORMATION)\]\s*/, '');
  };

  const getAlertTag = (messageText) => {
    const match = messageText.match(/^\[(CRITICAL|ADVISORY|INFORMATION)\]/);
    return match ? match[1] : 'ALERT';
  };

  const renderIncident = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('UserIncidentDetail', { incidentId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.typeText}>{item.type}</Text>
        <Text style={styles.arrowText}>→</Text>
      </View>
      <Text style={styles.descriptionText} numberOfLines={1}>{item.description}</Text>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[styles.statusValue, { color: getStatusColor(item.status) }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tracking & Alerts</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={myIncidents}
          keyExtractor={item => item.id.toString()}
          renderItem={renderIncident}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListHeaderComponent={
            <View>
              <Text style={styles.sectionHeader}>My Reported Incidents</Text>
              {myIncidents.length === 0 && (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>You haven't reported any incidents yet.</Text>
                </View>
              )}
            </View>
          }
          ListFooterComponent={
            <View style={{ marginTop: 24 }}>
              <Text style={styles.sectionHeader}>Area Alerts</Text>
              {alerts.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No alerts in your area.</Text>
                </View>
              ) : (
                alerts.map(alert => {
                  const color = getAlertColor(alert.message);
                  const bg = getAlertBgColor(alert.message);
                  const tag = getAlertTag(alert.message);
                  const msg = cleanMessage(alert.message);
                  return (
                    <View key={alert.id} style={[styles.alertCard, { borderLeftColor: color, backgroundColor: bg }]}>
                      <Text style={[styles.alertTag, { color }]}>{tag} • {alert.area.toUpperCase()}</Text>
                      <Text style={styles.alertDescription}>{msg}</Text>
                      <Text style={styles.alertTime}>
                        🕒 {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(alert.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    padding: 16,
  },
  title: {
    ...globalStyles.title,
    marginBottom: 20,
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  arrowText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  descriptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginRight: 6,
  },
  statusValue: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    fontSize: 13,
  },
  alertCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertTag: {
    fontWeight: 'bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  alertDescription: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  alertTime: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'right',
  },
});
