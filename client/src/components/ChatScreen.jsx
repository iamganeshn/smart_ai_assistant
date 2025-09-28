import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Tooltip,
} from '@mui/material';
import { Backdrop, CircularProgress } from '@mui/material';

import Notification from '../utils/Notification';
import { useConversationContext } from '../contexts/ConversationContext';
import { useAuth } from '../hooks/useAuth';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  FileCopy as FileTextIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';

import * as API from '../utils/api';

// Simple animated dots component (1..3 looping)
const AnimatedDots = () => {
  const [count, setCount] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => (c === 3 ? 1 : c + 1)), 500);
    return () => clearInterval(id);
  }, []);
  return <span>{'.'.repeat(count)}</span>;
};

const ChatScreen = (props) => {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    conversations,
    currentConversation,
    fetchConversation,
    clearCurrentConversation,
    addNewConversation,
    updateConversationTitle,
    loading,
  } = useConversationContext();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [conversationDocuments, setConversationDocuments] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check if any doc is still processing
    const hasPending = conversationDocuments.some(
      (doc) => doc.status !== 'completed'
    );
    if (!hasPending) return; // stop polling if nothing pending

    const interval = setInterval(async () => {
      try {
        const updated = await API.fetchDocuments(
          conversationDocuments.map((d) => d.id),
          conversationId
        );
        // merge updated statuses into local state
        setConversationDocuments((prev) =>
          prev.map((doc) => updated.find((u) => u.id === doc.id) || doc)
        );
      } catch (err) {
        console.error('Polling failed', err);
      }
    }, 3000); // every 3s

    return () => clearInterval(interval); // cleanup
  }, [conversationDocuments, conversationId]);

  // Track whether we've already auto-created or consumed the startNew state to prevent loops
  const creationRef = useRef(false);
  const startNewConsumedRef = useRef(false);

  // Effect 1: fetch when explicit conversation id changes
  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId);
    }
  }, [conversationId, fetchConversation]);

  // Effect 2: handle routing / creation when no conversation id
  useEffect(() => {
    if (conversationId) return; // handled by effect 1
    if (loading) return; // wait until conversations list loaded

    const wantNew =
      location.state?.startNew === true && !startNewConsumedRef.current;

    // Explicit new conversation request
    if (wantNew && !creationRef.current) {
      creationRef.current = true;
      (async () => {
        try {
          const resp = await API.createConversation();
          const c = resp.data.data;
          addNewConversation({ id: c.id, title: c.title, messages: [] });
          startNewConsumedRef.current = true;
          navigate(`/chat/${c.id}`, { replace: true, state: {} }); // clear state
        } catch (e) {
          console.error('Failed to create new conversation', e);
          creationRef.current = false; // allow retry
        }
      })();
      return;
    }

    // If we have existing conversations, go to first
    if (conversations.length > 0) {
      navigate(`/chat/${conversations[0].id}`, { replace: true, state: {} });
      return;
    }

    // No conversations at all: create initial one (only once)
    if (!creationRef.current) {
      creationRef.current = true;
      (async () => {
        try {
          const resp = await API.createConversation();
          const c = resp.data.data;
          addNewConversation({ id: c.id, title: c.title, messages: [] });
          navigate(`/chat/${c.id}`, { replace: true, state: {} });
        } catch (e) {
          console.error('Failed to create initial conversation', e);
          creationRef.current = false; // allow retry
        }
      })();
    }
  }, [
    conversationId,
    loading,
    conversations.length,
    navigate,
    addNewConversation,
    location.state,
  ]);

  // Update messages when current conversation changes
  useEffect(() => {
    if (currentConversation?.messages) {
      setMessages(currentConversation?.messages || []);
    }
    if (currentConversation?.documents) {
      setConversationDocuments(currentConversation?.documents || []);
    }
  }, [currentConversation?.messages, currentConversation?.documents]);

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

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (fileInputRef.current) fileInputRef.current.value = '';
    try {
      setUploadingDocs(true);
      const uploadResp = await API.uploadDocuments(files, conversationId);
      if (uploadResp.failed?.length) {
        throw new Error(
          uploadResp.failed
            .map((f) => `${f.file}: ${f.errors.join(',')}`)
            .join('; ')
        );
      }
      // Merge new docs
      setConversationDocuments((prev) => [...prev, ...uploadResp.created]);
      setAlert({ message: 'Documents uploaded', type: 'success' });
    } catch (err) {
      setAlert({
        message: err.message || 'Failed to upload documents',
        type: 'error',
      });
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await API.deleteDocument(docId);
      setConversationDocuments((prev) => prev.filter((d) => d.id !== docId));
      setAlert({ message: 'Document removed', type: 'success' });
    } catch (err) {
      setAlert({
        message: err.message || 'Failed to delete document',
        type: 'error',
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return; // documents are optional; only send if text present

    const userMessage = {
      id: `user_msg-${Date.now()}`,
      content: input,
      role: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create empty AI message for streaming
    const aiMessage = {
      id: `assistant-msg-${Date.now()}`,
      content: '',
      role: 'assistant',
      loading: true,
      toolCalling: null,
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
          if (!line.startsWith('data: ')) continue;
          let raw = line.slice(6);
          if (!raw) continue;
          try {
            const data = JSON.parse(raw);
            switch (data.type) {
              case 'delta': {
                if (data.content) {
                  const firstChunk = fullContent.length === 0;
                  fullContent += data.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMessage.id
                        ? {
                            ...m,
                            content: fullContent,
                            loading: firstChunk ? false : m.loading,
                            toolCalling: null,
                          }
                        : m
                    )
                  );
                }
                break;
              }
              case 'tool_call': {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMessage.id
                      ? {
                          ...m,
                          toolCalling: {
                            tool: data.tool,
                            startedAt: Date.now(),
                          },
                          loading: false,
                        }
                      : m
                  )
                );
                break;
              }
              case 'metadata': {
                if (data.conversation_id)
                  newConversationId = data.conversation_id;
                if (data.conversation_title)
                  conversationTitle = data.conversation_title;
                break;
              }
              default: {
                // Fallback: treat as delta if content present
                if (data.content) {
                  fullContent += data.content;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMessage.id ? { ...m, content: fullContent } : m
                    )
                  );
                }
              }
            }
          } catch (err) {
            console.error('Failed to parse stream data', raw, err);
          }
        }
      }
      // Add updated title to conversation
      if (
        conversationTitle &&
        currentConversation?.title === 'New Conversation'
      ) {
        updateConversationTitle(newConversationId, conversationTitle);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setAlert({ message: 'Failed to send message', type: 'error' });
      setMessages((prev) =>
        prev.filter((m) => m.id !== userMessage.id && m.id !== aiMessage.id)
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
          'flexGrow': 1,
          'overflowY': 'auto',
          'px': 2,
          'py': 1,
          'display': 'flex',
          'flexDirection': 'column',
          'gap': 1.5,
          // Hide scrollbar (still scrollable)
          'msOverflowStyle': 'none', // IE/Edge
          'scrollbarWidth': 'none', // Firefox
          '&::-webkit-scrollbar': {
            display: 'none', // Chrome/Safari
          },
        }}
      >
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const isAssistant = message.role === 'assistant';
          return (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                gap: 0.5,
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                justifyContent={isUser ? 'flex-end' : 'flex-start'}
                alignItems="flex-start"
              >
                {isAssistant && (
                  <Avatar
                    sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}
                  >
                    <BotIcon fontSize="small" />
                  </Avatar>
                )}
                {isAssistant && (message.loading || message.toolCalling) && (
                  <Typography
                    variant="body2"
                    color="text.primary"
                    fontStyle="italic"
                  >
                    {message.loading && (
                      <>
                        Thinking <AnimatedDots />
                      </>
                    )}
                    {!message.loading && message.toolCalling && (
                      <>
                        Calling tool: {message.toolCalling.tool}{' '}
                        <AnimatedDots />
                      </>
                    )}
                  </Typography>
                )}
                <Card
                  sx={{
                    maxWidth: '80%',
                    borderRadius: 2,
                    bgcolor: isUser ? 'primary.main' : 'background.paper',
                    color: isUser ? 'primary.contrastText' : 'text.primary',
                    boxShadow: 3,
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <CardContent
                    sx={{
                      'px': 2,
                      'py': isAssistant ? 0 : 2,
                      '&:last-child': { pb: isAssistant ? 0 : 2 },
                    }}
                  >
                    {isAssistant ? (
                      <Box
                        sx={{
                          '& pre': {
                            bgcolor: 'grey.900',
                            color: 'grey.100',
                            p: 1.5,
                            borderRadius: 1,
                            overflowX: 'auto',
                            fontSize: '0.8rem',
                          },
                          '& code': {
                            bgcolor: 'grey.100',
                            color: 'grey.900',
                            px: 0.5,
                            py: 0.2,
                            borderRadius: 0.5,
                            fontSize: '0.85rem',
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                          },
                          '& pre code': {
                            bgcolor: 'transparent',
                            color: 'inherit',
                            p: 0,
                          },
                          '& a': {
                            color: 'primary.main',
                            textDecoration: 'none',
                          },
                          '& a:hover': {
                            textDecoration: 'underline',
                          },
                          '& ul, & ol': {
                            pl: 3,
                            my: 1,
                          },
                          '& blockquote': {
                            borderLeft: '4px solid',
                            borderColor: 'grey.300',
                            pl: 2,
                            ml: 0,
                            my: 1,
                            color: 'grey.700',
                            fontStyle: 'italic',
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                            py: 0.5,
                          },
                          'wordBreak': 'break-word',
                          'textAlign': 'left',
                        }}
                      >
                        {message.content && (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        )}
                      </Box>
                    ) : (
                      <Typography
                        variant="body1"
                        sx={{ wordBreak: 'break-word' }}
                      >
                        {message.content}
                      </Typography>
                    )}
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
                {isUser && (
                  <Avatar
                    alt={user.name}
                    src={user.avatar_image_url}
                    sx={{ width: 30, height: 30 }}
                  />
                )}
              </Stack>
            </Box>
          );
        })}
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
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <SendIcon />
          )}
        </Button>
      </Paper>

      {/* Attached (persisted) documents bar */}
      {conversationDocuments.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          px={2}
          pt={1}
          alignItems="center"
        >
          {conversationDocuments.map((doc) => (
            <Tooltip
              title={
                doc.status === 'completed'
                  ? 'Ready to use'
                  : 'Still processing, might take a few seconds'
              }
              arrow
            >
              <Chip
                key={doc.id}
                label={doc.file_name || `Doc ${doc.id}`}
                onDelete={() => handleDeleteDocument(doc.id)}
                size="small"
                variant="outlined"
                sx={{
                  bgcolor:
                    doc.status === 'completed'
                      ? 'success.light'
                      : 'warning.light',
                }}
              />
            </Tooltip>
          ))}
        </Stack>
      )}
      <Backdrop
        sx={(theme) => ({
          color: '#fff',
          zIndex: theme.zIndex.drawer + 1,
        })}
        open={uploadingDocs}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default ChatScreen;
