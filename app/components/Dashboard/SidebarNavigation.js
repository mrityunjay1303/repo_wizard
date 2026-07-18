'use client';
import { Paper, Box, Typography, Divider, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { cloneElement } from 'react';

export default function SidebarNavigation({ activeSection, setActiveSection }) {
  const sections = [
    { id: 'files', label: 'Files & folders', desc: 'Browse repository code', icon: <FolderRoundedIcon /> },
    { id: 'pullRequests', label: 'Pull requests', desc: 'View PR details', icon: <CallMergeIcon /> },
    { id: 'aiInsights', label: 'AI Insights', desc: 'Architecture & Stack Summary', icon: <AutoAwesomeIcon /> },
    { id: 'prReview', label: 'AI PR Review', desc: 'Autonomous Quality Linter', icon: <RateReviewIcon /> },
  ];

  return (
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
        {sections.map((sec) => (
          <ListItemButton
            key={sec.id}
            sx={{ minWidth: { xs: 220, md: 'auto' } }}
            selected={activeSection === sec.id}
            onClick={() => setActiveSection(sec.id)}
          >
            <ListItemIcon>
              {cloneElement(sec.icon, { color: activeSection === sec.id ? 'primary' : 'inherit' })}
            </ListItemIcon>
            <ListItemText primary={sec.label} secondary={sec.desc} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}