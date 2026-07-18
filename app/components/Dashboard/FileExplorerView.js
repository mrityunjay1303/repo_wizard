'use client';
import { Grid, Paper, Box, Stack, Typography, Divider, List, ListItemButton, ListItemIcon, ListItemText, CircularProgress, Alert, IconButton } from '@mui/material';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import ArticleIcon from '@mui/icons-material/Article';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function FileExplorerView({
  status,
  errorMessage,
  currentPath,
  entries,
  selectedFile,
  onFileSelect,
  onFolderOpen,
  onPathOpen,
  codeStatus,
  code,
  branchName,
  copied,
  onCopyCode
}) {
  return (
    <Stack spacing={3}>
      {status === 'error' && <Alert severity="error">{errorMessage}</Alert>}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={4} sx={{ minWidth: 0 }}>
          <Paper elevation={0} sx={{ border: '1px solid rgba(16,24,40,0.08)', overflow: 'auto' }}>
            <Box sx={{ p: 2.5 }}>
              <Stack spacing={1}>
                <Typography variant="overline" color="text.secondary">Current folder</Typography>
                <Typography variant="body2" color="text.secondary">/{currentPath || 'root'}</Typography>
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
                  <ListItemButton onClick={() => onPathOpen(currentPath.split('/').slice(0, -1).join('/'))}>
                    <ListItemIcon><FolderRoundedIcon color="primary" /></ListItemIcon>
                    <ListItemText primary=".." secondary="Parent folder" />
                  </ListItemButton>
                )}
                {entries.map((entry) => (
                  <ListItemButton
                    key={entry.sha || entry.path}
                    selected={entry.type === 'file' && selectedFile?.path === entry.path}
                    onClick={() => (entry.type === 'dir' ? onFolderOpen(entry.path) : onFileSelect(entry))}
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
          <Paper elevation={0} sx={{ border: '1px solid rgba(16,24,40,0.08)', overflowX: 'scroll', maxWidth: '810px' }}>
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
                  <Typography fontWeight={800}>{selectedFile?.name || (currentPath ? 'Select a file' : 'Select a file')}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
                    Live GitHub preview from {branchName}
                  </Typography>
                </Box>
              </Stack>
              <IconButton onClick={onCopyCode} disabled={!code || codeStatus === 'loading'} sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.18)' }}>
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
                fontFamily: '"SFMono-Regular", Consolas, monospace',
              }}
            >
              <code>{codeStatus === 'loading' ? 'Loading file from GitHub...' : code}</code>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}