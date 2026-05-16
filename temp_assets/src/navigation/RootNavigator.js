import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useGlobal } from '../store/GlobalContext';
import { useTranslation } from 'react-i18next';

// Screens
import { LoginScreen }       from '../screens/auth/LoginScreen';
import { PasswordSetupScreen } from '../screens/auth/PasswordSetupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { HomeScreen }        from '../screens/tenant/HomeScreen';
import { MyBookingsScreen }  from '../screens/tenant/MyBookingsScreen';
import { RequestsScreen }     from '../screens/tenant/RequestsScreen';
import { BookingModal }       from '../screens/tenant/BookingModal';
import { TenantProfileScreen } from '../screens/tenant/TenantProfileScreen';
import { LiveTrackingScreen } from '../screens/tenant/LiveTrackingScreen';

import { AdminProfileScreen }  from '../screens/admin/AdminProfileScreen';
import { DriverProfileScreen } from '../screens/driver/DriverProfileScreen';
import { EditProfileScreen }   from '../screens/shared/EditProfileScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { PrivacySecurityScreen } from '../screens/shared/PrivacySecurityScreen';
import { HelpCenterScreen }    from '../screens/shared/HelpCenterScreen';
import { TermsOfServiceScreen } from '../screens/shared/TermsOfServiceScreen';

// Admin
import { AdminScheduleScreen }     from '../screens/admin/AdminScheduleScreen';
import { AdminRequestsScreen }     from '../screens/admin/AdminRequestsScreen';
import { AdminLogsScreen }         from '../screens/admin/AdminLogsScreen';
import { AdminDestinationsScreen } from '../screens/admin/AdminDestinationsScreen';
import { AdminUsersScreen }        from '../screens/admin/AdminUsersScreen';
import { AdminShuttleLiveScreen }  from '../screens/admin/AdminShuttleLiveScreen';

// Driver
import { DriverHomeScreen }    from '../screens/driver/DriverHomeScreen';
import { DrivingLicenseScreen } from '../screens/driver/DrivingLicenseScreen';

// Icons (Stable)
import { MaterialCommunityIcons, AntDesign, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { isAdminNavigatorRole } from '../constants/permissions';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const TabBarIcon = ({ iconName, color, size, type = 'Material' }) => {
  if (type === 'Ant') return <AntDesign name={iconName} size={size} color={color} />;
  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
};

const TenantTabs = () => {
  const { t } = useTranslation();
  const { language } = useGlobal(); // Get language to force re-render

  return (
  <Tab.Navigator key={`tenant-${language}`} screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: COLORS.gray[300],
    tabBarLabelStyle: { fontSize: 9, fontWeight: '800', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.2 },
    tabBarStyle: { 
      height: 75, 
      paddingTop: 10,
      paddingBottom: 20, 
      backgroundColor: COLORS.white,
      borderTopWidth: 1,
      borderTopColor: COLORS.gray[50],
      elevation: 0,
      shadowOpacity: 0
    },
  }}>
    <Tab.Screen name="Home"     component={HomeScreen} options={{ tabBarLabel: t('dashboard.home'), tabBarIcon: (p) => <TabBarIcon iconName="home-variant" {...p} /> }} />
    <Tab.Screen name="Bookings" component={MyBookingsScreen} options={{ tabBarLabel: t('dashboard.bookings'), tabBarIcon: (p) => <TabBarIcon iconName="calendar-check" {...p} /> }} />
    <Tab.Screen name="Requests"  component={RequestsScreen} options={{ tabBarLabel: t('dashboard.request'), tabBarIcon: (p) => <TabBarIcon iconName="send" {...p} /> }} />
    <Tab.Screen name="Profile"  component={TenantProfileScreen} options={{ tabBarLabel: t('dashboard.profile'), tabBarIcon: (p) => <TabBarIcon iconName="account" {...p} /> }} />
  </Tab.Navigator>
  );
};

const AdminTabs = () => {
  const { t } = useTranslation();
  const { language } = useGlobal(); // Get language to force re-render

  return (
  <Tab.Navigator key={`admin-${language}`} screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: COLORS.secondary,
    tabBarInactiveTintColor: COLORS.gray[300],
    tabBarLabelStyle: { fontSize: 9, fontWeight: '800', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.2 },
    tabBarStyle: { 
      height: 75, 
      paddingTop: 10,
      paddingBottom: 20, 
      backgroundColor: COLORS.white,
      borderTopWidth: 1,
      borderTopColor: COLORS.gray[50],
      elevation: 0,
      shadowOpacity: 0
    },
  }}>
    <Tab.Screen name="Schedule" component={AdminScheduleScreen} options={{ tabBarLabel: t('dashboard.schedule'), tabBarIcon: (p) => <TabBarIcon iconName="view-dashboard" {...p} /> }} />
    <Tab.Screen name="Requests" component={AdminRequestsScreen} options={{ tabBarLabel: t('dashboard.requests'), tabBarIcon: (p) => <TabBarIcon iconName="book-multiple" {...p} /> }} />
    <Tab.Screen name="Places"   component={AdminDestinationsScreen} options={{ tabBarLabel: t('dashboard.places'), tabBarIcon: (p) => <TabBarIcon iconName="map-marker-plus" {...p} /> }} />
    <Tab.Screen name="Logs"     component={AdminLogsScreen} options={{ tabBarLabel: t('dashboard.logs'), tabBarIcon: (p) => <TabBarIcon iconName="file-document" {...p} /> }} />
    <Tab.Screen name="Profile"  component={AdminProfileScreen} options={{ tabBarLabel: t('dashboard.profile'), tabBarIcon: (p) => <TabBarIcon iconName="account-cog" {...p} /> }} />
  </Tab.Navigator>
  );
};

const DriverTabs = () => {
  const { t } = useTranslation();
  const { language } = useGlobal(); // Get language to force re-render

  return (
  <Tab.Navigator key={`driver-${language}`} screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: COLORS.primary,
    tabBarInactiveTintColor: COLORS.gray[300],
    tabBarLabelStyle: { fontSize: 9, fontWeight: '800', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.2 },
    tabBarStyle: { 
      height: 75, 
      paddingTop: 10,
      paddingBottom: 20, 
      backgroundColor: COLORS.white,
      borderTopWidth: 1,
      borderTopColor: COLORS.gray[50],
      elevation: 0,
      shadowOpacity: 0
    },
  }}>
    <Tab.Screen name="Home"    component={DriverHomeScreen} options={{ tabBarLabel: t('dashboard.home'), tabBarIcon: (p) => <TabBarIcon iconName="truck-delivery" {...p} /> }} />
    <Tab.Screen name="Profile" component={DriverProfileScreen} options={{ tabBarLabel: t('dashboard.profile'), tabBarIcon: (p) => <TabBarIcon iconName="account" {...p} /> }} />
  </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { isLoggedIn, currentRole, language } = useGlobal();
  const { t } = useTranslation(); // Also hook into t to be sure

  return (
    <Stack.Navigator key={`root-${language}`} screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="PasswordSetup" component={PasswordSetupScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : (
        <>
          {currentRole === 'tenant' && <Stack.Screen name="TenantMain" component={TenantTabs} />}
          {isAdminNavigatorRole(currentRole) && <Stack.Screen name="AdminMain" component={AdminTabs} />}
          {currentRole === 'driver' && <Stack.Screen name="DriverMain" component={DriverTabs} />}
          <Stack.Screen 
            name="BookingModal" 
            component={BookingModal} 
            options={{ presentation: 'transparentModal', cardStyleInterpolator: ({ current: { progress } }) => ({ cardStyle: { opacity: progress } }) }} 
          />
          <Stack.Screen name="EditProfile"      component={EditProfileScreen} />
          <Stack.Screen name="Notifications"    component={NotificationsScreen} />
          <Stack.Screen name="PrivacySecurity"  component={PrivacySecurityScreen} />
          <Stack.Screen name="HelpCenter"       component={HelpCenterScreen} />
          <Stack.Screen name="TermsOfService"   component={TermsOfServiceScreen} />

          <Stack.Screen name="AdminUsers"       component={AdminUsersScreen} />
          <Stack.Screen name="DrivingLicense"   component={DrivingLicenseScreen} />
          <Stack.Screen name="LiveTracking"     component={LiveTrackingScreen} />
          <Stack.Screen name="AdminShuttleLive" component={AdminShuttleLiveScreen} />
          <Stack.Screen name="PasswordSetup"    component={PasswordSetupScreen} />
          <Stack.Screen name="ForgotPassword"   component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
