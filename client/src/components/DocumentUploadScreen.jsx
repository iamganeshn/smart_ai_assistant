import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Paper,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as UploadIcon,
  Description as FileTextIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ClockIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
  uploadDocuments,
  fetchDocuments,
  deleteDocument,
  updateDocumentFile,
} from '../utils/api';

const UploadArea = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragging',
})(({ theme, isDragging }) => ({
  'border': `2px dashed ${
    isDragging ? theme.palette.primary.main : theme.palette.grey[300]
  }`,
  'borderRadius': theme.shape.borderRadius * 2,
  'padding': theme.spacing(8),
  'textAlign': 'center',
  'backgroundColor': isDragging
    ? theme.palette.primary.main + '08'
    : 'transparent',
  'transition': 'all 0.2s ease-in-out',
  'cursor': 'pointer',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.main + '04',
  },
}));

const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'status',
})(({ status, theme }) => {
  const colors = {
    processed: {
      bg: theme.palette.success.light,
      text: theme.palette.success.dark,
    },
    pending: {
      bg: theme.palette.warning.light,
      text: theme.palette.warning.dark,
    },
    error: { bg: theme.palette.error.light, text: theme.palette.error.dark },
  };

  return {
    backgroundColor: colors[status]?.bg || theme.palette.grey[200],
    color: colors[status]?.text || theme.palette.text.primary,
    fontWeight: 500,
  };
});

export function DocumentUploadScreen({ onBack }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeDoc, setActiveDoc] = useState(null);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [newFile, setNewFile] = useState(null);

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchDocuments();
      setDocuments(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Poll processing docs
  useEffect(() => {
    const pending = documents.some(
      (d) => d.status !== 'completed' && d.status !== 'failed'
    );
    if (!pending) return;
    const interval = setInterval(loadDocuments, 5000);
    return () => clearInterval(interval);
  }, [documents, loadDocuments]);

  const openMenu = (doc, e) => {
    setActiveDoc(doc);
    setMenuAnchor(e.currentTarget);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const handleUpload = async (files) => {
    if (!files.length) return;
    setUploadProgress(0);
    try {
      const resp = await uploadDocuments(Array.from(files));
      // quick optimistic merge
      setDocuments((prev) => [...resp.created, ...prev]);
    } catch (e) {
      // swallow; could add alert
    } finally {
      setTimeout(() => setUploadProgress(null), 800);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length) {
      handleUpload(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleUpload(e.dataTransfer.files);
  };

  const startReplace = () => {
    setReplaceDialogOpen(true);
    closeMenu();
  };
  const startDelete = () => {
    setDeleteDialogOpen(true);
    closeMenu();
  };

  const confirmDelete = async () => {
    if (!activeDoc) return;
    try {
      await deleteDocument(activeDoc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== activeDoc.id));
    } finally {
      setDeleteDialogOpen(false);
      setActiveDoc(null);
    }
  };

  const confirmReplace = async () => {
    if (!activeDoc || !newFile) return;
    try {
      setReplacing(true);
      await updateDocumentFile(activeDoc.id, newFile);
      setReplaceDialogOpen(false);
      setActiveDoc(null);
      setNewFile(null);
      loadDocuments();
    } finally {
      setReplacing(false);
    }
  };

  const replaceInputChange = (e) => {
    if (e.target.files?.[0]) setNewFile(e.target.files[0]);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed':
        return <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />;
      case 'pending':
        return <ClockIcon sx={{ color: 'warning.main', fontSize: 16 }} />;
      case 'error':
        return <CloseIcon sx={{ color: 'error.main', fontSize: 16 }} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Upload Section */}
          <Card>
            <CardContent>
              <UploadArea
                isDragging={isDragging}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                // onClick={() => document.getElementById('file-upload')?.click()}
              >
                {uploadProgress !== null ? (
                  <Box>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        opacity: 0.1,
                      }}
                    >
                      <UploadIcon
                        sx={{ fontSize: 32, color: 'primary.main' }}
                      />
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Uploading document...
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress}
                      sx={{ width: 300, mx: 'auto', mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {uploadProgress}% complete
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: 'grey.200',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <UploadIcon
                        sx={{ fontSize: 32, color: 'text.secondary' }}
                      />
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Drag and drop files here, or click to browse
                    </Typography>
                    <input
                      type="file"
                      id="file-upload"
                      style={{ display: 'none' }}
                      accept=".pdf,.doc,.docx,.txt"
                      multiple
                      onChange={handleFileSelect}
                    />
                    <Button
                      variant="contained"
                      component="label"
                      htmlFor="file-upload"
                    >
                      Choose Files
                    </Button>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2 }}
                    >
                      Maximum file size: 10MB per file
                    </Typography>
                  </Box>
                )}
              </UploadArea>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <CardHeader
              title="Uploaded Documents"
              subheader="Manage and monitor your uploaded documents"
            />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="left">Document</TableCell>
                      <TableCell align="center">Uploaded By</TableCell>
                      <TableCell align="center">Date</TableCell>
                      <TableCell align="center">Size</TableCell>
                      <TableCell align="center">Type</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={8}>Loading…</TableCell>
                      </TableRow>
                    )}
                    {!loading && documents.length === 0 && (
                      <TableRow>
                        <TableCell align="center" colSpan={8}>
                          No documents uploaded.
                        </TableCell>
                      </TableRow>
                    )}
                    {documents.map((doc) => (
                      <TableRow key={doc.id} hover>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <FileTextIcon color="action" />
                            <Typography variant="body2">
                              {doc.file_name || doc.id}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">-</TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {doc.created_at
                              ? new Date(doc.created_at).toLocaleDateString()
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography align="center" variant="body2">
                            {doc.file_size || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography align="center" variant="body2">
                            {doc.file_type
                              ? (
                                  doc.file_type.split('/').pop() || ''
                                ).toUpperCase()
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center', // vertical alignment
                              justifyContent: 'center', // horizontal alignment
                              gap: 1,
                            }}
                          >
                            {doc.status === 'completed' && (
                              <CheckCircleIcon
                                sx={{ color: 'success.main', fontSize: 16 }}
                              />
                            )}
                            {doc.status !== 'completed' &&
                              doc.status !== 'failed' && (
                                <ClockIcon
                                  sx={{ color: 'warning.main', fontSize: 16 }}
                                />
                              )}
                            {doc.status === 'failed' && (
                              <CloseIcon
                                sx={{ color: 'error.main', fontSize: 16 }}
                              />
                            )}
                            <StatusChip
                              label={
                                doc.status.charAt(0).toUpperCase() +
                                doc.status.slice(1)
                              }
                              status={
                                doc.status === 'completed'
                                  ? 'processed'
                                  : doc.status === 'failed'
                                  ? 'error'
                                  : 'pending'
                              }
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              alignItems: 'center', // vertical alignment
                              justifyContent: 'center', // horizontal alignment
                            }}
                          >
                            {doc.file_url && (
                              <Tooltip title="Download">
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={doc.file_url}
                                  target="_blank"
                                  rel="noopener"
                                  download
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <IconButton
                              size="small"
                              onClick={(e) => openMenu(doc, e)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
        >
          <MenuItem onClick={startReplace}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Replace File
          </MenuItem>
          <MenuItem onClick={startDelete}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        </Menu>
        <Dialog
          open={replaceDialogOpen}
          onClose={() => setReplaceDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Replace Document</DialogTitle>
          <DialogContent>
            <Button variant="outlined" component="label" size="small">
              Choose New File
              <input type="file" hidden onChange={replaceInputChange} />
            </Button>
            {newFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {newFile.name}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setReplaceDialogOpen(false);
                setNewFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!newFile || replacing}
              onClick={confirmReplace}
            >
              {replacing ? 'Replacing…' : 'Replace'}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Delete Document</DialogTitle>
          <DialogContent>
            Are you sure you want to delete "
            {activeDoc?.file_name || activeDoc?.id}"?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
