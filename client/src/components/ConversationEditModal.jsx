import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Typography,
} from '@mui/material';
import { updateConversation } from '../utils/api';

const ConversationEditModal = ({ open, onClose, conversation, onUpdated }) => {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (conversation) {
      setTitle(conversation.title || '');
      setError('');
    }
  }, [conversation]);

  const handleSave = async () => {
    if (!conversation) return;
    if (!title.trim()) {
      setError('Title required');
      return;
    }
    try {
      setSaving(true);
      await updateConversation(conversation.id, {
        conversation: { title: title.trim() },
      });
      onUpdated?.(conversation.id, title.trim());
      onClose();
    } catch (e) {
      setError('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Conversation</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            size="small"
          />
          {error && (
            <Typography color="error" variant="caption">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !title.trim()}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ConversationEditModal;
