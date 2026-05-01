import React from 'react';
import {View, Image, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';

interface NavbarProps {
  title: string;
  onBackPress?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({title, onBackPress}) => {
  return (
    <View>
      {/* Logo Section */}
      <View style={styles.navbar}>
        <Image source={{ uri: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/bitlabs-skill-images/logo.png" }} style={styles.logo} />
      </View>

      <View style={styles.separator} />

      {/* Header Section */}
      <View style={styles.headerContainer}>
        {/* Back Button */}
        {onBackPress && (
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <Icon name="left" size={24} color="#495057" />
          </TouchableOpacity>
        )}

        {/* Screen Title */}
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.separator} />
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    marginTop: 10,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  separator: {
    height: 1,
    backgroundColor: '#D3D3D3',
    width: '100%',
    marginTop: 8,
  },
  headerContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    height: 50,
    backgroundColor: '#FFF',
  },
  backButton: {
    position: 'absolute',
    left: 15,
  },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#495057',
    lineHeight: 25,
    marginLeft: 50,
  },
});

export default Navbar;
