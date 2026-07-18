'use client';

import { Paper, Stack, Breadcrumbs, Link, Grid, Typography, Chip, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import NextLink from 'next/link';

export default function DashboardHeader({ repoName, branchName, onRefresh }) {
  return (
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
              <Button variant="contained" startIcon={<RefreshIcon />} onClick={onRefresh}>
                Refresh repository
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
}