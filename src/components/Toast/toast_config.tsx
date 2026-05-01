import React from 'react';
import {TouchableOpacity, Dimensions, StyleSheet, Platform} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import Toast, {BaseToast, ToastConfig} from 'react-native-toast-message';

const {width} = Dimensions.get('window');

export const toastConfig: ToastConfig = {
  success: props => (
    <BaseToast
      {...props}
      style={[
        {
          borderLeftColor: 'green',
          paddingRight: 15,
          width: width * 0.9,
          backgroundColor: '#fff',
          borderRadius: 12,
          borderLeftWidth: 4,
        },
        styles.toastContainer,
      ]}
      contentContainerStyle={{paddingHorizontal: 15}}
      text1Style={{fontSize: 12, fontFamily: 'PlusJakartaSans-Bold'}}
      text2Style={{fontSize: 12, fontFamily: 'PlusJakartaSans-Medium', color: '#2B2B2B'}}
      text1={props.text1}
      text2={props.text2}
      renderTrailingIcon={() => (
        <TouchableOpacity
          onPress={() => Toast.hide()}
          style={{alignSelf: 'center', marginLeft: 10}}>
          <Icon name="cross" size={18} color="#333" />
        </TouchableOpacity>
      )}
    />
  ),
  error: props => (
    <BaseToast
      {...props}
      style={[
        {
          borderLeftColor: '#d32f2f',
          paddingRight: 15,
          width: width * 0.9,
          backgroundColor: '#fff',
          borderRadius: 12,
          borderLeftWidth: 4,
        },
        styles.toastContainer,
      ]}
      contentContainerStyle={{paddingHorizontal: 15}}
      text1Style={{fontSize: 12, fontFamily: 'PlusJakartaSans-Bold'}}
      text2Style={{fontSize: 12, fontFamily: 'PlusJakartaSans-Medium', color: '#2B2B2B'}}
      text1={props.text1}
      text2={props.text2}
      renderTrailingIcon={() => (
        <TouchableOpacity
          onPress={() => Toast.hide()}
          style={{alignSelf: 'center', marginLeft: 10}}>
          <Icon name="cross" size={18} color="#333" />
        </TouchableOpacity>
      )}
    />
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    zIndex: 999999, // Very high zIndex to appear above modals (modals typically have zIndex 1000-10000)
    elevation: 100, // Android elevation - much higher than modals
    // Shadow for iOS
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        // Elevation already set above
      },
    }),
  },
});
