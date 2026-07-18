'use client';

import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BoltIcon from '@mui/icons-material/Bolt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import GitHubIcon from '@mui/icons-material/GitHub';
import SecurityIcon from '@mui/icons-material/Security';
import CloseIcon from '@mui/icons-material/Close';
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
  Modal,
  IconButton,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useOnboarding } from './context';

const repoUrlPattern = /^(https?:\/\/|git@)([\w.-]+)([:/])([\w.-]+)\/([\w.-]+?)(\.git)?$/i;

function parseGitHubRepo(repoUrl) {
  const match = repoUrl.match(repoUrlPattern);
  if (!match || !match[2].toLowerCase().includes('github.com')) return null;
  return { owner: match[4], repo: match[5].replace(/\.git$/i, '') };
}

const features = [
  {
    icon: <CloudQueueIcon />,
    title: 'Instant Code Indexing',
    copy: 'Browse and preview your entire repository structure with live GitHub syncing and intelligent code navigation.',
  },
  {
    icon: <BoltIcon />,
    title: 'Autonomous PR Reviews',
    copy: 'Leverage LLM agents to detect structural deviations, compliance issues, and quality exceptions in every pull request.',
  },
  {
    icon: <SecurityIcon />,
    title: 'Architecture Insights',
    copy: 'Visualize your tech stack and generate high-level summaries of repository health and architectural patterns.',
  },
];

export default function Home() {
  const router = useRouter();
  const { setOnboardingData } = useOnboarding();

  const [openModal, setOpenModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [pat, setPat] = useState(process.env.NEXT_PUBLIC_PAT_TOKEN || '');
  const [branchName, setBranchName] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchStatus, setBranchStatus] = useState('idle');
  const [branchErrorMessage, setBranchErrorMessage] = useState('');

  const repoUrlError = useMemo(() => repoUrl.length > 0 && !repoUrlPattern.test(repoUrl), [repoUrl]);
  const githubRepo = useMemo(() => parseGitHubRepo(repoUrl), [repoUrl]);
  const canSubmit = repoUrl.length > 0 && !repoUrlError && branches.length > 0;

  useEffect(() => {
    const controller = new AbortController();
    async function fetchBranches() {
      if (!repoUrl || repoUrlError || !githubRepo) {
        setBranchStatus('idle');
        return;
      }
      setBranchStatus('loading');
      try {
        const headers = { Accept: 'application/vnd.github+json' };
        if (pat) headers.Authorization = `token ${pat}`;
        const response = await fetch(`https://api.github.com/repos/${githubRepo.owner}/${githubRepo.repo}/branches`, {
          signal: controller.signal,
          headers,
        });
        if (!response.ok) throw new Error('Unable to load branches.');
        const branchData = await response.json();
        const branchNames = branchData.map((b) => b.name);
        setBranches(branchNames);
        setBranchName(branchNames[0] || '');
        setBranchStatus('ready');
      } catch (error) {
        if (error.name !== 'AbortError') {
          setBranchStatus('error');
          setBranchErrorMessage(error.message);
        }
      }
    }
    fetchBranches();
    return () => controller.abort();
  }, [githubRepo, repoUrl, repoUrlError, pat]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setOnboardingData({ repoUrl, branchName, pat });
    setOpenModal(false);
    router.push('/dashboard');
  }

  return (
    <Box sx={{  minHeight: '100vh', background: 'linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.35)), radial-gradient(circle at 12% 12%, rgba(79,70,229,0.24), transparent 32%), radial-gradient(circle at 82% 10%, rgba(6,182,212,0.22), transparent 28%), radial-gradient(circle at 70% 78%, rgba(168,85,247,0.14), transparent 30%), #f6f8fc' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, md: 7 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ display: 'inline-block', mb: { xs: 5, md: 10 } }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box sx={{ width: 42, height: 42, borderRadius: 3, display: 'grid', placeItems: 'center', color: 'white', background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', boxShadow: '0 16px 40px rgba(79, 70, 229, 0.28)' }}>
              <AutoAwesomeIcon />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Repo Wizard</Typography>
          </Stack>
          <Stack>
          <Chip label="Zero Infrastructure Configuration Required" color="primary" variant="outlined" sx={{ display: { xs: 'none', sm: 'inline-flex' },mt:2, fontWeight: 600 }} />
        </Stack>
        </Stack>
        

        <Grid container spacing={4} alignItems="center" justifyContent="center" sx={{ textAlign: 'left' }}>
          <Grid item xs={12} md={9} lg={8}>
            <Stack spacing={4} alignItems="left">
              <Typography variant="h1" sx={{ fontSize: { xs: 42, sm: 58, md: 76 }, lineHeight: 0.95, fontWeight: 900 }}>Onboard the repositories you already use.</Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 680, lineHeight: 1.75 }}>Repo Wizard is a modern development workspace tool built to seamlessly index structural metadata branches, audit automated PR compliance metrics, and review files instantaneously using specialized LLM intelligence patterns.</Typography>
              <Button variant="contained" size="large" onClick={() => setOpenModal(true)} endIcon={<ArrowForwardIcon />} sx={{ py: 2, px: 4, fontWeight: 700, boxShadow: '0 10px 25px rgba(79,70,229,0.3)' }}>Start onboarding</Button>
            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: { xs: 8, md: 14 } }}>
          {features.map((f) => (
            <Grid item xs={12} sm={6} md={4} lg={4} key={f.title} sx={{ minWidth: 0 , width: {sm: '100%', md: '100%', lg:'561px'}}}>
              <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid rgba(16,24,40,0.06)', borderRadius: '16px', bgcolor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', transition: '0.2s', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-4px)' } }}>
                <CardContent sx={{ p: 4, flex: 1 }}>
                  <Stack spacing={2.5}>
                    <Box sx={{ color: 'primary.main', width: 48, height: 48, borderRadius: 3, bgcolor: 'rgba(79,70,229,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{f.title}</Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.7, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{f.copy}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Modal open={openModal} onClose={() => setOpenModal(false)} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Paper elevation={0} sx={{ position: 'relative',  p: 4, border: '1px solid rgba(16,24,40,0.08)', borderRadius: '12px', bgcolor: '#ffffff', outline: 'none' }}>
          <IconButton onClick={() => setOpenModal(false)} sx={{ position: 'absolute', right: 12, top: 12 }}><CloseIcon /></IconButton>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box><Typography variant="h4" sx={{ fontWeight: 800 }}>Repository details</Typography><Typography color="text.secondary">Enter a GitHub URL below to parse target production trees.</Typography></Box>
            <TextField label="Repository URL" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value.trim())} error={repoUrlError} InputProps={{ startAdornment: <InputAdornment position="start"><GitHubIcon /></InputAdornment> }} fullWidth />
            <Select value={branchName} onChange={(e) => setBranchName(e.target.value)} disabled={branchStatus !== 'ready'} fullWidth>
              <MenuItem value="" disabled>{branchStatus === 'loading' ? 'Loading...' : 'Select a branch'}</MenuItem>
              {branches.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
            </Select>
            <Button type="submit" variant="contained" size="large" disabled={!canSubmit} sx={{ py: 1.75, fontWeight: 700 }}>Onboard repository</Button>
          </Stack>
        </Paper>
      </Modal>
    </Box>
  );
}