import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ScreenHeaderProps {
  title: string;
  onBackPress?: () => void;
}

/**
 * Reusable screen header component matching TechBuzzShorts header style.
 * Provides consistent spacing, padding, and alignment across all screens.
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBackPress }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onBackPress ? (
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        <Text style={styles.heading}>{title}</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#888',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  backButtonPlaceholder: {
    width: 32,
  },
  heading: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
});

export default ScreenHeader;
