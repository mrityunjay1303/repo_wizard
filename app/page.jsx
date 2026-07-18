'use client';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import GitHubIcon from '@mui/icons-material/GitHub';
import SecurityIcon from '@mui/icons-material/Security';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';


const repoUrlPattern = /^(https?:\/\/|git@)([\w.-]+)([:/])([\w.-]+)\/([\w.-]+?)(\.git)?$/i;

const features = [
  {
    icon: <CloudQueueIcon />,
    title: 'Connect existing code',
    copy: 'Point Repo Wizard at the repository your team already owns instead of creating a new project shell.',
  },
  {
    icon: <BoltIcon />,
    title: 'Branch-aware setup',
    copy: 'Choose the exact branch that should be indexed, analyzed, and prepared for automation.',
  },
  {
    icon: <SecurityIcon />,
    title: 'Secure onboarding',
    copy: 'Repository metadata is validated up front so the next step can request the right credentials and permissions.',
  },
];

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [branchName, setBranchName] = useState('main');
  const [state, setState] = useState('idle');

  const repoUrlError = useMemo(() => repoUrl.length > 0 && !repoUrlPattern.test(repoUrl), [repoUrl]);
  const branchError = useMemo(() => branchName.trim().length === 0 || /\s/.test(branchName), [branchName]);
  const canSubmit = repoUrl.length > 0 && !repoUrlError && !branchError;

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setState('ready');
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at top left, rgba(79,70,229,0.18), transparent 34%), radial-gradient(circle at 80% 15%, rgba(6,182,212,0.16), transparent 30%), #f6f8fc',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 6, md: 10 } }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                color: 'white',
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                boxShadow: '0 16px 40px rgba(79, 70, 229, 0.28)',
              }}
            >
              <AutoAwesomeIcon />
            </Box>
            <Typography variant="h5">Repo Wizard</Typography>
          </Stack>
          <Chip label="Existing repository onboarding" color="primary" variant="outlined" />
        </Stack>

        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Chip
                icon={<CheckCircleIcon />}
                label="Bring your own repo URL and branch"
                sx={{ alignSelf: 'flex-start', bgcolor: 'white', border: '1px solid rgba(79,70,229,0.16)' }}
              />
              <Typography variant="h1" sx={{ fontSize: { xs: 44, md: 68 }, lineHeight: 0.95 }}>
                Onboard the repositories you already use.
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 620, lineHeight: 1.7 }}>
                Repo Wizard is a modern web app for connecting an existing Git repository, selecting the source branch,
                and preparing it for analysis, automation, and team workflows.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="contained" size="large" href="#onboard">
                  Start onboarding
                </Button>
                <Button variant="outlined" size="large">
                  View requirements
                </Button>
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              id="onboard"
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                border: '1px solid rgba(16,24,40,0.08)',
                boxShadow: '0 30px 80px rgba(15, 23, 42, 0.12)',
                backdropFilter: 'blur(14px)',
              }}
            >
              <Stack spacing={3} component="form" onSubmit={handleSubmit}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                    Repository details
                  </Typography>
                  <Typography color="text.secondary">
                    Enter the URL and branch name for the existing repository you want to onboard.
                  </Typography>
                </Box>

                <TextField
                  label="Repository URL"
                  placeholder="https://github.com/acme/platform.git"
                  value={repoUrl}
                  onChange={(event) => {
                    setRepoUrl(event.target.value.trim());
                    setState('idle');
                  }}
                  error={repoUrlError}
                  helperText={repoUrlError ? 'Use an HTTPS or SSH Git repository URL.' : 'HTTPS and SSH Git URLs are supported.'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <GitHubIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  fullWidth
                />

                <TextField
                  label="Branch name"
                  placeholder="main"
                  value={branchName}
                  onChange={(event) => {
                    setBranchName(event.target.value.trim());
                    setState('idle');
                  }}
                  error={branchError}
                  helperText={branchError ? 'Branch name is required and cannot contain spaces.' : 'Choose the branch to analyze first.'}
                  fullWidth
                />

                <Button type="submit" variant="contained" size="large" disabled={!canSubmit}>
                  Validate repository
                </Button>

                {state === 'ready' && (
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    Repository onboarding is ready for <strong>{branchName}</strong>. The next step can request access and clone{' '}
                    <strong>{repoUrl}</strong>.
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: { xs: 6, md: 10 } }}>
          {features.map((feature) => (
            <Grid item xs={12} md={4} key={feature.title}>
              <Card elevation={0} sx={{ height: '100%', border: '1px solid rgba(16,24,40,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Box sx={{ color: 'primary.main' }}>{feature.icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {feature.title}
                    </Typography>
                    <Typography color="text.secondary">{feature.copy}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 6 }} />
        <Typography color="text.secondary" textAlign="center">
          Designed for teams that need to onboard mature repositories without changing how they work in Git.
        </Typography>
      </Container>
    </Box>
  );
}
