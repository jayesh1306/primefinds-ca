// Netlify Function: saveProducts
// Commits products.json to your GitHub repository using a token stored in environment variables.
// Required env vars (set in Netlify site settings):
// - GITHUB_TOKEN  (a personal access token with repo access)
// - GITHUB_REPO   (owner/repo, e.g. "jayesh1306/primefinds-ca")

const fetch = global.fetch || require('node-fetch');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const path = 'products.json';

  if (!token || !repo) {
    return { statusCode: 500, body: 'Server misconfigured: missing GITHUB_TOKEN or GITHUB_REPO env vars' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }

  const content = JSON.stringify(payload, null, 2);
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    return { statusCode: 500, body: 'GITHUB_REPO must be in owner/repo format' };
  }

  const apiHeaders = {
    Authorization: `token ${token}`,
    'User-Agent': 'netlify-function',
    Accept: 'application/vnd.github.v3+json'
  };

  const getUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;

  try {
    // Try to get the existing file to obtain the sha (required when updating)
    const getRes = await fetch(getUrl, { headers: apiHeaders });
    let sha = undefined;
    if (getRes.ok) {
      const getData = await getRes.json();
      sha = getData.sha;
    }

    const putBody = {
      message: 'Update products.json from admin panel',
      content: Buffer.from(content).toString('base64'),
      committer: { name: 'PrimeFinds Admin', email: 'noreply@primefinds.ca' }
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(getUrl, {
      method: 'PUT',
      headers: { ...apiHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(putBody)
    });

    const putText = await putRes.text();
    if (!putRes.ok) {
      return { statusCode: putRes.status || 500, body: putText };
    }

    return { statusCode: 200, body: putText };
  } catch (err) {
    return { statusCode: 500, body: String(err) };
  }
};
