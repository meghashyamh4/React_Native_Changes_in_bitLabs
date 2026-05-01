import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign'; // Make sure to install react-native-vector-icons

const CustomHeader = ({onBackPress, title}: any) => {
  return (
    <View style={styles.headerContainer}>
      {/* Back Arrow */}

      <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
        <Icon name="left" size={24} color="#495057" />
      </TouchableOpacity>

      {/* Screen Name */}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#495057',
    lineHeight: 25,
    marginLeft: 50,
  },
});

export default CustomHeader;
