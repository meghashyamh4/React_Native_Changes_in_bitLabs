import Toast from 'react-native-toast-message';

const showToast = (type: 'success' | 'error', message: string) => {
  Toast.show({
    type: type,
    text1: '',
    text2: message,
    position: 'bottom',
    bottomOffset: 20,
    visibilityTime: 5000,
    text2Style: {
      fontFamily: 'PlusJakartaSans-Medium',
      fontSize: 12,
    },
    zIndex: 999999, // Very high zIndex to appear above modals (modals typically have zIndex 1000-10000)
  });
};
export {showToast};
