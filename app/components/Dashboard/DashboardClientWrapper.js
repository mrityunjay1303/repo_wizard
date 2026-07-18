'use client';

import { Box, Container, Stack, Alert, Button } from '@mui/material';
import NextLink from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOnboarding } from '../../context'; // Fix paths relative to component location

import DashboardHeader from './DashboardHeader';
import SidebarNavigation from './SidebarNavigation';
import FileExplorerView from './FileExplorerView';
import PullRequestsView from './PullRequestsView';
import AIInsightsView from './AIInsightsView';
import AIPRReviewView from './PrReview'; // Matches your project structure routing layout

const repoUrlPattern = /^(https?:\/\/|git@)([\w.-]+)([:/])([\w.-]+)\/([\w.-]+?)(\.git)?$/i;

function parseGitHubRepo(repoUrl) {
  const match = repoUrl.match(repoUrlPattern);
  if (!match || !match[2].toLowerCase().includes('github.com')) return null;
  return { owner: match[4], repo: match[5].replace(/\.git$/i, '') };
}

function encodeGitHubPath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function decodeBase64(content) {
  const binary = window.atob(content.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function DashboardClientWrapper() {
  const { onboardingData } = useOnboarding();

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

  const [aiData, setAiData] = useState(null);
  const [aiStatus, setAiStatus] = useState('idle');
  const [aiError, setAiError] = useState('');

  const [prReviewData, setPrReviewData] = useState(null);
  const [prReviewStatus, setPrReviewStatus] = useState('idle');
  const [prReviewError, setPrReviewError] = useState('');

  // 1. ADDED: Full in-memory text payload workspace tracker state
  const [workspaceFiles, setWorkspaceFiles] = useState([]);

  if (!onboardingData) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Alert severity="warning" action={<Button color="inherit" size="small" component={NextLink} href="/">Go to Onboarding</Button>}>
          No active repository context found in memory. Please complete the setup step.
        </Alert>
      </Container>
    );
  }

  const { repoUrl, branchName, pat } = onboardingData;
  const githubRepo = useMemo(() => parseGitHubRepo(repoUrl), [repoUrl]);
  const repoName = githubRepo ? `${githubRepo.owner}/${githubRepo.repo}` : repoUrl;

  const githubHeaders = useMemo(() => {
    const headers = { Accept: 'application/vnd.github+json' };
    if (pat) headers.Authorization = `token ${pat}`;
    return headers;
  }, [pat]);

  // 2. MODIFIED: Fetches structural file lists AND pre-loads raw string values into workspace state maps
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
        { headers: githubHeaders }
      );
      if (!response.ok) throw new Error('Unable to fetch repository files.');
      const contents = await response.json();
      const normalized = Array.isArray(contents) ? contents : [contents];
      const visibleEntries = normalized
        .filter((item) => item.type === 'dir' || item.type === 'file')
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      
      setEntries(visibleEntries);
      const defaultFile = visibleEntries.find((item) => item.type === 'file') || null;
      setSelectedFile(defaultFile);

      // Pre-fetch raw textual content layers to keep AI auto-fixing engines fully loaded
      const filePayloads = await Promise.all(
        visibleEntries.filter((e) => e.type === 'file').map(async (file) => {
          const res = await fetch(`https://api.github.com/repos/${githubRepo.owner}/${githubRepo.repo}/contents/${encodeGitHubPath(file.path)}?ref=${encodeURIComponent(branchName)}`, { headers: githubHeaders });
          if (!res.ok) return { name: file.name, content: '' };
          const data = await res.json();
          return { name: file.name, content: decodeBase64(data.content || '') };
        })
      );
      setWorkspaceFiles(filePayloads.filter(f => f.content.length > 0));

      setStatus('ready');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  }, [branchName, currentPath, githubRepo, githubHeaders]);

  useEffect(() => {
    loadRepositoryFiles(currentPath);
  }, [currentPath, loadRepositoryFiles]);

  // 3. MODIFIED: Synchronize the code terminal display straight from active local workspace updates
  useEffect(() => {
    if (selectedFile) {
      const activeTextContext = workspaceFiles.find(f => f.name === selectedFile.name);
      if (activeTextContext) {
        setCode(activeTextContext.content);
        setCodeStatus('ready');
      }
    } else {
      setCode('');
    }
  }, [selectedFile, workspaceFiles]);

  useEffect(() => {
    async function loadPullRequests() {
      if (!githubRepo || activeSection !== 'pullRequests') return;
      setPullRequestStatus('loading');
      setPullRequestError('');
      try {
        const response = await fetch(`https://api.github.com/repos/${githubRepo.owner}/${githubRepo.repo}/pulls?state=all&per_page=20`, { headers: githubHeaders });
        if (!response.ok) throw new Error('Unable to fetch pull requests.');
        const prData = await response.json();
        setPullRequests(prData);
        setSelectedPullRequest(prData[0] || null);
        setPullRequestStatus('ready');
      } catch (error) {
        setPullRequestStatus('error');
        setPullRequestError(error.message);
      }
    }
    loadPullRequests();
  }, [activeSection, githubRepo, githubHeaders]);

  const runRepositoryAnalysis = useCallback(async () => {
    if (!githubRepo) return;
    setAiStatus('loading');
    setAiError('');
    try {
      const response = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: githubRepo.owner, repo: githubRepo.repo, branch: branchName, pat })
      });
      if (!response.ok) throw new Error('Failed to complete LLM analysis.');
      const data = await response.json();
      setAiData(data.analysis);
      setAiStatus('ready');
    } catch (error) {
      setAiStatus('error');
      setAiError(error.message);
    }
  }, [githubRepo, branchName, pat]);

  useEffect(() => {
    if (activeSection === 'aiInsights' && aiStatus === 'idle') runRepositoryAnalysis();
  }, [activeSection, aiStatus, runRepositoryAnalysis]);

  const runAutonomousPRReview = useCallback(async () => {
    if (!githubRepo || workspaceFiles.length === 0) return;
    setPrReviewStatus('loading');
    setPrReviewError('');
    try {
      const response = await fetch('/api/analyze-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          owner: githubRepo.owner, 
          repo: githubRepo.repo, 
          branch: branchName, 
          pat, 
          files: workspaceFiles 
        })
      });
      if (!response.ok) throw new Error('Failed to run autonomous PR review.');
      const data = await response.json();
      setPrReviewData(data.summary);
      setPrReviewStatus('ready');
    } catch (error) {
      setPrReviewStatus('error');
      setPrReviewError(error.message);
    }
  }, [githubRepo, workspaceFiles, branchName, pat]);

  useEffect(() => {
    if (activeSection === 'prReview' && prReviewStatus === 'idle') runAutonomousPRReview();
  }, [activeSection, prReviewStatus, runAutonomousPRReview]);

  // 4. ADDED: Applies the AI patches into application state memory and schedules a background lint re-validation pass
  const handleApplyCodePatch = useCallback((filename, updatedContent) => {
    setWorkspaceFiles(prevFiles => 
      prevFiles.map(file => 
        file.name === filename ? { ...file, content: updatedContent } : file
      )
    );
    
    // Invalidate the review log metrics right away to sync tracking checkboxes automatically
    setPrReviewStatus('idle');
  }, []);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at 8% 8%, rgba(79,70,229,0.20), transparent 30%), #f6f8fc' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, md: 5 } }}>
        <Stack spacing={4}>
          <DashboardHeader repoName={repoName} branchName={branchName} onRefresh={() => loadRepositoryFiles(currentPath)} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '280px minmax(0, 1fr)' }, gap: 3, alignItems: 'start' }}>
            <SidebarNavigation activeSection={activeSection} setActiveSection={setActiveSection} />

            <Box sx={{ minWidth: 0, maxHeight: 'calc(100vh - 48px)' }}>
              {activeSection === 'files' && (
                <FileExplorerView
                  status={status} errorMessage={errorMessage} currentPath={currentPath} entries={entries}
                  selectedFile={selectedFile} onFileSelect={setSelectedFile} onFolderOpen={setCurrentPath}
                  onPathOpen={setCurrentPath} codeStatus={codeStatus} code={code} branchName={branchName}
                  copied={copied} onCopyCode={handleCopyCode}
                />
              )}
              {activeSection === 'pullRequests' && (
                <PullRequestsView
                  status={pullRequestStatus} error={pullRequestError} pullRequests={pullRequests}
                  selectedPR={selectedPullRequest} onPRChange={(num) => setSelectedPullRequest(pullRequests.find((p) => p.number === num))}
                  rawFiles={workspaceFiles} onApplyCodePatch={handleApplyCodePatch}
                />
              )}
              {activeSection === 'aiInsights' && (
                <AIInsightsView status={aiStatus} error={aiError} data={aiData} onReAnalyze={runRepositoryAnalysis} />
              )}
              {activeSection === 'prReview' && (
                <AIPRReviewView 
                  status={prReviewStatus} error={prReviewError} data={prReviewData} 
                  onReReview={runAutonomousPRReview} disabled={workspaceFiles.length === 0}
                  rawFiles={workspaceFiles} onApplyCodePatch={handleApplyCodePatch}
                />
              )}
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}