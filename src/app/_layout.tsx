import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { Palette } from '@/constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = Palette[isDark ? 'dark' : 'light'];

  return (
    <KeyboardProvider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: palette.surface,
            },
            headerTintColor: palette.text,
            headerTitleStyle: {
              fontWeight: '700',
              fontSize: 18,
            },
            headerShadowVisible: false,
          }}>
          <Stack.Screen
            name="index"
            options={{
              title: 'Bookings',
            }}
          />
          <Stack.Screen
            name="bookings/[id]"
            options={{
              title: 'Booking Details',
              headerBackTitle: 'Bookings',
            }}
          />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </KeyboardProvider>
  );
}
