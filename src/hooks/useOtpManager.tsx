import {useState, useEffect} from 'react';
import {AppState, AppStateStatus} from 'react-native';

const useOtpManager = () => {
  const [otp, setOtp] = useState('');
  const [otpReceived, setOtpReceived] = useState(false);
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isOtpValid, setIsOtpValid] = useState(true);
  const [lastTimeStamp, setLastTimeStamp] = useState(Date.now());

  useEffect(() => {
    let countdown: NodeJS.Timeout;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && otpReceived && !isOtpExpired) {
        const timeElapsed = Math.floor((Date.now() - lastTimeStamp) / 1000);
        setTimer(prevTimer => Math.max(prevTimer - timeElapsed, 0));
      } else {
        setLastTimeStamp(Date.now());
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (otpReceived && !isOtpExpired) {
      countdown = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            setIsOtpExpired(true);
            clearInterval(countdown);
            setTimer(0);
          }
          return prevTimer - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(countdown);
      subscription.remove(); // Use the `remove` method on the subscription
    };
  }, [otpReceived, isOtpExpired, lastTimeStamp]);

  return {
    otp,
    setOtp,
    otpReceived,
    setOtpReceived,
    isOtpExpired,
    setIsOtpExpired,
    timer,
    setTimer,
    isOtpValid,
    setIsOtpValid,
  };
};

export default useOtpManager;
