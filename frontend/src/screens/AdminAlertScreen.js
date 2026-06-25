import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, RefreshControl, Alert } from 'react-native';
import client from '../api/client';
import { COLORS, globalStyles } from '../components/Theme';

export default function AdminAlertScreen({ navigation }) {
  const [area, setArea] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('Critical'); // Critical, Advisory, Information
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    try {
      const response = await client.get('/alerts');
      setAlerts(response.data);
    } catch (error) {
      console.log('Failed to fetch alerts', error);
    } finally {
      setRefreshLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Add focus listener to fetch updates automatically when tab is clicked
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAlerts();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const handleBroadcast = async () => {
    if (!area || !message) {
      Alert.alert('Error', 'Please provide both the target Area and Alert Message.');
      return;
    }

    setLoading(true);
    try {
      const formattedMessage = `[${severity.toUpperCase()}] ${message}`;
      
      await client.post('/alerts', {
        area,
        message: formattedMessage,
      });

      Alert.alert('Success', 'Emergency alert broadcasted successfully!');
      setArea('');
      setMessage('');
      setSeverity('Critical');
      await fetchAlerts(); // Immediately fetch and show the new alert
    } catch (error) {
      console.log('Failed to broadcast alert', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to dispatch alert');
    } finally {
      setLoading(false);
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

  const renderAlertItem = ({ item }) => {
    const color = getAlertColor(item.message);
    const bg = getAlertBgColor(item.message);
    const tag = getAlertTag(item.message);
    const cleanedMsg = cleanMessage(item.message);

    return (
      <View style={[styles.alertCard, { borderLeftColor: color, backgroundColor: bg }]}>
        <View style={styles.alertHeader}>
          <Text style={[styles.alertTag, { color }]}>{tag} • {item.area.toUpperCase()}</Text>
          <Text style={styles.alertDate}>
            🕒 {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.alertText}>{cleanedMsg}</Text>
      </View>
    );
  };

  // Render form and static page content as FlatList header
  const renderHeader = () => (
    <View>
      <Text style={styles.title}>Broadcast Center</Text>
      <Text style={styles.subtitle}>Dispatch public warnings and advisories</Text>

      {/* Broadcast Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Compose Broadcast</Text>

        <TextInput
          style={styles.input}
          placeholder="Target Area (e.g., Downtown, West Campus)"
          placeholderTextColor={COLORS.textSecondary}
          value={area}
          onChangeText={setArea}
        />

        {/* Severity Selector */}
        <View style={styles.severityContainer}>
          <Text style={styles.label}>Severity Level:</Text>
          <View style={styles.severityRow}>
            {['Critical', 'Advisory', 'Information'].map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.severityChip,
                  severity === level && {
                    backgroundColor: level === 'Critical' ? 'rgba(207, 102, 121, 0.2)' : level === 'Advisory' ? 'rgba(255, 179, 0, 0.2)' : 'rgba(3, 218, 198, 0.2)',
                    borderColor: level === 'Critical' ? COLORS.error : level === 'Advisory' ? '#FFB300' : COLORS.secondary,
                  }
                ]}
                onPress={() => setSeverity(level)}
              >
                <Text style={[
                  styles.severityChipText,
                  { color: COLORS.textSecondary },
                  severity === level && {
                    color: level === 'Critical' ? COLORS.error : level === 'Advisory' ? '#FFB300' : COLORS.secondary,
                    fontWeight: 'bold'
                  }
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Alert details (e.g., Active police presence. Avoid area.)"
          placeholderTextColor={COLORS.textSecondary}
          multiline
          value={message}
          onChangeText={setMessage}
        />

        <TouchableOpacity 
          style={[styles.broadcastBtn, { backgroundColor: severity === 'Critical' ? COLORS.error : severity === 'Advisory' ? '#FFB300' : COLORS.secondary }]} 
          onPress={handleBroadcast} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.broadcastBtnText}>SEND BROADCAST 🚨</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.historyTitle}>Sent Broadcasts ({alerts.length})</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {refreshLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={item => item.id.toString()}
          renderItem={renderAlertItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No alerts have been broadcasted yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...globalStyles.title,
    fontSize: 26,
    color: COLORS.primary,
    marginBottom: 2,
    marginTop: 16,
  },
  subtitle: {
    ...globalStyles.subtitle,
    fontSize: 14,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  input: {
    ...globalStyles.input,
    marginBottom: 12,
    padding: 12,
    fontSize: 14,
  },
  severityContainer: {
    marginBottom: 12,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  severityChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  severityChipText: {
    fontSize: 12,
  },
  broadcastBtn: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  broadcastBtnText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  alertCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  alertTag: {
    fontWeight: 'bold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertDate: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  alertText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});
