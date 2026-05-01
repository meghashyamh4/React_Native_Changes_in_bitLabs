import {createContext, useState, useContext, ReactNode} from 'react';

interface MessageContextType {
  setmsg: boolean;
  setSetmsg: (msg: boolean) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({children}: {children: ReactNode}) => {
  const [setmsg, setSetmsg] = useState(false);

  return <MessageContext.Provider value={{setmsg, setSetmsg}}>{children}</MessageContext.Provider>;
};

export const useMessageContext = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
};
