'use client';

import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ArticleIcon from '@mui/icons-material/Article';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import GitHubIcon from '@mui/icons-material/GitHub';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

const repoUrlPattern = /^(https?:\/\/|git@)([\w.-]+)([:/])([\w.-]+)\/([\w.-]+?)(\.git)?$/i;
const fallbackRepo = 'https://github.com/vercel/next.js.git';
const fallbackBranch = 'canary';

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

function readStoredOnboarding() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem('repoWizard:onboarding'));
  } catch {
    return null;
  }
}

function decodeBase64(content) {
  const binary = window.atob(content.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [storedOnboarding, setStoredOnboarding] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('loading');
  const [codeStatus, setCodeStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setStoredOnboarding(readStoredOnboarding());
  }, []);

  const repoUrl = searchParams.get('repo') || storedOnboarding?.repoUrl || fallbackRepo;
  const branchName = searchParams.get('branch') || storedOnboarding?.branchName || fallbackBranch;
  const githubRepo = useMemo(() => parseGitHubRepo(repoUrl), [repoUrl]);
  const repoName = githubRepo ? `${githubRepo.owner}/${githubRepo.repo}` : repoUrl;

  const loadRepositoryFiles = useCallback(async () => {
    if (!githubRepo) {
      setStatus('error');
      setErrorMessage('This dashboard currently supports GitHub repository URLs.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(
        `https://api.github.com/repos/${githubRepo.owner}/${githubRepo.repo}/contents?ref=${encodeURIComponent(branchName)}`,
        { headers: { Accept: 'application/vnd.github+json' } },
      );

      if (!response.ok) {
        throw new Error('Unable to fetch repository files from GitHub for the selected branch.');
      }

      const contents = await response.json();
      const fileContents = contents.filter((item) => item.type === 'file').slice(0, 12);
      setFiles(fileContents);
      setSelectedFile(fileContents[0] || null);
      setStatus('ready');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  }, [branchName, githubRepo]);

  useEffect(() => {
    loadRepositoryFiles();
  }, [loadRepositoryFiles]);

  useEffect(() => {
    async function loadCode() {
      if (!selectedFile || !githubRepo) {
        setCode('');
        return;
      }

      setCodeStatus('loading');

      try {
        const response = await fetch(
          `https://api.github.com/repos/${githubRepo.owner}/${githubRepo.repo}/contents/${selectedFile.path}?ref=${encodeURIComponent(branchName)}`,
          { headers: { Accept: 'application/vnd.github+json' } },
        );

        if (!response.ok) {
          throw new Error('Unable to fetch file contents from GitHub.');
        }

        const file = await response.json();
        setCode(decodeBase64(file.content));
        setCodeStatus('ready');
      } catch (error) {
        setCode(error.message);
        setCodeStatus('error');
      }
    }

    loadCode();
  }, [branchName, githubRepo, selectedFile]);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 8% 8%, rgba(79,70,229,0.20), transparent 30%), radial-gradient(circle at 92% 0%, rgba(6,182,212,0.18), transparent 28%), #f6f8fc',
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={4}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid rgba(16,24,40,0.08)' }}>
            <Stack spacing={3}>
              <Breadcrumbs>
                <Link component={NextLink} href="/" underline="hover" color="inherit">
                  Repo Wizard
                </Link>
                <Typography color="text.primary">Dashboard</Typography>
              </Breadcrumbs>

              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Stack spacing={2}>
                    <Chip icon={<CheckCircleIcon />} label="Repository onboarded" color="success" sx={{ alignSelf: 'flex-start' }} />
                    <Typography variant="h2" sx={{ fontSize: { xs: 36, md: 56 } }}>
                      {repoName}
                    </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 18 }}>
                      Connected to <strong>{branchName}</strong> with live repository data from GitHub. Review files,
                      inspect code, and prepare the next automation step from one dashboard.
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1.5}>
                    <Button component={NextLink} href="/" variant="outlined" startIcon={<HomeRoundedIcon />}>
                      Onboard another repo
                    </Button>
                    <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadRepositoryFiles}>
                      Refresh repository
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}

          <Grid container spacing={3}>
            <Grid item xs={12} md={4} lg={3}>
              <Paper elevation={0} sx={{ border: '1px solid rgba(16,24,40,0.08)', overflow: 'hidden' }}>
                <Box sx={{ p: 2.5 }}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary">
                      Repository
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <GitHubIcon color="action" />
                      <Typography fontWeight={800}>{repoName}</Typography>
                    </Stack>
                    <Chip icon={<AccountTreeIcon />} label={branchName} variant="outlined" sx={{ alignSelf: 'flex-start' }} />
                  </Stack>
                </Box>
                <Divider />
                {status === 'loading' ? (
                  <Stack alignItems="center" spacing={2} sx={{ p: 4 }}>
                    <CircularProgress />
                    <Typography color="text.secondary">Fetching repository files...</Typography>
                  </Stack>
                ) : (
                  <List disablePadding>
                    {files.map((file) => (
                      <ListItemButton
                        key={file.sha}
                        selected={selectedFile?.path === file.path}
                        onClick={() => setSelectedFile(file)}
                      >
                        <ListItemIcon>
                          <ArticleIcon />
                        </ListItemIcon>
                        <ListItemText primary={file.name} secondary={file.path} />
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={8} lg={9}>
              <Paper elevation={0} sx={{ border: '1px solid rgba(16,24,40,0.08)', overflow: 'hidden' }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={2}
                  sx={{ p: 2.5, bgcolor: '#101828', color: 'white' }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CodeIcon color="secondary" />
                    <Box>
                      <Typography fontWeight={800}>{selectedFile?.name || 'Select a file'}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                        Live GitHub preview from {branchName}
                      </Typography>
                    </Box>
                  </Stack>
                  <IconButton
                    onClick={copyCode}
                    disabled={!code || codeStatus === 'loading'}
                    sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.18)' }}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Stack>
                {copied && <Alert severity="success">Code copied to clipboard.</Alert>}
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    p: { xs: 2.5, md: 4 },
                    minHeight: 440,
                    overflow: 'auto',
                    bgcolor: '#0b1020',
                    color: '#d8e2ff',
                    fontSize: 15,
                    lineHeight: 1.75,
                    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
                  }}
                >
                  <code>{codeStatus === 'loading' ? 'Loading file from GitHub...' : code}</code>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
