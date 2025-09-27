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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Avatar,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Paper,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Work as BriefcaseIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StatusDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'availability',
})(({ availability, theme }) => {
  const colors = {
    available: theme.palette.success.main,
    busy: theme.palette.warning.main,
    unavailable: theme.palette.error.main,
  };

  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: colors[availability] || theme.palette.grey[400],
  };
});

const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'status',
})(({ status, theme }) => {
  const colors = {
    planning: { bg: theme.palette.info.light, text: theme.palette.info.dark },
    active: {
      bg: theme.palette.success.light,
      text: theme.palette.success.dark,
    },
    completed: { bg: theme.palette.grey[200], text: theme.palette.grey[700] },
  };

  return {
    backgroundColor: colors[status]?.bg || theme.palette.grey[200],
    color: colors[status]?.text || theme.palette.text.primary,
    fontWeight: 500,
  };
});

const MatchCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export function EmployeeProjectScreen({ onBack }) {
  const [tabValue, setTabValue] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);

  const [employees] = useState([
    {
      id: '1',
      name: 'Sarah Johnson',
      skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
      availability: 'available',
      currentProject: null,
      email: 'sarah.johnson@tech9.com',
      department: 'Engineering',
    },
    {
      id: '2',
      name: 'Mike Chen',
      skills: ['Python', 'Machine Learning', 'Docker', 'Kubernetes'],
      availability: 'busy',
      currentProject: 'Project Alpha',
      email: 'mike.chen@tech9.com',
      department: 'Engineering',
    },
    {
      id: '3',
      name: 'Lisa Wong',
      skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite'],
      availability: 'available',
      currentProject: null,
      email: 'lisa.wong@tech9.com',
      department: 'Design',
    },
    {
      id: '4',
      name: 'John Doe',
      skills: ['Sales', 'CRM', 'Client Relations', 'Presentation'],
      availability: 'unavailable',
      currentProject: 'Project Beta',
      email: 'john.doe@tech9.com',
      department: 'Sales',
    },
  ]);

  const [projects] = useState([
    {
      id: '1',
      name: 'Project Alpha',
      client: 'TechCorp Inc.',
      requiredSkills: ['React', 'Node.js', 'AWS'],
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-04-30'),
      status: 'active',
      assignedEmployees: ['2'],
    },
    {
      id: '2',
      name: 'Project Beta',
      client: 'StartupXYZ',
      requiredSkills: ['Python', 'Machine Learning', 'Docker'],
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-03-15'),
      status: 'active',
      assignedEmployees: ['4'],
    },
    {
      id: '3',
      name: 'Project Gamma',
      client: 'Enterprise Solutions Ltd.',
      requiredSkills: ['UI/UX Design', 'React', 'TypeScript'],
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-05-31'),
      status: 'planning',
      assignedEmployees: [],
    },
  ]);

  const calculateMatchScore = (employee, project) => {
    const matchingSkills = employee.skills.filter((skill) =>
      project.requiredSkills.some(
        (reqSkill) =>
          reqSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(reqSkill.toLowerCase())
      )
    );
    return Math.round(
      (matchingSkills.length / project.requiredSkills.length) * 100
    );
  };

  const getMatchingEmployees = (project) => {
    return employees
      .map((emp) => ({
        ...emp,
        matchScore: calculateMatchScore(emp, project),
        matchingSkills: emp.skills.filter((skill) =>
          project.requiredSkills.some(
            (reqSkill) =>
              reqSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(reqSkill.toLowerCase())
          )
        ),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="inherit" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">Team & Project Management</Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              icon={<PersonIcon />}
              iconPosition="start"
              label="Employees"
              sx={{ textTransform: 'none' }}
            />
            <Tab
              icon={<BriefcaseIcon />}
              iconPosition="start"
              label="Projects"
              sx={{ textTransform: 'none' }}
            />
            <Tab
              icon={<TrendingUpIcon />}
              iconPosition="start"
              label="Smart Matching"
              sx={{ textTransform: 'none' }}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Card>
            <CardHeader
              title="Team Members"
              subheader="Manage employee skills and availability"
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setEmployeeDialogOpen(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Add Employee
                </Button>
              }
            />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Skills</TableCell>
                      <TableCell>Availability</TableCell>
                      <TableCell>Current Project</TableCell>
                      <TableCell>Department</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'primary.light',
                              }}
                            >
                              <PersonIcon fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {employee.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {employee.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                          >
                            {employee.skills.map((skill, idx) => (
                              <Chip
                                key={idx}
                                label={skill}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <StatusDot availability={employee.availability} />
                            <Typography
                              variant="body2"
                              sx={{ textTransform: 'capitalize' }}
                            >
                              {employee.availability}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {employee.currentProject || (
                              <Typography
                                component="span"
                                color="text.secondary"
                              >
                                None
                              </Typography>
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {employee.department}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardHeader
              title="Projects"
              subheader="Manage client projects and requirements"
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setProjectDialogOpen(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Add Project
                </Button>
              }
            />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Client</TableCell>
                      <TableCell>Required Skills</TableCell>
                      <TableCell>Timeline</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <BriefcaseIcon color="action" />
                            <Typography variant="body2">
                              {project.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {project.client}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                          >
                            {project.requiredSkills.map((skill, idx) => (
                              <Chip
                                key={idx}
                                label={skill}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="caption">
                              {project.startDate.toLocaleDateString()} -{' '}
                              {project.endDate.toLocaleDateString()}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <StatusChip
                            label={
                              project.status.charAt(0).toUpperCase() +
                              project.status.slice(1)
                            }
                            status={project.status}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setSelectedProject(project);
                              setTabValue(2);
                            }}
                            sx={{ textTransform: 'none' }}
                          >
                            Find Match
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardHeader
              title="Smart Project Matching"
              subheader="AI-powered employee matching based on skills and availability"
            />
            <CardContent>
              {selectedProject ? (
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 3,
                    }}
                  >
                    <Box>
                      <Typography variant="h6">
                        {selectedProject.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Client: {selectedProject.client}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => setSelectedProject(null)}
                      sx={{ textTransform: 'none' }}
                    >
                      Clear Selection
                    </Button>
                  </Box>

                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Top Matching Employees
                  </Typography>

                  {getMatchingEmployees(selectedProject).map((employee) => (
                    <MatchCard key={employee.id}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: 'primary.light',
                            }}
                          >
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {employee.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {employee.department}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="h4"
                              color="primary"
                              fontWeight="bold"
                            >
                              {employee.matchScore}%
                            </Typography>
                            <StatusDot availability={employee.availability} />
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 0.5,
                              justifyContent: 'flex-end',
                            }}
                          >
                            {employee.matchingSkills.map((skill, skillIdx) => (
                              <Chip
                                key={skillIdx}
                                label={skill}
                                size="small"
                                sx={{
                                  bgcolor: 'primary.light',
                                  color: 'primary.dark',
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          mt: 2,
                          pt: 2,
                          borderTop: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Strong match with {employee.matchingSkills.length} of{' '}
                          {selectedProject.requiredSkills.length} required
                          skills.
                          {employee.availability === 'available' &&
                            ' Currently available for assignment.'}
                          {employee.availability === 'busy' &&
                            ' Currently assigned to another project.'}
                          {employee.availability === 'unavailable' &&
                            ' Currently unavailable.'}
                        </Typography>
                      </Box>
                    </MatchCard>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <PeopleIcon
                    sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
                  />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Select a Project
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    Choose a project from the Projects tab to see matching
                    employees
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setSelectedProject(projects[0]);
                    }}
                    sx={{ textTransform: 'none' }}
                  >
                    View Example Match
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        {/* Employee Dialog */}
        <Dialog
          open={employeeDialogOpen}
          onClose={() => setEmployeeDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
            >
              <TextField
                label="Name"
                placeholder="Enter employee name"
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                placeholder="Enter email address"
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select label="Department">
                  <MenuItem value="engineering">Engineering</MenuItem>
                  <MenuItem value="design">Design</MenuItem>
                  <MenuItem value="sales">Sales</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Skills"
                placeholder="React, TypeScript, Node.js"
                fullWidth
                helperText="Comma-separated"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEmployeeDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => setEmployeeDialogOpen(false)}
            >
              Add Employee
            </Button>
          </DialogActions>
        </Dialog>

        {/* Project Dialog */}
        <Dialog
          open={projectDialogOpen}
          onClose={() => setProjectDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add New Project</DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
            >
              <TextField
                label="Project Name"
                placeholder="Enter project name"
                fullWidth
              />
              <TextField
                label="Client"
                placeholder="Enter client name"
                fullWidth
              />
              <TextField
                label="Required Skills"
                placeholder="React, TypeScript, Node.js"
                fullWidth
                helperText="Comma-separated"
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Start Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="End Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => setProjectDialogOpen(false)}
            >
              Create Project
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
