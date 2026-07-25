import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '@/screens/SplashScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { EmailSignInScreen } from '@/screens/EmailSignInScreen';
import { PhoneSignInScreen } from '@/screens/PhoneSignInScreen';
import { OtpVerificationScreen } from '@/screens/OtpVerificationScreen';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  EmailSignIn: undefined;
  PhoneSignIn: undefined;
  OtpVerification:
    | { mode: 'email'; email: string; phone?: undefined }
    | { mode: 'phone'; phone: string; email?: undefined };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="EmailSignIn" component={EmailSignInScreen} />
      <Stack.Screen name="PhoneSignIn" component={PhoneSignInScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
    </Stack.Navigator>
  );
}
