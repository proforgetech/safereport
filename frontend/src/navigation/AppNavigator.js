import React, { useContext, useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthContext } from '../context/AuthContext';
import client from '../api/client';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ReportScreen from '../screens/ReportScreen';
import AlertsScreen from '../screens/AlertsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminAlertScreen from '../screens/AdminAlertScreen';
import AdminProfileScreen from '../screens/AdminProfileScreen';
import AdminIncidentDetailScreen from '../screens/AdminIncidentDetailScreen';
import UserIncidentDetailScreen from '../screens/UserIncidentDetailScreen';
import { COLORS, globalStyles } from '../components/Theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    primary: COLORS.primary,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Report') {
            iconName = focused ? 'warning' : 'warning-outline';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Report" component={ReportScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
    </Tab.Navigator>
  );
}

function AdminTabs({ pendingCount }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Incidents') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Broadcast') {
            iconName = focused ? 'megaphone' : 'megaphone-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Incidents" 
        component={AdminDashboardScreen} 
        options={{
          tabBarBadge: pendingCount > 0 ? pendingCount : null,
          tabBarBadgeStyle: { backgroundColor: COLORS.error, color: '#000', fontSize: 10, fontWeight: 'bold' }
        }}
      />
      <Tab.Screen name="Broadcast" component={AdminAlertScreen} />
      <Tab.Screen name="Profile" component={AdminProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useContext(AuthContext);
  const [pendingCount, setPendingCount] = useState(0);

  // Poll for pending incidents to update the Admin tab badge in real-time
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setPendingCount(0);
      return;
    }

    const fetchPendingCount = async () => {
      try {
        const response = await client.get('/incidents');
        const pending = response.data.filter(i => i.status === 'pending').length;
        setPendingCount(pending);
      } catch (e) {
        console.log('Failed to fetch pending count for notification badge', e);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 8000); // poll every 8 seconds
    return () => clearInterval(interval);
  }, [user]);

  if (isLoading) {
    return (
      <View style={{...globalStyles.container, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={CustomDarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          user.role === 'admin' ? (
            // Admin Stack
            <Stack.Group>
              <Stack.Screen name="AdminTabs">
                {() => <AdminTabs pendingCount={pendingCount} />}
              </Stack.Screen>
              <Stack.Screen name="AdminIncidentDetail" component={AdminIncidentDetailScreen} />
            </Stack.Group>
          ) : (
            // User Stack
            <Stack.Group>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="UserIncidentDetail" component={UserIncidentDetailScreen} />
            </Stack.Group>
          )
        ) : (
          // Auth Stack
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
