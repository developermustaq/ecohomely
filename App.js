import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider, ThemeContext } from './theme/ThemeContext'; 
import Navigation from './Navigation';
import ConnectivityWrapper from './components/ConnectivityWrapper';
import useUserActiveStatus from './hooks/useUserActiveStatus';
import NotificationHandler from './notifications/NotificationHandler';
import { TranslationProvider } from './context/TranslationContext'; 

const ThemedApp = () => {
  const { theme } = useContext(ThemeContext);

  const navigationTheme = {
    dark: theme === 'dark',
    colors: {
      primary: theme === 'light' ? '#007aff' : '#0a84ff',
      background: theme === 'light' ? '#fff' : '#1A1A1A',
      notification: theme === 'light' ? '#ff3b30' : '#ff453a',
    },
  };

  return (
    <TranslationProvider> 
      <ConnectivityWrapper>
        <NavigationContainer theme={navigationTheme}>
          <NotificationHandler />
          <Navigation />
        </NavigationContainer>
      </ConnectivityWrapper>
    </TranslationProvider>
  );
};

const App = () => {
  useUserActiveStatus();

  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
};

export default App;
