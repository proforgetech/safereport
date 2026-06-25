import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { COLORS, globalStyles } from '../components/Theme';

export default function AdminProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, pending: 0, responded: 0, resolved: 0, alertsCount: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [incidentsRes, alertsRes] = await Promise.all([
        client.get('/incidents'),
        client.get('/alerts')
      ]);
      const incs = incidentsRes.data;
      setStats({
        total: incs.length,
        pending: incs.filter(i => i.status === 'pending').length,
        responded: incs.filter(i => i.status === 'responded').length,
        resolved: incs.filter(i => i.status === 'resolved').length,
        alertsCount: alertsRes.data.length,
      });
    } catch (e) {
      console.log('Failed to fetch admin dashboard stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Profile</Text>
      <Text style={styles.subtitle}>Account settings and dispatch stats</Text>

      {/* Info Card */}
      <View style={styles.card}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>👑</Text>
        </View>
        <Text style={styles.emailText}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>SYSTEM ADMINISTRATOR</Text>
        </View>
      </View>

      {/* System Metrics */}
      <Text style={styles.sectionTitle}>System Metrics</Text>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.metricsContainer}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Incidents Reported</Text>
            <Text style={styles.metricValue}>{stats.total}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Pending Action</Text>
            <Text style={[styles.metricValue, { color: COLORS.error }]}>{stats.pending}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Resolved Incidents</Text>
            <Text style={[styles.metricValue, { color: COLORS.secondary }]}>{stats.resolved}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Active Area Broadcasts</Text>
            <Text style={[styles.metricValue, { color: COLORS.primary }]}>{stats.alertsCount}</Text>
          </View>
        </View>
      )}

      {/* Logout Action */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnText}>LOG OUT OF SESSION</Text>
      </TouchableOpacity>
      
      <Text style={styles.footerVersion}>SafeReport Admin Workspace v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    padding: 24,
  },
  title: {
    ...globalStyles.title,
    fontSize: 26,
    color: COLORS.primary,
    marginBottom: 2,
    marginTop: 8,
  },
  subtitle: {
    ...globalStyles.subtitle,
    fontSize: 14,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(187, 134, 252, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 32,
  },
  emailText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(3, 218, 198, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  roleText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  metricsContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 32,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  metricValue: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutBtn: {
    backgroundColor: 'rgba(207, 102, 121, 0.1)',
    borderColor: COLORS.error,
    borderWidth: 1.5,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: COLORS.error,
    fontWeight: 'bold',
    fontSize: 14,
  },
  footerVersion: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 20,
    fontStyle: 'italic',
  },
});
