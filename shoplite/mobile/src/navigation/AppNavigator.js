import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Loader from '../components/Loader';

// Auth Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main App Screens
import HomeScreen from '../screens/HomeScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import LeaveScreen from '../screens/LeaveScreen';
import SalaryScreen from '../screens/SalaryScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Stack Screens (pushed from tabs)
import MeetingsScreen from '../screens/MeetingsScreen';
import ExpensesScreen from '../screens/ExpensesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * HomeTabs — Bottom tab navigation for employee self-service
 */
const HomeTabs = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'finger-print' : 'finger-print-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Time Off"
        component={LeaveScreen}
        options={{
          tabBarLabel: 'Time Off',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Salary"
        component={SalaryScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * AppNavigator — Main navigation controller
 */
const AppNavigator = () => {
  const { token, loading } = useAuth();
  const { theme, themeMode } = useTheme();

  if (loading) {
    return <Loader />;
  }

  // Custom react-navigation theme
  const navTheme = {
    ...(themeMode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(themeMode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          // Authenticated: Main App
          <>
            <Stack.Screen name="MainTabs" component={HomeTabs} />
            <Stack.Screen
              name="LeaveManagement"
              component={LeaveScreen}
              options={{
                headerShown: true,
                headerTitle: 'Leave Management',
                headerBackTitle: 'Back',
                headerTintColor: theme.primary,
                headerStyle: { backgroundColor: theme.surface },
                headerTitleStyle: { color: theme.text, fontWeight: '600' },
              }}
            />
            <Stack.Screen
              name="Meetings"
              component={MeetingsScreen}
              options={{
                headerShown: true,
                headerTitle: 'Meetings',
                headerBackTitle: 'Back',
                headerTintColor: theme.primary,
                headerStyle: { backgroundColor: theme.surface },
                headerTitleStyle: { color: theme.text, fontWeight: '600' },
              }}
            />
            <Stack.Screen
              name="Expenses"
              component={ExpensesScreen}
              options={{
                headerShown: true,
                headerTitle: 'Expense & Reimbursements',
                headerBackTitle: 'Back',
                headerTintColor: theme.primary,
                headerStyle: { backgroundColor: theme.surface },
                headerTitleStyle: { color: theme.text, fontWeight: '600' },
              }}
            />
          </>
        ) : (
          // Not authenticated: Auth flow
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerBackTitle: 'Back',
                headerTintColor: theme.primary,
                headerStyle: { backgroundColor: theme.surface },
                headerShadowVisible: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
