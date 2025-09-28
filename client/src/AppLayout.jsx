import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemText,
  ListItemButton,
  Box,
  Button,
  Divider,
  CircularProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ConversationEditModal from './components/ConversationEditModal';
import { deleteConversation } from './utils/api';
import { useConversationContext } from './contexts/ConversationContext';
import { useAuth } from './hooks/useAuth';

const drawerWidth = 300;

export default function AppLayout({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversations, loading, updateConversationTitle, removeConversation } = useConversationContext();

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [editingConversation, setEditingConversation] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuConversation, setMenuConversation] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  const openMenu = (conv, e) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setMenuConversation(conv);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleMenuEdit = () => {
    if (menuConversation) setEditingConversation(menuConversation);
    closeMenu();
  };

  const handleMenuDelete = () => {
    if (menuConversation) setDeleteDialogOpen(true);
    closeMenu();
  };

  const handleUpdated = (id, title) => {
    updateConversationTitle(id, title);
  };

  const handleDeleted = (id) => {
    removeConversation(id);
    if (location.pathname.includes(`/chat/${id}`)) navigate('/chat');
  };

  const confirmDelete = () => {
    if (!menuConversation) { setDeleteDialogOpen(false); return; }
    const id = menuConversation.id;
    deleteConversation(id)
      .then(() => {
        handleDeleted(id);
        setDeleteDialogOpen(false);
        setMenuConversation(null);
      })
      .catch(() => {
        setDeleteDialogOpen(false);
      });
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    if (!editingConversation) setMenuConversation(null);
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
          {user.role === 'admin' && (
            <>
              <Button color="inherit" onClick={() => navigate('/chat')}>
                Conversations
              </Button>
              <Button color="inherit" onClick={() => navigate('/documents')}>
                Documents
              </Button>
              <Button color="inherit" onClick={() => navigate('/employees')}>
                Team
              </Button>
            </>
          )}
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
                    position: 'relative'
                  }}
                >
                  {drawerOpen && (
                    <>
                      <ListItemText
                        primary={conv.title}
                        sx={{
                          'opacity': drawerOpen ? 1 : 0,
                          '& .MuiListItemText-primary': {
                            fontSize: '0.875rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            pr: 5,
                          },
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => openMenu(conv, e)}
                        sx={{ position: 'absolute', right: 4, top: 6 }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </>
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
        <ConversationEditModal
          open={!!editingConversation}
          conversation={editingConversation}
          onClose={() => setEditingConversation(null)}
          onUpdated={handleUpdated}
        />
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={closeMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleMenuEdit}>Edit</MenuItem>
          <MenuItem onClick={handleMenuDelete}>Delete</MenuItem>
        </Menu>
        <Dialog open={deleteDialogOpen} onClose={cancelDelete} maxWidth="xs" fullWidth>
          <DialogTitle>Delete Conversation</DialogTitle>
          <DialogContent>
            Are you sure you want to delete "{menuConversation?.title}"? This cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDelete}>Cancel</Button>
            <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
