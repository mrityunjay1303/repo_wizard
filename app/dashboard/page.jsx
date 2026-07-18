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
import { Suspense, useEffect, useMemo, useState } from 'react';

const fallbackRepo = 'https://github.com/acme/platform.git';
const fallbackBranch = 'main';

const files = [
  {
    name: 'README.md',
    language: 'markdown',
    code: `# Repo Wizard Onboarding\n\nThis repository has been connected to Repo Wizard.\n\n- Source branch: {{branch}}\n- Repository: {{repo}}\n- Status: ready for analysis`,
  },
  {
    name: 'src/app.js',
    language: 'javascript',
    code: `import { createServer } from 'node:http';\n\nconst branch = '{{branch}}';\nconst repository = '{{repo}}';\n\ncreateServer((request, response) => {\n  response.end(\`Analyzing \${repository} on \${branch}\`);\n}).listen(3000);`,
  },
  {
    name: 'package.json',
    language: 'json',
    code: `{\n  "name": "connected-repository",\n  "branch": "{{branch}}",\n  "repository": "{{repo}}",\n  "scripts": {\n    "analyze": "repo-wizard analyze"\n  }\n}`,
  },
];

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

function repoNameFromUrl(repoUrl) {
  const withoutGit = repoUrl.replace(/\.git$/i, '');
  const parts = withoutGit.split(/[/:]/).filter(Boolean);
  return parts.slice(-2).join('/');
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [storedOnboarding, setStoredOnboarding] = useState(null);
  const [selectedFile, setSelectedFile] = useState(files[0]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setStoredOnboarding(readStoredOnboarding());
  }, []);

  const repoUrl = searchParams.get('repo') || storedOnboarding?.repoUrl || fallbackRepo;
  const branchName = searchParams.get('branch') || storedOnboarding?.branchName || fallbackBranch;
  const repoName = repoNameFromUrl(repoUrl);
  const renderedCode = useMemo(
    () => selectedFile.code.replaceAll('{{repo}}', repoUrl).replaceAll('{{branch}}', branchName),
    [branchName, repoUrl, selectedFile],
  );

  async function copyCode() {
    await navigator.clipboard.writeText(renderedCode);
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
                      Connected to <strong>{branchName}</strong>. Review repository code, verify structure, and prepare the
                      next automation step from one dashboard.
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack direction={{ xs: 'column', sm: 'row', md: 'column' }} spacing={1.5}>
                    <Button component={NextLink} href="/" variant="outlined" startIcon={<HomeRoundedIcon />}>
                      Onboard another repo
                    </Button>
                    <Button variant="contained" startIcon={<RefreshIcon />}>
                      Refresh repository
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </Paper>

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
                <List disablePadding>
                  {files.map((file) => (
                    <ListItemButton
                      key={file.name}
                      selected={selectedFile.name === file.name}
                      onClick={() => setSelectedFile(file)}
                    >
                      <ListItemIcon>
                        <ArticleIcon />
                      </ListItemIcon>
                      <ListItemText primary={file.name} secondary={file.language} />
                    </ListItemButton>
                  ))}
                </List>
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
                      <Typography fontWeight={800}>{selectedFile.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                        Live preview from {branchName}
                      </Typography>
                    </Box>
                  </Stack>
                  <IconButton onClick={copyCode} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.18)' }}>
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
                  <code>{renderedCode}</code>
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
