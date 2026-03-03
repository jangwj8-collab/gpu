export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO;

  const booking = req.body;

  const title = `[GPU] ${booking.server} | ${booking.gpu} | ${booking.date} | ${booking.slot}`;

  const body = `
### GPU 예약

\`\`\`json
${JSON.stringify(booking, null, 2)}
\`\`\`
`;

  const ghRes = await fetch(
    `https://api.github.com/repos/${repo}/issues`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        labels: ['gpu-booking'],
      }),
    }
  );

  if (!ghRes.ok) {
    return res.status(500).json({ error: 'Issue 생성 실패' });
  }

  const issue = await ghRes.json();
  res.status(200).json({ issueNumber: issue.number });
}
