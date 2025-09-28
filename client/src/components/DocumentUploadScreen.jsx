import { useState } from 'react';
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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as UploadIcon,
  Description as FileTextIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ClockIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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
  const [documents] = useState([
    {
      id: '1',
      title: 'Employee Handbook 2024',
      category: 'HR',
      uploadedBy: 'Sarah Johnson',
      uploadDate: new Date('2024-01-15'),
      status: 'processed',
      size: '2.4 MB',
    },
    {
      id: '2',
      title: 'Development Guidelines',
      category: 'Engineering',
      uploadedBy: 'Mike Chen',
      uploadDate: new Date('2024-01-10'),
      status: 'processed',
      size: '1.8 MB',
    },
    {
      id: '3',
      title: 'Client Onboarding Process',
      category: 'Sales',
      uploadedBy: 'John Doe',
      uploadDate: new Date('2024-01-12'),
      status: 'pending',
      size: '3.2 MB',
    },
    {
      id: '4',
      title: 'Security Policy Update',
      category: 'IT',
      uploadedBy: 'Lisa Wong',
      uploadDate: new Date('2024-01-08'),
      status: 'error',
      size: '1.1 MB',
    },
  ]);

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

    // Simulate file upload
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 0;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setUploadProgress(null), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Simulate file upload
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null) return 0;
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setUploadProgress(null), 1000);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
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
            <CardHeader
              title="Upload Documents"
              subheader="Add documents to the Tech9 GPT knowledge base. Supported formats: PDF, DOC, DOCX, TXT"
            />
            <CardContent>
              <UploadArea
                isDragging={isDragging}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
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
                      <TableCell>Document</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Uploaded By</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <FileTextIcon color="action" />
                            <Typography variant="body2">{doc.title}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={doc.category}
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {doc.uploadedBy}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {doc.uploadDate.toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{doc.size}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {getStatusIcon(doc.status)}
                            <StatusChip
                              label={
                                doc.status.charAt(0).toUpperCase() +
                                doc.status.slice(1)
                              }
                              status={doc.status}
                              size="small"
                            />
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
      </Container>
    </Box>
  );
}
