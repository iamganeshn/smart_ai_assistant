import React from 'react';
import {
  MenuItem,
  Typography,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

const UserMenuItems = ({ handleCloseUserMenu, logout, user }) => {
  if (!user) return null;
  return (
    <>
      {/* User Information */}
      <MenuItem
        sx={{
          '&:hover': {
            backgroundColor: 'transparent',
            cursor: 'default',
          },
        }}
      >
        <Avatar
          alt={user.name || user.email}
          src={user.avatar_image_url || undefined}
          sx={{ width: 30, height: 30, marginRight: 1 }}
        >
          {!user?.avatar_image_url &&
            (user.name || user.email || '?').charAt(0).toUpperCase()}
        </Avatar>
        <ListItemText
          primary={user.name || 'User'}
          secondary={
            <Typography variant="body2" color="text.primary">
              {user.email}
            </Typography>
          }
        />
      </MenuItem>

      <Divider sx={{ my: 0.5 }} />

      <MenuItem
        onClick={() => {
          logout();
          handleCloseUserMenu();
        }}
      >
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Logout</ListItemText>
      </MenuItem>
    </>
  );
};

export default UserMenuItems;
