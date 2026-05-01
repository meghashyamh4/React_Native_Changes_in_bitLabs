import React, { useEffect, useRef } from "react";
import { View, Text, Image, StyleSheet, Animated } from "react-native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "@models/Model";

type SplashScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, "Splash">;
  route: RouteProp<RootStackParamList, "Splash">;
};

const SplashScreen = ({ navigation }: SplashScreenProps) => {
  const logoScaleAnim = useRef(new Animated.Value(0)).current; // Start from 0 (invisible scale)
  const logoTranslateYAnim = useRef(new Animated.Value(0)).current; // Start from center
  const logoOpacityAnim = useRef(new Animated.Value(0)).current; // Start invisible
  const titleOpacityAnim = useRef(new Animated.Value(0)).current; // Start invisible for title

  useEffect(() => {
    // Sequence: Quick zoom in (0.5s) -> Stay 3s -> Move down 1s -> Total 4.5s
    
    // 1. Quick zoom in from center (0.5 seconds) - image comes fast
    const quickZoomIn = Animated.parallel([
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 500, // 0.5 seconds - fast appearance
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    // 2. Stay on screen for 3 seconds (delay before moving down)
    // 3. Move down in 1 second (starts after 3.5s total: 0.5s zoom + 3s stay)
    const moveDown = Animated.timing(logoTranslateYAnim, {
      toValue: 200, // Move down by 200 pixels
      duration: 1000, // 1 second to move down
      delay: 3500, // Start after: 0.5s (zoom) + 3s (stay) = 3.5s
      useNativeDriver: true,
    });

    // Run animation sequence
    Animated.sequence([
      quickZoomIn,
      moveDown,
    ]).start(() => {
      // Navigation happens after animation completes (4.5s total)
      // Navigation is handled by parent component timer
    });
  }, [logoScaleAnim, logoTranslateYAnim, logoOpacityAnim, titleOpacityAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [
              { scale: logoScaleAnim },
              { translateY: logoTranslateYAnim },
            ],
            opacity: logoOpacityAnim,
          },
        ]}>
        {/* Logo image - appears quickly from center */}
        <Image
          source={{
            uri: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/logo.png",
          }}
          style={styles.logo}
          resizeMode="contain"
        />
        {/* Title - stays black and visible */}
        {/* <Animated.Text 
          style={[
            styles.title,
            { opacity: titleOpacityAnim }
          ]}
        >
          bitLab
        </Animated.Text> */}
      </Animated.View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: "#000",
    fontFamily: "PlusJakartaSans-Bold",
  },
});
