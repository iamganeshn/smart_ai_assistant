import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Box,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import { useConversationContext } from './contexts/ConversationContext';

const drawerWidth = 300;

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { conversations, loading } = useConversationContext();

  const [drawerOpen, setDrawerOpen] = useState(true);

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  // Determine current view from route
  const currentView = location.pathname.includes('chat')
    ? 'conversations'
    : location.pathname.includes('documents')
    ? 'documents'
    : location.pathname.includes('employees')
    ? 'team'
    : 'conversations';

  // Get current conversation ID from URL
  const conversationId = location.pathname.match(/\/chat\/(.+)/)?.[1];

  const handleNewConversation = () => {
    navigate('/chat');
  };

  const handleConversationClick = (id) => {
    navigate(`/chat/${id}`);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ position: 'relative' }}>
          {/* Drawer toggle – float above drawer */}
          {currentView === 'conversations' && (
            <IconButton
              color="inherit"
              onClick={toggleDrawer}
              sx={{
                position: 'absolute',
                top: 8,
                left: drawerOpen ? `${drawerWidth - 48}px` : '12px', // icon stays at drawer's right edge
                zIndex: 1400,
                width: 48,
                height: 48,
                borderRadius: 0,
                transition: 'left 0.3s', // smooth move when drawer opens/closes
              }}
            >
              {drawerOpen ? <ArrowBackIosNewIcon /> : <MenuIcon />}
            </IconButton>
          )}

          {/* Brand */}
          <Typography
            variant="h6"
            noWrap
            sx={{
              ml:
                currentView === 'conversations'
                  ? drawerOpen
                    ? `${drawerWidth}px`
                    : '60px'
                  : 0,
              transition: 'margin-left 0.3s',
            }}
          >
            Tech9 GPT
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Top Navigation */}
          <Button color="inherit" onClick={() => navigate('/chat')}>
            Conversations
          </Button>
          <Button color="inherit" onClick={() => navigate('/documents')}>
            Documents
          </Button>
          <Button color="inherit" onClick={() => navigate('/employees')}>
            Team
          </Button>
        </Toolbar>
      </AppBar>

      {/* Drawer only for Conversations */}
      {currentView === 'conversations' && (
        <Drawer
          variant="persistent"
          open={drawerOpen}
          sx={{
            'width': drawerOpen ? drawerWidth : 60,
            'flexShrink': 0,
            'transition': 'width 0.3s',
            '& .MuiDrawer-paper': {
              width: drawerOpen ? drawerWidth : 60,
              boxSizing: 'border-box',
              transition: 'width 0.3s',
            },
          }}
        >
          <Toolbar />
          <Divider />

          {/* New Conversation Button */}
          <Box sx={{ p: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleNewConversation}
              sx={{ display: drawerOpen ? 'flex' : 'none' }}
            >
              New Chat
            </Button>
            {!drawerOpen && (
              <IconButton
                onClick={handleNewConversation}
                sx={{ width: '100%' }}
              >
                <AddIcon />
              </IconButton>
            )}
          </Box>

          <Divider />

          {/* Conversations List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List>
              {conversations.map((conv) => (
                <ListItemButton
                  key={conv.id}
                  selected={conversationId === conv.id.toString()}
                  onClick={() => handleConversationClick(conv.id)}
                  sx={{
                    minHeight: 48,
                    justifyContent: drawerOpen ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  {drawerOpen && (
                    <ListItemText
                      primary={conv.title}
                      sx={{
                        'opacity': drawerOpen ? 1 : 0,
                        '& .MuiListItemText-primary': {
                          fontSize: '0.875rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        },
                      }}
                    />
                  )}
                </ListItemButton>
              ))}
            </List>
          )}
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: 'margin-left 0.3s, width 0.3s',
          width: `calc(100vw - ${drawerWidth}px)`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
