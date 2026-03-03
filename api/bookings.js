export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO;

  const ghRes = await fetch(
    `https://api.github.com/repos/${repo}/issues?labels=gpu-booking&state=open&per_page=100`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!ghRes.ok) {
    return res.status(500).json({ error: 'GitHub API 실패' });
  }

  const issues = await ghRes.json();

  const bookings = issues.map(issue => {
    const match = issue.body.match(/```json\n([\s\S]*?)\n```/);
    if (!match) return null;

    const parsed = JSON.parse(match[1]);
    parsed.issueNumber = issue.number;
    return parsed;
  }).filter(Boolean);

  res.status(200).json(bookings);
}
