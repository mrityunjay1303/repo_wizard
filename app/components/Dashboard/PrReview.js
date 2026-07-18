'use client';

import { useState } from 'react';
import { Stack, Paper, Box, Typography, Button, CircularProgress, Alert, Grid, Chip, Divider, List } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export default function AIPRReviewView({ 
  status, 
  error, 
  data, 
  onReReview, 
  disabled,
  rawFiles = [],       // Workspace files containing the actual contents
  onApplyCodePatch   // Callback to save fixed code upstream
}) {
  // Track specific violation indexes currently executing fixes to isolate button loaders
  const [fixingKey, setFixingKey] = useState(null);
  const [fixError, setFixError] = useState('');

  async function handleTriggerAutoFix(filename, violation, uniqueIdentifier) {
    setFixingKey(uniqueIdentifier);
    setFixError('');

    try {
      // 1. Resolve target file from current application workspace context
      const targetFile = rawFiles.find(f => f.name === filename);
      if (!targetFile) {
        throw new Error(`Could not find live file context for "${filename}" in active workspace.`);
      }

      // 2. Dispatch payload details to code refactoring backend microservice pipeline
      const response = await fetch('/api/fix-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          fileContent: targetFile.content,
          violationMessage: violation.message,
          rule: violation.rule
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Failed to complete autonomous source code refactor patch.');
      }

      const dataResult = await response.json();

      // 3. Commit code string updates directly back into workspace memory state loops
      if (dataResult.fixedContent && onApplyCodePatch) {
        await onApplyCodePatch(filename, dataResult.fixedContent);
      }
    } catch (err) {
      setFixError(err.message);
    } finally {
      setFixingKey(null);
    }
  }

  return (
    <Stack spacing={3}>
      {fixError && (
        <Alert severity="error" onClose={() => setFixError('')}>
          {fixError}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: '1px solid rgba(16,24,40,0.08)' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <RateReviewIcon color="primary" />
              <Typography variant="h4" sx={{ fontWeight: 800 }}>Autonomous PR Review</Typography>
            </Stack>
            <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
              Evaluates codebase changes and matches them against compliance standards.
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onReReview} disabled={status === 'loading' || disabled}>
            Re-Review
          </Button>
        </Stack>

        {status === 'loading' && (
          <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
            <CircularProgress size={40} />
            <Typography color="text.secondary" fontWeight={500}>Executing compliance metrics checks...</Typography>
          </Stack>
        )}

        {status === 'error' && (
          <Alert severity="error" action={<Button color="inherit" size="small" onClick={onReReview}>Retry</Button>}>
            {error}
          </Alert>
        )}

        {status === 'ready' && data && (
          <Stack spacing={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, height: '100%', borderLeft: data.approved ? '4px solid #2e7d32' : '4px solid #d32f2f', bgcolor: data.approved ? '#fafdfa' : '#fdf8f8' }}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary" fontWeight={700}>PR Verification Result</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: data.approved ? '#2e7d32' : '#d32f2f' }}>
                      {data.approved ? 'PASSED / APPROVED' : 'CHANGES REQUESTED'}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, height: '100%', bgcolor: '#fafafa', borderLeft: '4px solid #101828' }}>
                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary" fontWeight={700}>Rule Infractions Found</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{data.totalViolationsFound} Deficiencies Flagged</Typography>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            <Stack spacing={3}>
              {data.fileReports?.length > 0 ? (
                data.fileReports.map((report, fileIdx) => (
                  <Paper key={fileIdx} variant="outlined" sx={{ overflow: 'hidden', borderRadius: '8px', bgcolor: '#fff' }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa' }}>
                      <Typography fontWeight={700} variant="body2" sx={{ fontFamily: 'monospace' }}>{report.filename}</Typography>
                      <Chip label={`${report.issuesCount} ${report.issuesCount === 1 ? 'Violation' : 'Violations'}`} size="small" color="error" sx={{ fontWeight: 700 }} />
                    </Box>
                    <Divider />
                    <List disablePadding>
                      {report.violations?.map((violation, issueIdx) => {
                        const uniqueId = `${fileIdx}-${issueIdx}`;
                        const isCurrentFixing = fixingKey === uniqueId;

                        return (
                          <Box key={issueIdx}>
                            <Stack 
                              direction={{ xs: 'column', md: 'row' }} 
                              spacing={2} 
                              sx={{ p: 2.5, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}
                            >
                              <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', flexGrow: 1, minWidth: 0 }}>
                                <Chip
                                  icon={violation.severity === 'error' ? <ErrorIcon fontSize="small" /> : <WarningIcon fontSize="small" />}
                                  label={violation.rule}
                                  size="small"
                                  color={violation.severity === 'error' ? 'error' : 'warning'}
                                  variant="outlined"
                                  sx={{ minWidth: 140, fontWeight: 700, flexShrink: 0 }}
                                />
                                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>{violation.message}</Typography>
                              </Stack>

                              {/* Interactive Instant Fix Application Control */}
                              <Button
                                variant="outlined"
                                color="secondary"
                                size="small"
                                startIcon={isCurrentFixing ? <CircularProgress size={14} color="inherit" /> : <AutoFixHighIcon />}
                                disabled={isCurrentFixing || status === 'loading'}
                                onClick={() => handleTriggerAutoFix(report.filename, violation, uniqueId)}
                                sx={{ flexShrink: 0, textTransform: 'none', ml: { xs: 0, md: 2 }, mt: { xs: 1.5, md: 0 } }}
                              >
                                {isCurrentFixing ? 'Fixing...' : 'Auto-Fix'}
                              </Button>
                            </Stack>
                            {issueIdx < report.violations.length - 1 && <Divider />}
                          </Box>
                        );
                      })}
                    </List>
                  </Paper>
                ))
              ) : (
                <Alert severity="success" sx={{ border: '1px solid #2e7d32', bgcolor: '#fafdfa' }}>
                  Excellent compliance profile. No structural deviations detected.
                </Alert>
              )}
            </Stack>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}