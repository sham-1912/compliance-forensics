import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '@/screens/SplashScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { PhoneSignInScreen } from '@/screens/PhoneSignInScreen';
import { EmailSignInScreen } from '@/screens/EmailSignInScreen';
import { OtpVerificationScreen } from '@/screens/OtpVerificationScreen';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  PhoneSignIn: undefined;
  EmailSignIn: undefined;
  OtpVerification: { mode: 'phone' | 'email'; email?: string; phone?: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="PhoneSignIn" component={PhoneSignInScreen} />
      <Stack.Screen name="EmailSignIn" component={EmailSignInScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}
