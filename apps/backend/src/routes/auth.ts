import { Router } from 'express';
import { google } from 'googleapis';

const router = Router();

// Helper function to create OAuth2 client with current environment variables
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Generate Google OAuth URL
router.get('/google/url', (req, res) => {
  const oauth2Client = createOAuth2Client();

  // Debug: Log environment variables (remove in production)
  console.log('🔧 OAuth Debug:');
  console.log('CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? `Set (${process.env.GOOGLE_CLIENT_ID.length} chars)` : 'Missing');
  console.log('CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? `Set (${process.env.GOOGLE_CLIENT_SECRET.length} chars)` : 'Missing');
  console.log('REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
  console.log('Full CLIENT_ID value:', JSON.stringify(process.env.GOOGLE_CLIENT_ID));

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  });

  console.log('🔗 Generated OAuth URL:', url);
  res.json({ url });
});

// Handle Google OAuth callback (GET - when Google redirects back)
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('Authorization code is required');
    }

    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // For GET callback, redirect to frontend with tokens as URL parameters
    // Note: In production, use more secure methods like setting HTTP-only cookies
    const redirectUrl = `${process.env.FRONTEND_URL}/?auth=success&user=${encodeURIComponent(JSON.stringify({
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture
    }))}&tokens=${encodeURIComponent(JSON.stringify(tokens))}`;
    
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/?auth=error&message=${encodeURIComponent('Authentication failed')}`);
  }
});

// Handle Google OAuth callback (POST - for programmatic access)
router.post('/google/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    res.json({
      tokens,
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      }
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    res.json({ tokens: credentials });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

export { router as authRouter };