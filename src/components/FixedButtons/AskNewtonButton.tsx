import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@models/Model';
import { useAuth } from '@context/Authcontext';
import Icon from 'react-native-vector-icons/Feather';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { trackAnalyticsEvent } from '@services/Analytics/AnalyticsService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AskNewtonButton: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated, userId } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string | undefined>(undefined);

  // Use navigation listener to track current route
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e) => {
      // Get the current route name from navigation state
      const state = e.data.state;
      if (state) {
        const findCurrentRoute = (navState: any): string | undefined => {
          if (!navState) return undefined;

          const route = navState.routes[navState.index];

          if (route.state) {
            // Nested navigator, recurse
            return findCurrentRoute(route.state);
          }

          return route.name;
        };

        const routeName = findCurrentRoute(state);
        setCurrentRoute(routeName);
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Hide button on test screens, Ask Newton page, and login/signup pages
  const hiddenRoutes = [
    'TestScreen',
    'TestInstruction',
    'InterviewPreparation',
    'LandingPage',
    'ForgotPassword',
    'Step1',
    'Step2',
    'Step3'
  ];
  // Hide button if user is not authenticated OR if on hidden routes
  const shouldHide = !isAuthenticated || (currentRoute && hiddenRoutes.includes(currentRoute));

  if (shouldHide) {
    return null;
  }

  const handlePress = () => {
    try {
      // Trigger analytics event
      trackAnalyticsEvent("MOBILE-ASK NEWTON", userId);
      // Navigate to Ask Newton page (available for both authenticated and unauthenticated users)
      navigation.navigate('InterviewPreparation');
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.fixedButton}
      onPress={handlePress}
      activeOpacity={0.8}>
      <Icon name="message-circle" size={28} color="#F46F16" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fixedButton: {
    position: 'absolute',
    bottom: hp('12%'), // Positioned above bottom navigation bar (77px + padding)
    right: wp('4%'),
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white background
    borderRadius: 30,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: 'rgba(244, 111, 22, 0.2)', // Light orange border
  },
});

export default AskNewtonButton;

