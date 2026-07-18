import { CssBaseline } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
// Import your application state memory provider
import { OnboardingProvider } from './context';

export const metadata = {
  title: 'Repo Wizard',
  description: 'Onboard existing repositories by URL and branch name.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {/* Wrap children in the provider so state persists across page navigations */}
            <OnboardingProvider>
              {children}
            </OnboardingProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}