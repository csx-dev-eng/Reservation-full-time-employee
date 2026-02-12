/**
 * Google Auth helper — supports service account or OAuth Desktop flow.
 *
 * Usage:
 *   const { getAuthClient } = require('./google-auth');
 *   const auth = await getAuthClient();
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets',
];

const TOKEN_PATH = path.join(__dirname, '.oauth-token.json');

async function getAuthClient() {
  const method = process.env.GOOGLE_AUTH_METHOD || 'service_account';

  if (method === 'service_account') {
    return getServiceAccountAuth();
  }
  return getOAuthAuth();
}

function getServiceAccountAuth() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
    || path.join(__dirname, 'service-account.json');

  const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: SCOPES,
  });
  return auth.getClient();
}

async function getOAuthAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // Try loading saved token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  }

  // Interactive flow
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n=== OAuth Setup ===');
  console.log('Open this URL in your browser:\n');
  console.log(authUrl);
  console.log();

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise((resolve) => {
    rl.question('Enter the authorization code: ', (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });

  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log('Token saved to', TOKEN_PATH);

  return oAuth2Client;
}

module.exports = { getAuthClient };
