import React from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const Notification = (props) => {
  const { alert, setAlert } = props;
  const [open, setOpen] = React.useState(!!alert?.message);

  React.useEffect(() => {
    setOpen(!!alert?.message);
  }, [alert]);
  const handleClose = () => {
    setOpen(false);
    setAlert({ message: '', type: '' });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={open}
        onClose={handleClose}
        autoHideDuration={40500}
        message={alert?.message}
        key={'top-center'}
      >
        <Alert
          onClose={handleClose}
          severity={alert?.type}
          sx={{ width: '100%' }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleClose}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {alert?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Notification;
