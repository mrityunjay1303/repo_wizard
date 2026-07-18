'use client';
import { Paper, Box, Typography, Stack, CircularProgress, Alert, Select, MenuItem, Grid, Chip } from '@mui/material';

export default function PullRequestsView({ status, error, pullRequests, selectedPR, onPRChange }) {
  return (
    <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid rgba(16,24,40,0.08)' }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Pull request details</Typography>
          <Typography color="text.secondary">Select a pull request from GitHub to inspect structural metadata.</Typography>
        </Box>

        {status === 'loading' && (
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={24} />
            <Typography color="text.secondary">Loading pull requests...</Typography>
          </Stack>
        )}
        {status === 'error' && <Alert severity="error">{error}</Alert>}
        {status === 'ready' && pullRequests.length === 0 && <Alert severity="info">No pull requests found.</Alert>}

        {pullRequests.length > 0 && (
          <>
            <Select value={selectedPR?.number || ''} onChange={(e) => onPRChange(e.target.value)} fullWidth>
              {pullRequests.map((pr) => (
                <MenuItem key={pr.id} value={pr.number}>
                  #{pr.number} · {pr.title}
                </MenuItem>
              ))}
            </Select>

            {selectedPR && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, height: '100%', minWidth: 0, overflowX: 'auto' }}>
                    <Stack spacing={1.5}>
                      <Chip label={selectedPR.state} color={selectedPR.state === 'open' ? 'success' : 'default'} sx={{ alignSelf: 'flex-start' }} />
                      <Typography variant="h5" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
                        #{selectedPR.number} {selectedPR.title}
                      </Typography>
                      <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 420, overflow: 'auto' }}>
                        {selectedPR.body || 'No description provided.'}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}