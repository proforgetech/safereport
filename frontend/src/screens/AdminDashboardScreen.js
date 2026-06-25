import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import { COLORS, globalStyles } from '../components/Theme';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const fetchIncidents = async () => {
    try {
      const response = await client.get('/incidents');
      // Sort by timestamp descending
      const sorted = response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setIncidents(sorted);
    } catch (error) {
      console.log('Failed to fetch incidents', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    // Refresh when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchIncidents();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchIncidents();
  };

  // Calculate statistics
  const pendingCount = incidents.filter(i => i.status === 'pending').length;
  const respondedCount = incidents.filter(i => i.status === 'responded').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;

  const filteredIncidents = incidents.filter(incident => {
    if (selectedFilter === 'All') return true;
    return incident.status.toLowerCase() === selectedFilter.toLowerCase();
  });

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

  const getStatusBgColor = (status) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'rgba(3, 218, 198, 0.15)';
      case 'responded':
        return 'rgba(255, 179, 0, 0.15)';
      default:
        return 'rgba(207, 102, 121, 0.15)';
    }
  };

  const renderItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const statusBg = getStatusBgColor(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('AdminIncidentDetail', { incidentId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.typeText}>{item.type}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <Text style={styles.descriptionText} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            📅 {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {item.evidence && item.evidence.length > 0 && (
            <Text style={styles.attachmentBadge}>📎 Photo</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filters = ['All', 'Pending', 'Responded', 'Resolved'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>SafeReport Admin</Text>
          <Text style={styles.subtitle}>Incident Management Command</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderLeftColor: COLORS.error }]}>
          <Text style={styles.statVal}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: '#FFB300' }]}>
          <Text style={styles.statVal}>{respondedCount}</Text>
          <Text style={styles.statLabel}>Responded</Text>
        </View>
        <View style={[styles.statBox, { borderLeftColor: COLORS.secondary }]}>
          <Text style={styles.statVal}>{resolvedCount}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.activeFilterChip
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter && styles.activeFilterText
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Incident List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredIncidents}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={COLORS.primary} 
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>✓</Text>
              <Text style={styles.emptyText}>No {selectedFilter !== 'All' ? selectedFilter.toLowerCase() : ''} incidents found.</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    ...globalStyles.title,
    fontSize: 26,
    color: COLORS.primary,
    marginBottom: 2,
  },
  subtitle: {
    ...globalStyles.subtitle,
    fontSize: 14,
    marginBottom: 0,
  },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    borderRadius: 8,
  },
  logoutText: {
    color: COLORS.error,
    fontWeight: 'bold',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 6,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeFilterText: {
    color: '#000000',
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  descriptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  attachmentBadge: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    color: COLORS.secondary,
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
});
