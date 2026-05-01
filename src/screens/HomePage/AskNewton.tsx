import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

interface Props {
  handleRedirect3: () => void;
  botImage: any;
  loading?: boolean;
}

export const AskNewtonCard: React.FC<Props> = ({ handleRedirect3, botImage, loading = false }) => {
  if (loading) {
    return (
      <View style={styles.wrapper}>
        {/* Skeleton Image */}
        <View style={styles.skeletonImageContainer}>
          <View style={styles.skeletonImage} />
        </View>

        {/* Skeleton Card */}
        <View style={styles.skeletonCardGradient}>
          <View style={styles.skeletonInnerCard}>
            {/* Image placeholder space */}
            <View style={styles.imagePlaceholder} />
            
            {/* Skeleton Text content */}
            <View style={styles.skeletonTextContainer}>
              <View style={styles.skeletonTextLine1} />
              <View style={styles.skeletonTextLine2} />
            </View>
          </View>

          {/* Skeleton Button */}
          <View style={styles.skeletonButton} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Image - 40% outside top, 60% inside - Clickable */}
      <TouchableOpacity 
        style={styles.imageContainer}
        onPress={handleRedirect3}
        activeOpacity={0.7}
      >
        <Image
          source={botImage}
          style={styles.botImage}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <LinearGradient
        colors={["#FBBB5C", "#E66A0E"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        useAngle={true}
        angle={225}
        style={styles.cardGradient}
      >
        <View style={styles.innerCard}>
          {/* Image placeholder space */}
          <View style={styles.imagePlaceholder} />
          
          {/* Text content - right of image */}
          <TouchableOpacity 
            style={styles.textContainer}
            onPress={handleRedirect3}
            activeOpacity={0.7}
          >
            <Text style={styles.title}>
              Any topic. Anytime -{" "}
              <Text style={styles.askNewton}>
                Ask Newton!
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Button below */}
        <TouchableOpacity style={styles.button} onPress={handleRedirect3}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};
const styles = StyleSheet.create({
    wrapper: {
      paddingHorizontal: 12,
      paddingTop: 0,
      paddingBottom: 0,
      overflow: 'visible',
      position: 'relative',
    },
  
    cardGradient: {
      width: "100%",
      borderRadius: 16,
      padding: 4,
      paddingTop: 30, // Further reduced space for image overflow
      minHeight: 28, // Further decreased height
      marginTop: 30, // Moved card down more
      overflow: 'visible',
    },
  
    innerCard: {
      backgroundColor: "transparent",
      borderRadius: 16,
      flexDirection: 'row', // Text to the right of image
      alignItems: 'flex-start', // Align to top
      marginBottom: 0, // Further reduced margin
      overflow: 'visible',
    },
  
    imageContainer: {
      position: 'absolute',
      top: -10, // 40% overflow outside top
      left: 0,
      width: 120,
      height: 120,
      zIndex: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
  
    botImage: {
      width: 120,
      height: 120,
    },
  
    imagePlaceholder: {
      width: 75, // Further reduced space
      height: 45, // Further reduced height
    },
  
    textContainer: {
      flex: 1,
      paddingLeft: 15, // Moved text more to the right
      paddingTop: 2, // Moved text to top
    },
  
    title: {
      fontSize: hp('1.4%'), // Consistent body text size
      color: "#fff",
      fontFamily: "PlusJakartaSans-Medium",
    },
  
    askNewton: {
      fontSize: hp('1.6%'), // Consistent sub-heading size
      color: "#7E3601",
      fontFamily: "PlusJakartaSans-Bold",
    },
  
    button: {
      backgroundColor: "#ffff",
      paddingVertical: 4, // Further reduced padding
      paddingHorizontal: 22,
      width: "90%", // Reduced width to add space around
      borderRadius: 10,
      alignSelf: "center",
      marginTop: 4, // Added margin top
      marginBottom: 4, // Added margin bottom
      borderWidth: 1, // Added border
      borderColor: 'rgba(255, 255, 255, 0.3)', // Light border
    },
  
    buttonText: {
      textAlign: "center",
      color: "#000",
      fontSize: hp('1.5%'), // Consistent button text size
      fontFamily: "PlusJakartaSans-Medium",
    },
    // Skeleton styles
    skeletonImageContainer: {
      position: 'absolute',
      top: -10,
      left: 0,
      width: 120,
      height: 120,
      zIndex: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    skeletonImage: {
      width: 120,
      height: 120,
      backgroundColor: '#e0e0e0',
      borderRadius: 8,
    },
    skeletonCardGradient: {
      width: "100%",
      borderRadius: 16,
      padding: 4,
      paddingTop: 30,
      minHeight: 28,
      marginTop: 30,
      overflow: 'visible',
      backgroundColor: '#f0f0f0', // Light gray background for skeleton
    },
    skeletonInnerCard: {
      backgroundColor: "transparent",
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 0,
      overflow: 'visible',
    },
    skeletonTextContainer: {
      flex: 1,
      paddingLeft: 15,
      paddingTop: 2,
    },
    skeletonTextLine1: {
      width: '70%',
      height: hp('1.4%'),
      backgroundColor: '#e0e0e0',
      borderRadius: 4,
      marginBottom: hp('0.3%'),
    },
    skeletonTextLine2: {
      width: '50%',
      height: hp('1.4%'),
      backgroundColor: '#e0e0e0',
      borderRadius: 4,
    },
    skeletonButton: {
      backgroundColor: "#e0e0e0",
      paddingVertical: 4,
      paddingHorizontal: 22,
      width: "90%",
      borderRadius: 10,
      alignSelf: "center",
      marginTop: 4,
      marginBottom: 4,
      height: hp('3%'),
    },
  });
  