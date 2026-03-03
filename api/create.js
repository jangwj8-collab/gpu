import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO;

  const { password, ...booking } = req.body;

  if (!password) {
    return res.status(400).json({ error: "비밀번호 필요" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const title = `[GPU] ${booking.server} | ${booking.gpu} | ${booking.date} | ${booking.slot}`;

  const body = `
### GPU 예약

\`\`\`json
${JSON.stringify(
  { ...booking, passwordHash },
  null,
  2
)}
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
