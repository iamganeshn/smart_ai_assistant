import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Paper,
  Chip,
  Stack,
  CircularProgress,
} from '@mui/material';

import Notification from '../utils/Notification';
import { useConversationContext } from '../contexts/ConversationContext';

import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  FileCopy as FileTextIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';

import * as API from '../utils/api';

const ChatScreen = (props) => {
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    currentConversation,
    fetchConversation,
    clearCurrentConversation,
    addNewConversation,
    updateConversationTitle,
  } = useConversationContext();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: '' });

  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load conversation when conversationId changes
  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId);
    } else {
      // New conversation - clear current conversation and show welcome message
      clearCurrentConversation();
      setMessages([
        {
          id: 'welcome',
          content:
            "Hello! I'm Tech9 GPT, your internal AI assistant. Ask me anything or upload documents for analysis.",
          role: 'assistant',
        },
      ]);
    }
  }, [conversationId, fetchConversation, clearCurrentConversation]);

  // Update messages when current conversation changes
  useEffect(() => {
    if (currentConversation?.messages) {
      setMessages(currentConversation.messages);
    }
  }, [currentConversation]);

  useEffect(() => {
    if (location.state?.alert) {
      setAlert({
        message: location.state?.alert?.message,
        type: location.state?.alert?.type,
      });
      navigate(location.pathname, { replace: true }); // Clear state after showing alert
    }
  }, [location]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachedFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: `user_msg-${Date.now()}`,
      content: input || `Uploaded ${attachedFiles.length} file(s)`,
      role: 'user',
      attachedFiles,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create empty AI message for streaming
    const aiMessage = {
      id: `assistant-msg-${Date.now()}`,
      content: 'Typing...',
      role: 'assistant',
    };

    setMessages((prev) => [...prev, aiMessage]);

    try {
      const response = await API.chat(userMessage.content, conversationId);

      // Stream response
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullContent = '';
      let newConversationId = null;
      let conversationTitle = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            let data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              data = JSON.parse(data);

              if (data.content) {
                fullContent += data.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessage.id
                      ? { ...msg, content: fullContent }
                      : msg
                  )
                );
              }

              // Handle conversation metadata
              if (data.conversation_id) {
                newConversationId = data.conversation_id;
              }
              if (data.conversation_title) {
                conversationTitle = data.conversation_title;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

      // Handle new conversation creation
      if (!conversationId && newConversationId) {
        // Redirect to the new conversation URL
        navigate(`/chat/${newConversationId}`, { replace: true });

        // Add to conversations list
        if (conversationTitle) {
          addNewConversation({
            id: newConversationId,
            title: conversationTitle,
            messages: [...messages, { ...aiMessage, content: fullContent }],
          });
        }
      } else if (conversationId && conversationTitle) {
        // Update existing conversation title if it changed
        updateConversationTitle(conversationId, conversationTitle);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setAlert({
        message: 'Failed to send message. Please try again.',
        type: 'error',
      });

      // Remove the failed messages
      setMessages((prev) =>
        prev.filter(
          (msg) => msg.id !== userMessage.id && msg.id !== aiMessage.id
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        pt: 5,
      }}
    >
      <Notification alert={alert} setAlert={setAlert} />
      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: 2,
          py: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {messages.map((message) => (
          <Stack
            key={message.id}
            direction="row"
            spacing={1}
            justifyContent={message.role === 'user' ? 'flex-end' : 'flex-start'}
            alignItems="flex-end"
          >
            {message.role === 'assistant' && (
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <BotIcon />
              </Avatar>
            )}

            <Card
              sx={{
                maxWidth: '100%',
                borderRadius: 2,
                bgcolor:
                  message.role === 'user' ? 'primary.main' : 'background.paper',
                color:
                  message.role === 'user'
                    ? 'primary.contrastText'
                    : 'text.primary',
                boxShadow: 3,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                  {message.content}
                </Typography>

                {message.attachedFiles?.length > 0 && (
                  <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                    {message.attachedFiles.map((file, idx) => (
                      <Chip
                        key={idx}
                        size="small"
                        icon={<FileTextIcon />}
                        label={file.name}
                        sx={{ bgcolor: 'grey.200' }}
                      />
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {message.role === 'user' && (
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <PersonIcon />
              </Avatar>
            )}
          </Stack>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Paper
        elevation={6}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1.5,
          mx: 2,
          my: 1,
          borderRadius: 3,
          backgroundColor: 'background.paper',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={5}
          placeholder="Ask me anything or attach documents..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: 'grey.50',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <IconButton onClick={() => fileInputRef.current?.click()}>
                  <AttachFileIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          color="primary"
          sx={{ borderRadius: 3, minWidth: '48px', minHeight: '48px' }}
          onClick={handleSend}
          disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <SendIcon />
          )}
        </Button>
      </Paper>

      {/* Attached files preview */}
      {attachedFiles.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" px={2} pt={1}>
          {attachedFiles.map((file, idx) => (
            <Chip
              key={idx}
              label={file.name}
              onDelete={() => removeAttachedFile(idx)}
              size="small"
              sx={{ bgcolor: 'grey.200' }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default ChatScreen;
