import express from 'express';
import { OAuth2Client } from 'google-auth-library';
// This file will not be checked in. Can be retrieved from API Credentials page.
import secrets from './secrets.json';

const PORT = process.env.PORT || '8080';
const HOST =
  process.env.NODE_ENV === 'production'
    ? 'https://tokenserver-dot-beatrix-dev.uc.r.appspot.com'
    : `http://localhost:${PORT}`;
const SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];
const REDIRECT_PATH = 'oauth2callback';

const oAuth2Client = new OAuth2Client(
  secrets.web.client_id,
  secrets.web.client_secret,
  `${HOST}/${REDIRECT_PATH}`
);

function getHtmlBody(token?: string) {
  let messageBody = '{error: true}';
  let htmlBody = 'Error';
  if (token) {
    messageBody = `{credentials: '${token}'}`;
    htmlBody = 'Authorized';
  }
  return `
    <html>
    <head>
        <script type="text/javascript">
        if (window.opener) {
            window.opener.postMessage(${messageBody}, '*');
        }
        </script>
    </head>
    <body>
        ${htmlBody}
    </body>
    </html>
  `;
}

const app = express();
app.get('/authorize', (_, resp) => {
  const authorizeUrl = oAuth2Client.generateAuthUrl({ scope: SCOPES });
  resp.redirect(301, authorizeUrl);
});
app.get(`/${REDIRECT_PATH}`, async (req, resp) => {
  const code = req.query.code ? String(req.query.code) : undefined;
  const { tokens } = await oAuth2Client.getToken(code);
  resp.send(getHtmlBody(tokens.access_token));
});
// Error-handling middleware must be last.
app.use(
  (
    error: any,
    _req: express.Request,
    resp: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    console.error(error.stack);
    resp.send(getHtmlBody());
  }
);

app.listen(PORT, () => {
  console.log(`Token server listening on port ${HOST} (port ${PORT})`);
  console.log('Press Ctrl+C to quit.');
});
