'use client';
import { Stack, Paper, Box, Typography, Button, CircularProgress, Alert, Grid, Divider, Chip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ConstructionIcon from '@mui/icons-material/Construction';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

export default function AIInsightsView({ status, error, data, onReAnalyze }) {
  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid rgba(16,24,40,0.08)' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Repository Intelligence</Typography>
            <Typography color="text.secondary">Automated architecture overview and technical breakdown via Groq LLM.</Typography>
          </Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onReAnalyze} disabled={status === 'loading'}>
            Re-Analyze
          </Button>
        </Stack>

        {status === 'loading' && (
          <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
            <CircularProgress size={40} />
            <Typography color="text.secondary" fontWeight={500}>Reading codebase blueprint...</Typography>
          </Stack>
        )}

        {status === 'error' && (
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={onReAnalyze}>Retry</Button>}>
            {error}
          </Alert>
        )}

        {status === 'ready' && data && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} sx={{width: '100%'}}>
              <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ConstructionIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>Core Stack & Tech</Typography>
                  </Stack>
                  <Divider />
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{data.technology}</Typography>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} sx={{width: '100%'}}>
              <Paper variant="outlined" sx={{ p: 3, height: '100%'}}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BusinessCenterIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>Business Summary</Typography>
                  </Stack>
                  <Divider />
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{data.businessSummary}</Typography>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} sx={{width: '100%'}}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccountTreeIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>Architecture Ecosystem</Typography>
                  </Stack>
                  <Divider />
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{data.architecture}</Typography>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} sx={{width: '100%'}}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ReceiptLongIcon color="primary" />
                    <Typography variant="h6" fontWeight={700}>Code Flow & Structural Pipeline</Typography>
                  </Stack>
                  <Divider />
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{data.codeFlow}</Typography>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} sx={{width: '100%'}}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary">Primary Dependencies Evaluated</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {data.dependencies?.length > 0 ? (
                      data.dependencies.map((dep, idx) => <Chip key={idx} label={dep} variant="outlined" size="small" color="secondary" />)
                    ) : (
                      <Typography variant="body2" color="text.secondary">No dependencies extracted.</Typography>
                    )}
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Stack>
  );
}