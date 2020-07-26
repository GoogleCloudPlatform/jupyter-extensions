// [START gae_node_request_example]
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(cors());

/**
 * To use OAuth2 authentication, we need access to a a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.  To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 */
const keyPath = path.join(__dirname, 'oauth2.keys.secrets.json');
let keys = { redirect_uris: [''] };
if (fs.existsSync(keyPath)) {
  keys = require(keyPath).web;
}

/**
 * Create a new OAuth2 client with the configured keys.
 */
const oauth2Client = new google.auth.OAuth2(
  keys.client_id,
  keys.client_secret,
  keys.redirect_uris[0]
);

const scopes = ['https://www.googleapis.com/auth/compute'];

google.options({ auth: oauth2Client });

const errorFilePath = path.join(__dirname, 'error.html');
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.sendFile(errorFilePath);
});

app.get('/authorize', (req, res, next) => {
  const authorizeUrl = oauth2Client.generateAuthUrl({
    scope: scopes.join(' '),
  });
  res.redirect(301, authorizeUrl);
});

app.get('/oauth2callback', async (req, res, next) => {
  const { tokens } = await oauth2Client.getToken(req.query.code);
  const html = `
    <html>
    <head>
        <script type="text/javascript">
        if (window.opener) {
            window.opener.postMessage({credentials: '${tokens.access_token}'}, '*');
        }
        </script>
    </head>
    <body>
        Authorized
    </body>
    </html>
  `;
  res.send(html);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
// [END gae_node_request_example]

module.exports = app;
