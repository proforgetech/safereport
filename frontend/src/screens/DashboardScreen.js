import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Dimensions, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { COLORS, globalStyles } from '../components/Theme';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({ ownCount: 0, alertCount: 0 });
  const [recentReports, setRecentReports] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [incidentsRes, alertsRes] = await Promise.all([
        client.get('/users/me/incidents'),
        client.get('/alerts')
      ]);

      const myIncs = incidentsRes.data;
      const sortedIncs = myIncs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentReports(sortedIncs.slice(0, 3)); // show top 3 recent
      setActiveAlerts(alertsRes.data.slice(0, 2)); // show top 2 active alerts

      setStats({
        ownCount: myIncs.length,
        alertCount: alertsRes.data.length,
      });
    } catch (error) {
      console.log('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getAlertColor = (messageText) => {
    if (messageText.startsWith('[CRITICAL]')) return COLORS.error;
    if (messageText.startsWith('[ADVISORY]')) return '#FFB300';
    return COLORS.secondary;
  };

  const cleanMessage = (messageText) => {
    return messageText.replace(/^\[(CRITICAL|ADVISORY|INFORMATION)\]\s*/, '');
  };

  const triggerCall = (serviceName) => {
    Alert.alert('Emergency Call Sim', `Calling ${serviceName}... In a real deployment, this would initiate a telephone call.`);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Hello,</Text>
          <Text style={styles.username}>{user?.email?.split('@')[0] || 'Citizen'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Safety Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: activeAlerts.length > 0 ? 'rgba(207, 102, 121, 0.1)' : 'rgba(3, 218, 198, 0.1)', borderColor: activeAlerts.length > 0 ? COLORS.error : COLORS.secondary }]}>
        <Text style={[styles.statusText, { color: activeAlerts.length > 0 ? COLORS.error : COLORS.secondary }]}>
          {activeAlerts.length > 0 ? '🚨 ACTIVE COMMUNITY WARNINGS' : '🛡️ NEIGHBORHOOD STATUS: STABLE'}
        </Text>
      </View>

      {/* Quick Emergency Actions */}
      <Text style={styles.sectionTitle}>Emergency Support</Text>
      <View style={styles.emergencyRow}>
        <TouchableOpacity style={[styles.emergencyCard, { backgroundColor: 'rgba(207, 102, 121, 0.15)', borderColor: COLORS.error }]} onPress={() => triggerCall('911 Police')}>
          <Text style={styles.emergencyEmoji}>📞</Text>
          <Text style={[styles.emergencyText, { color: COLORS.error }]}>Call Police</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.emergencyCard, { backgroundColor: 'rgba(3, 218, 198, 0.15)', borderColor: COLORS.secondary }]} onPress={() => triggerCall('Safety Escort')}>
          <Text style={styles.emergencyEmoji}>🚶</Text>
          <Text style={[styles.emergencyText, { color: COLORS.secondary }]}>Request Walk</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Incident Reporter link */}
      <TouchableOpacity style={styles.reportShortcut} onPress={() => navigation.navigate('Report')}>
        <Text style={styles.reportShortcutText}>File a Safety Report Now →</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : (
        <>
          {/* Active Area Broadcast Alerts */}
          {activeAlerts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleText}>Latest Alerts</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
                  <Text style={styles.viewAllText}>View All ({stats.alertCount})</Text>
                </TouchableOpacity>
              </View>
              {activeAlerts.map(alert => {
                const color = getAlertColor(alert.message);
                const cleanedMsg = cleanMessage(alert.message);
                return (
                  <View key={alert.id} style={[styles.alertCard, { borderLeftColor: color }]}>
                    <Text style={[styles.alertArea, { color }]}>{alert.area.toUpperCase()}</Text>
                    <Text style={styles.alertMsg} numberOfLines={2}>{cleanedMsg}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Personal Recent Reports */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleText}>My Recent Reports</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
                <Text style={styles.viewAllText}>Track All ({stats.ownCount})</Text>
              </TouchableOpacity>
            </View>
            
            {recentReports.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>You haven't reported any incidents.</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Report')}>
                  <Text style={styles.emptyActionText}>Submit your first report</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentReports.map(incident => (
                <TouchableOpacity 
                  key={incident.id} 
                  style={styles.incidentItem}
                  onPress={() => navigation.navigate('UserIncidentDetail', { incidentId: incident.id })}
                >
                  <View style={styles.incidentRow}>
                    <Text style={styles.incidentType}>{incident.type}</Text>
                    <View style={[styles.badge, { backgroundColor: incident.status === 'resolved' ? 'rgba(3, 218, 198, 0.15)' : incident.status === 'responded' ? 'rgba(255, 179, 0, 0.15)' : 'rgba(187, 134, 252, 0.15)' }]}>
                      <Text style={[styles.badgeText, { color: incident.status === 'resolved' ? COLORS.secondary : incident.status === 'responded' ? '#FFB300' : COLORS.primary }]}>
                        {incident.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.incidentDate}>
                    {new Date(incident.timestamp).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </>
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
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  welcome: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  username: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 8,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusBanner: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emergencyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  emergencyCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  emergencyEmoji: {
    fontSize: 20,
  },
  emergencyText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  reportShortcut: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  reportShortcutText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  viewAllText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertCard: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertArea: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertMsg: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  emptyActionText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  incidentItem: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  incidentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  incidentType: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  incidentDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});
