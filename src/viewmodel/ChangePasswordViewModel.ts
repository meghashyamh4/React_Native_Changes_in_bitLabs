import { useState, useEffect } from 'react';
import { changePassword } from '@services/login/ChangePasswordService';
import { showToast } from '@services/login/ToastService';

export const useChangePasswordViewModel = (userToken: string, userId: string) => {
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [reEnterPassword, setReEnterPassword] = useState<string>('');
  const [message, setMessage] = useState<string | null>('');
  const [oldMessage, setOldMessage] = useState<string | null>('');
  const [newMessage, setNewMessage] = useState<string | null>('');
  const [reEnterMessage, setReEnterMessage] = useState<string | null>('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showReEnterPassword, setShowReEnterPassword] = useState(false);
  const [isSaveClicked, setIsSaveClicked] = useState(false);

  useEffect(() => {
    validatePassword(newPassword, 'new');
    validatePassword(reEnterPassword, 'reEnter');
    validatePassword(oldPassword, 'old');
  }, [newPassword, reEnterPassword, oldPassword]);

  const handleFocus = (field: string) => {
    if (field === 'old') {
      setShowNewPassword(false);
      setShowReEnterPassword(false);
    } else if (field === 'new') {
      setShowOldPassword(false);
      setShowReEnterPassword(false);
    } else if (field === 'reEnter') {
      setShowOldPassword(false);
      setShowNewPassword(false);
    }
  };

  const validatePassword = (password: string, type: 'old' | 'new' | 'reEnter') => {
    const passwordValidationRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!password) {
      if (type === 'old' && isSaveClicked) setOldMessage('Old password is required.');
      if (type === 'new' && isSaveClicked) setNewMessage('New password is required.');
      if (type === 'reEnter') setReEnterMessage('Confirm password is required.');
    } else {
      if (type === 'new' && !passwordValidationRegex.test(password)) {
        setNewMessage(
          'New password must be at least 8 characters long, contain one uppercase letter, one lowercase letter, one number, one special character, and no spaces.',
        );
      } else {
        if (type === 'old') setOldMessage(null);
        if (type === 'new') setNewMessage(null);
      }
    }

    if (type === 'reEnter' && reEnterPassword && newPassword && password !== newPassword) {
      setReEnterMessage('Passwords must match.');
    } else if (type === 'reEnter' && password === newPassword) {
      setReEnterMessage(null);
    }
  };

  const handleChangePassword = async (): Promise<boolean> => {
    setIsSaveClicked(true);
    setOldMessage(null);
    setNewMessage(null);
    setReEnterMessage(null);
    setMessage(null);

    // Ensure all fields are filled
    if (!oldPassword || !newPassword || !reEnterPassword) {
      if (!oldPassword) setOldMessage('Old password is required.');
      if (!newPassword) setNewMessage('New password is required.');
      if (!reEnterPassword) setReEnterMessage('Confirm password is required.');
      return false;
    }

    // Check if old and new passwords are the same
    if (oldPassword === newPassword && oldPassword) {
      showToast('error', 'Old password and new password cannot be the same');
      return false;
    }

    // Check if new password and re-enter password match
    if (newPassword !== reEnterPassword) {
      setReEnterMessage('Passwords must match.');
      return false;
    }

    const success = await changePassword(oldPassword, newPassword, userToken, userId);
    return success;
  };

  return {
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    reEnterPassword,
    setReEnterPassword,
    message,
    oldMessage,
    newMessage,
    reEnterMessage,
    showOldPassword,
    setShowOldPassword,
    showNewPassword,
    setShowNewPassword,
    showReEnterPassword,
    setShowReEnterPassword,
    handleFocus,
    validatePassword,
    handleChangePassword,
  };
};
