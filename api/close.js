export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO;

  const { issueNumber } = req.body;

  const ghRes = await fetch(
    `https://api.github.com/repos/${repo}/issues/${issueNumber}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state: 'closed' }),
    }
  );

  if (!ghRes.ok) {
    return res.status(500).json({ error: 'Issue 종료 실패' });
  }

  res.status(200).json({ success: true });
}
