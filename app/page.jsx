'use client';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';


const repoUrlPattern = /^(https?:\/\/|git@)([\w.-]+)([:/])([\w.-]+)\/([\w.-]+?)(\.git)?$/i;

function parseGitHubRepo(repoUrl) {
  const match = repoUrl.match(repoUrlPattern);
  if (!match || !match[2].toLowerCase().includes('github.com')) {
    return null;
  }

  return {
    owner: match[4],
    repo: match[5].replace(/\.git$/i, ''),
  };
}

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
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchStatus, setBranchStatus] = useState('idle');
  const [branchErrorMessage, setBranchErrorMessage] = useState('');
  const [state, setState] = useState('idle');

  const repoUrlError = useMemo(() => repoUrl.length > 0 && !repoUrlPattern.test(repoUrl), [repoUrl]);
  const branchError = useMemo(() => branchName.trim().length === 0 || /\s/.test(branchName), [branchName]);
  const githubRepo = useMemo(() => parseGitHubRepo(repoUrl), [repoUrl]);
  const canSubmit = repoUrl.length > 0 && !repoUrlError && !branchError && branches.length > 0;

  useEffect(() => {
    const controller = new AbortController();

    async function fetchBranches() {
      setState('idle');
      setBranchName('');
      setBranches([]);
      setBranchErrorMessage('');

      if (!repoUrl || repoUrlError) {
        setBranchStatus('idle');
        return;
      }

      if (!githubRepo) {
        setBranchStatus('error');
        setBranchErrorMessage('Only GitHub repository URLs can be onboarded right now.');
        return;
      }

      setBranchStatus('loading');

      try {
        const response = await fetch(`https://api.github.com/repos/${githubRepo.owner}/${githubRepo.repo}/branches`, {
          signal: controller.signal,
          headers: { Accept: 'application/vnd.github+json' },
        });

        if (!response.ok) {
          throw new Error('Unable to load branches. Confirm the repository is public or GitHub access is configured.');
        }

        const branchData = await response.json();
        const branchNames = branchData.map((branch) => branch.name);
        setBranches(branchNames);
        setBranchName(branchNames[0] || '');
        setBranchStatus('ready');
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        setBranchStatus('error');
        setBranchErrorMessage(error.message);
      }
    }

    fetchBranches();

    return () => controller.abort();
  }, [githubRepo, repoUrl, repoUrlError]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    const onboarding = { repoUrl, branchName, onboardedAt: new Date().toISOString() };
    window.localStorage.setItem('repoWizard:onboarding', JSON.stringify(onboarding));
    setState('ready');
    router.push(`/dashboard?repo=${encodeURIComponent(repoUrl)}&branch=${encodeURIComponent(branchName)}`);
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.35)), radial-gradient(circle at 12% 12%, rgba(79,70,229,0.24), transparent 32%), radial-gradient(circle at 82% 10%, rgba(6,182,212,0.22), transparent 28%), radial-gradient(circle at 70% 78%, rgba(168,85,247,0.14), transparent 30%), #f6f8fc',
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
              <Typography variant="h1" sx={{ fontSize: { xs: 44, md: 72 }, lineHeight: 0.92 }}>
                Onboard the repositories you already use.
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 620, lineHeight: 1.7 }}>
                Repo Wizard is a modern web app for connecting an existing Git repository, selecting the source branch,
                and preparing it for analysis, automation, and team workflows.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="contained" size="large" href="#onboard" endIcon={<ArrowForwardIcon />}>
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
                    Enter a GitHub repository URL, then select one of its real branches from GitHub.
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

                <Select
                  value={branchName}
                  onChange={(event) => {
                    setBranchName(event.target.value);
                    setState('idle');
                  }}
                  displayEmpty
                  disabled={branchStatus !== 'ready'}
                  fullWidth
                >
                  <MenuItem value="" disabled>
                    {branchStatus === 'loading' ? 'Loading branches from GitHub...' : 'Select a branch'}
                  </MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch} value={branch}>
                      {branch}
                    </MenuItem>
                  ))}
                </Select>
                {branchStatus === 'ready' && (
                  <Alert severity="info">Loaded {branches.length} branch{branches.length === 1 ? '' : 'es'} from GitHub.</Alert>
                )}
                {branchStatus === 'error' && <Alert severity="error">{branchErrorMessage}</Alert>}

                <Button type="submit" variant="contained" size="large" disabled={!canSubmit}>
                  Onboard repository
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
