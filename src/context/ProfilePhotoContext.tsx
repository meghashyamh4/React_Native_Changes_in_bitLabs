import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import ProfileService from '../services/profile/ProfileService';

interface ProfilePhotoContextProps {
  photo: string | null;
  fetchProfilePhoto: (userToken: string | null, userId: number | null) => Promise<void>;
  resetPhoto: () => void;
}

interface ProfilePhotoProviderProps {
  userToken: string | null;
  userId: number | null;
  children: ReactNode; // Define the type for children
}

const ProfilePhotoContext = createContext<ProfilePhotoContextProps | undefined>(undefined);

export const ProfilePhotoProvider: React.FC<ProfilePhotoProviderProps> = ({
  children,
  userToken,
  userId,
}) => {
  const [photo, setPhoto] = useState<string | null>(null);

  const fetchProfilePhoto = async (token: string | null, id: number | null) => {
    if (!token || !id) return;
    try {
      const result = await ProfileService.fetchProfilePhoto(token, id);
      if (result.success && result.photoUrl) {
        setPhoto(result.photoUrl);
      }else {
        setPhoto(null); //Reset photo if not found
      }
    } catch (error) {
      console.error('Error fetching profile photo:', error);
    }
  };

  const resetPhoto = () => {
    setPhoto(null);
  };

  //Subscribe to the logout event

  useEffect(() => {
    fetchProfilePhoto(userToken, userId);
  }, [userToken, userId]);

  return (
    <ProfilePhotoContext.Provider value={{photo, fetchProfilePhoto, resetPhoto}}>
      {children}
    </ProfilePhotoContext.Provider>
  );
};

export const useProfilePhoto = () => {
  const context = useContext(ProfilePhotoContext);
  if (!context) {
    throw new Error('useProfilePhoto must be used within a ProfilePhotoProvider');
  }
  return context;
};
