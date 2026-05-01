import React from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '@models/Model';

export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

/**
 * Navigate to a screen using the navigation ref
 * @param name - Screen name from RootStackParamList
 * @param params - Optional params for the screen
 */
export function navigate(name: keyof RootStackParamList, params?: any) {
  console.log('🧭 [NAVIGATION] Attempting to navigate:', { name, params });
  
  if (navigationRef.current?.isReady()) {
    console.log('✅ [NAVIGATION] Navigation is ready, navigating now');
    navigationRef.current.navigate(name as never, params as never);
  } else {
    console.log('⏳ [NAVIGATION] Navigation not ready, retrying in 500ms...');
    // Retry after a short delay if navigation is not ready
    setTimeout(() => {
      if (navigationRef.current?.isReady()) {
        console.log('✅ [NAVIGATION] Navigation ready on retry, navigating now');
        navigationRef.current.navigate(name as never, params as never);
      } else {
        console.error('❌ [NAVIGATION] Navigation still not ready after retry');
      }
    }, 500);
  }
}

