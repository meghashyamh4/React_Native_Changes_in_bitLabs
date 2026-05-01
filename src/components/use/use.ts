import {useAuth} from '@context/Authcontext';
export const use = () => {
  const {userId, userToken} = useAuth();
  const id = userId;
  const token = userToken;
  return {id, token};
};
