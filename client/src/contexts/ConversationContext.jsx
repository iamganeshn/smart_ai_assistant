import React, { createContext, useContext } from 'react';
import { useConversations } from '../hooks/useConversations';

const ConversationContext = createContext();

export const ConversationProvider = ({ children }) => {
  const conversationData = useConversations();
  
  return (
    <ConversationContext.Provider value={conversationData}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversationContext must be used within a ConversationProvider');
  }
  return context;
};
