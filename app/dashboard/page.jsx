'use client';

import ArticleIcon from '@mui/icons-material/Article';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
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
  MenuItem,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Select,
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

function encodeGitHubPath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function decodeBase64(content) {
  const binary = window.atob(content.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [storedOnboarding, setStoredOnboarding] = useState(null);
  const [entries, setEntries] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('loading');
  const [codeStatus, setCodeStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('files');
  const [pullRequests, setPullRequests] = useState([]);
  const [selectedPullRequest, setSelectedPullRequest] = useState(null);
  const [pullRequestStatus, setPullRequestStatus] = useState('idle');
  const [pullRequestError, setPullRequestError] = useState('');

  useEffect(() => {
    setStoredOnboarding(readStoredOnboarding());
  }, []);

  const repoUrl = searchParams.get('repo') || storedOnboarding?.repoUrl || fallbackRepo;
  const branchName = searchParams.get('branch') || storedOnboarding?.branchName || fallbackBranch;
  const githubRepo = useMemo(() => parseGitHubRepo(repoUrl), [repoUrl]);
  const repoName = githubRepo ? `${githubRepo.owner}/${githubRepo.repo}` : repoUrl;

  const loadRepositoryFiles = useCallback(async (path = currentPath) => {
    if (!githubRepo) {
      setStatus('error');
      setErrorMessage('This dashboard currently supports GitHub repository URLs.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(
        `https://api.github.com/repos/${githubRepo.owner}/${githubRepo.repo}/contents/${encodeGitHubPath(path)}?ref=${encodeURIComponent(branchName)}`,
        { headers: { Accept: 'application/vnd.github+json' } },
      );

      if (!response.ok) {
        throw new Error('Unable to fetch repository files from GitHub for the selected branch.');
      }

      const contents = await response.json();
      const normalizedContents = Array.isArray(contents) ? contents : [contents];
      const visibleEntries = normalizedContents
        .filter((item) => item.type === 'dir' || item.type === 'file')
        .sort((first, second) => {
          if (first.type !== second.type) {
            return first.type === 'dir' ? -1 : 1;
          }
          return first.name.localeCompare(second.name);
        });
      const firstFile = visibleEntries.find((item) => item.type === 'file') || null;
      setEntries(visibleEntries);
      setSelectedFile(firstFile);
      setStatus('ready');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  }, [branchName, currentPath, githubRepo]);

  useEffect(() => {
    loadRepositoryFiles(currentPath);
  }, [currentPath, loadRepositoryFiles]);

  function openFolder(folderPath) {
    setCurrentPath(folderPath);
    setSelectedFile(null);
    setCode('');
  }

  function openPath(path) {
    setCurrentPath(path);
    setSelectedFile(null);
    setCode('');
  }

  useEffect(() => {
    async function loadCode() {
      if (!selectedFile || !githubRepo) {
        setCode('');
        return;
      }

      setCodeStatus('loading');

      try {
        const response = await fetch(
          `https://api.github.com/repos/${githubRepo.owner}/${githubRepo.repo}/contents/${encodeGitHubPath(selectedFile.path)}?ref=${encodeURIComponent(branchName)}`,
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

  useEffect(() => {
    async function loadPullRequests() {
      if (!githubRepo || activeSection !== 'pullRequests') {
        return;
      }

      setPullRequestStatus('loading');
      setPullRequestError('');

      try {
        const response = await fetch(
          `https://api.github.com/repos/${githubRepo.owner}/${githubRepo.repo}/pulls?state=all&per_page=20`,
          { headers: { Accept: 'application/vnd.github+json' } },
        );

        if (!response.ok) {
          throw new Error('Unable to fetch pull requests from GitHub.');
        }

        const pullRequestData = await response.json();
        setPullRequests(pullRequestData);
        setSelectedPullRequest(pullRequestData[0] || null);
        setPullRequestStatus('ready');
      } catch (error) {
        setPullRequestStatus('error');
        setPullRequestError(error.message);
      }
    }

    loadPullRequests();
  }, [activeSection, githubRepo]);

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
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, md: 5 } }}>
        <Stack spacing={4}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid rgba(16,24,40,0.08)', overflow: 'auto' }}>
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
                    <Typography variant="h2" sx={{ fontSize: { xs: 32, sm: 42, md: 56 }, wordBreak: 'break-word' }}>
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
                    <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => loadRepositoryFiles(currentPath)}>
                      Refresh repository
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '280px minmax(0, 1fr)' },
              gap: 3,
              alignItems: 'start',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Paper
                elevation={0}
                sx={{
                  height: { xs: 'auto', md: 'calc(100vh - 48px)' },
                  position: { md: 'sticky' },
                  top: { md: 24 },
                  border: '1px solid rgba(16,24,40,0.08)',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="overline" color="text.secondary">
                    Dashboard sections
                  </Typography>
                </Box>
                <Divider />
                <List disablePadding sx={{ display: { xs: 'flex', md: 'block' }, overflowX: { xs: 'auto', md: 'visible' } }}>
                  <ListItemButton sx={{ minWidth: { xs: 220, md: 'auto' } }} selected={activeSection === 'files'} onClick={() => setActiveSection('files')}>
                    <ListItemIcon>
                      <FolderRoundedIcon color={activeSection === 'files' ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Files & folders" secondary="Browse repository code" />
                  </ListItemButton>
                  <ListItemButton sx={{ minWidth: { xs: 220, md: 'auto' } }} selected={activeSection === 'pullRequests'} onClick={() => setActiveSection('pullRequests')}>
                    <ListItemIcon>
                      <CallMergeIcon color={activeSection === 'pullRequests' ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText primary="Pull requests" secondary="View PR details" />
                  </ListItemButton>
                </List>
              </Paper>
            </Box>

            <Box sx={{ minWidth: 0, maxHeight: { md: 'calc(100vh - 220px)' }, overflow: 'auto', pr: { md: 0.5 } }}>
              {activeSection === 'files' ? (
                <Stack spacing={3}>
                  {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}
                  <Grid container spacing={3}>
                    <Grid item xs={12} lg={4} sx={{ minWidth: 0 }}>
                      <Paper elevation={0} sx={{ border: '1px solid rgba(16,24,40,0.08)', overflow: 'auto' }}>
                        <Box sx={{ p: 2.5 }}>
                          <Stack spacing={1}>
                            <Typography variant="overline" color="text.secondary">
                              Current folder
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              /{currentPath || 'root'}
                            </Typography>
                          </Stack>
                        </Box>
                        <Divider />
                        {status === 'loading' ? (
                          <Stack alignItems="center" spacing={2} sx={{ p: 4 }}>
                            <CircularProgress />
                            <Typography color="text.secondary">Fetching repository contents...</Typography>
                          </Stack>
                        ) : (
                          <List disablePadding>
                            {currentPath && (
                              <ListItemButton onClick={() => openPath(currentPath.split('/').slice(0, -1).join('/'))}>
                                <ListItemIcon>
                                  <FolderRoundedIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText primary=".." secondary="Parent folder" />
                              </ListItemButton>
                            )}
                            {entries.map((entry) => (
                              <ListItemButton
                                key={entry.sha || entry.path}
                                selected={entry.type === 'file' && selectedFile?.path === entry.path}
                                onClick={() => (entry.type === 'dir' ? openFolder(entry.path) : setSelectedFile(entry))}
                              >
                                <ListItemIcon>
                                  {entry.type === 'dir' ? <FolderRoundedIcon color="primary" /> : <ArticleIcon />}
                                </ListItemIcon>
                                <ListItemText primary={entry.name} secondary={entry.type === 'dir' ? 'Folder' : entry.path} />
                              </ListItemButton>
                            ))}
                          </List>
                        )}
                      </Paper>
                    </Grid>

                    <Grid item xs={12} lg={8} sx={{ minWidth: 0 }}>
                      <Paper elevation={0} sx={{ border: '1px solid rgba(16,24,40,0.08)', overflow: 'auto' }}>
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
                              <Typography fontWeight={800}>{selectedFile?.name || (currentPath ? 'Select a file in this folder' : 'Select a file')}</Typography>
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
                            minHeight: { xs: 300, md: 440 },
                            maxWidth: '100%',
                            overflow: 'auto',
                            bgcolor: '#0b1020',
                            color: '#d8e2ff',
                            fontSize: { xs: 12, sm: 14, md: 15 },
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
              ) : (
                <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid rgba(16,24,40,0.08)', overflow: 'auto' }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        Pull request details
                      </Typography>
                      <Typography color="text.secondary">
                        Select a pull request from GitHub. For now, Repo Wizard shows PR metadata only.
                      </Typography>
                    </Box>

                    {pullRequestStatus === 'loading' && (
                      <Stack direction="row" spacing={2} alignItems="center">
                        <CircularProgress size={24} />
                        <Typography color="text.secondary">Loading pull requests...</Typography>
                      </Stack>
                    )}
                    {pullRequestStatus === 'error' && <Alert severity="error">{pullRequestError}</Alert>}
                    {pullRequestStatus === 'ready' && pullRequests.length === 0 && <Alert severity="info">No pull requests found for this repository.</Alert>}

                    {pullRequests.length > 0 && (
                      <>
                        <Select
                          value={selectedPullRequest?.number || ''}
                          sx={{ maxWidth: '100%' }}
                          onChange={(event) => {
                            const nextPullRequest = pullRequests.find((pullRequest) => pullRequest.number === event.target.value);
                            setSelectedPullRequest(nextPullRequest || null);
                          }}
                          fullWidth
                        >
                          {pullRequests.map((pullRequest) => (
                            <MenuItem key={pullRequest.id} value={pullRequest.number}>
                              #{pullRequest.number} · {pullRequest.title}
                            </MenuItem>
                          ))}
                        </Select>

                        {selectedPullRequest && (
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={8}>
                              <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, height: '100%', minWidth: 0, overflow: 'auto' }}>
                                <Stack spacing={1.5}>
                                  <Chip label={selectedPullRequest.state} color={selectedPullRequest.state === 'open' ? 'success' : 'default'} sx={{ alignSelf: 'flex-start' }} />
                                  <Typography variant="h5" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
                                    #{selectedPullRequest.number} {selectedPullRequest.title}
                                  </Typography>
                                  <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: { xs: 260, md: 420 }, overflow: 'auto' }}>
                                    {selectedPullRequest.body || 'No pull request description provided.'}
                                  </Typography>
                                </Stack>
                              </Paper>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, height: '100%', minWidth: 0, overflow: 'auto' }}>
                                <Stack spacing={1.5}>
                                  <Typography fontWeight={800}>Details</Typography>
                                  <Typography color="text.secondary">Author: {selectedPullRequest.user?.login}</Typography>
                                  <Typography color="text.secondary">Base: {selectedPullRequest.base?.ref}</Typography>
                                  <Typography color="text.secondary">Head: {selectedPullRequest.head?.ref}</Typography>
                                  <Typography color="text.secondary">Created: {new Date(selectedPullRequest.created_at).toLocaleDateString()}</Typography>
                                  <Button href={selectedPullRequest.html_url} target="_blank" rel="noreferrer" variant="outlined">
                                    Open in GitHub
                                  </Button>
                                </Stack>
                              </Paper>
                            </Grid>
                          </Grid>
                        )}
                      </>
                    )}
                  </Stack>
                </Paper>
              )}
            </Box>
          </Box>
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
