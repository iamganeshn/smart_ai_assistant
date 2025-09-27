import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
} from '@mui/material';

import Notification from '../utils/Notification';

import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  FileCopy as FileTextIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';

import * as API from '../utils/api';

const ChatScreen = (props) => {
  const location = useLocation();
  const [messages, setMessages] = useState([
    {
      id: '1',
      content:
        "Hello! I'm Tech9 GPT, your internal AI assistant. Ask me anything or upload documents for analysis.",
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  console.log('location.state: ', location.state);
  const [alert, setAlert] = useState({
    message: location.state?.alert?.message,
    type: location.state?.alert?.type,
  });

  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

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
      id: `msg-${(Date.now() + 1).toString()}`,
      content: input || `Uploaded ${attachedFiles.length} file(s)`,
      role: 'user',
      timestamp: new Date(),
      attachedFiles,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Create empty AI message for streaming
    const aiMessage = {
      id: `msg-${(Date.now() + 1).toString()}`,
      content: 'Typing...',
      role: 'assistant',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiMessage]);

    const response = await API.chat(userMessage.content);
    // Stream response
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullContent = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);

      const lines = chunk.split('\n');
      console.log('Received chunk:', chunk);
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          let data = line.slice(6);
          if (data === '[DONE]') continue;

          data = JSON.parse(data);
          console.log('Parsed data:', data['content']);

          if (data['content']) {
            fullContent += data['content'];

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id ? { ...msg, content: fullContent } : msg
              )
            );
          }
        }
      }
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

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.2, display: 'block', textAlign: 'right' }}
                >
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
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
          disabled={!input.trim() && attachedFiles.length === 0}
        >
          <SendIcon />
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
