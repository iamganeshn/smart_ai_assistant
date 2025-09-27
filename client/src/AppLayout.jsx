import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  Button,
  Divider,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import MenuIcon from '@mui/icons-material/Menu';

const drawerWidth = 300;

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

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

  // Dummy conversation list
  const conversations = [
    { id: 1, name: 'General' },
    { id: 2, name: 'Team Updates' },
    { id: 3, name: 'Project X' },
  ];

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
          <List>
            {conversations.map((conv) => (
              <ListItem button key={conv.id}>
                {drawerOpen && <ListItemText primary={conv.name} />}
                <Divider />
              </ListItem>
            ))}
          </List>
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
