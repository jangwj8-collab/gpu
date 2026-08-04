import { RETENTION_DAYS, cutoffDate, fetchOpenBookings, closeIssue } from './_lib.js';

// 한 번 실행에서 닫을 최대 건수. 함수 실행 시간 제한과 GitHub 2차 rate limit을 피하기 위한 상한.
const MAX_PER_RUN = 50;

export default async function handler(req, res) {
  const token  = process.env.GITHUB_TOKEN;
  const repo   = process.env.GITHUB_REPO;
  const secret = process.env.CRON_SECRET;

  // CRON_SECRET을 설정해두면 Vercel cron(및 그 헤더를 아는 호출)만 실행할 수 있다.
  if (secret) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: '권한 없음' });
    }
  }

  let bookings;
  try {
    bookings = await fetchOpenBookings(repo, token);
  } catch (err) {
    return res.status(500).json({ error: 'GitHub API 실패' });
  }

  const cutoff = cutoffDate(RETENTION_DAYS);
  const stale = bookings
    .filter(b => b.date && b.date < cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));

  const target = stale.slice(0, MAX_PER_RUN);
  const closed = [];

  for (const b of target) {
    if (await closeIssue(repo, token, b.issueNumber)) closed.push(b.issueNumber);
  }

  res.status(200).json({
    cutoff,
    retentionDays: RETENTION_DAYS,
    stale: stale.length,
    closed: closed.length,
    remaining: stale.length - closed.length,
  });
}
