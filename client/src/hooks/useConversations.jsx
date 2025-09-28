import { useState, useEffect, useCallback } from 'react';
import { getConversations, getConversation } from '../utils/api';

export const useConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getConversations();
      setConversations(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConversation = useCallback(async (id) => {
    if (!id) {
      setCurrentConversation(null);
      return;
    }

    try {
      setLoading(true);
      const response = await getConversation(id);
      setCurrentConversation(response.data.data);
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      setCurrentConversation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCurrentConversation = useCallback(() => {
    setCurrentConversation(null);
  }, []);

  const addNewConversation = useCallback((conversation) => {
    setConversations((prev) => [conversation, ...prev]);
    setCurrentConversation(conversation);
  }, []);

  const updateConversationTitle = useCallback(
    (id, title) => {
      setConversations((prev) =>
        prev.map((conv) => (conv.id === id ? { ...conv, title } : conv))
      );
      if (currentConversation?.id === id) {
        setCurrentConversation((prev) => ({ ...prev, title }));
      }
    },
    [currentConversation?.id]
  );

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    currentConversation,
    loading,
    fetchConversations,
    fetchConversation,
    clearCurrentConversation,
    addNewConversation,
    updateConversationTitle,
  };
};
