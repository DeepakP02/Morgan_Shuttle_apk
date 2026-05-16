import './src/i18n';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GlobalProvider } from './src/store/GlobalContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

// Import background location service so TaskManager is registered in the global scope
import './src/services/backgroundLocation';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <GlobalProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </GlobalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
