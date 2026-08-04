import { RETENTION_DAYS, cutoffDate, fetchOpenBookings } from './_lib.js';

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO;

  let bookings;
  try {
    bookings = await fetchOpenBookings(repo, token);
  } catch (err) {
    return res.status(500).json({ error: 'GitHub API 실패' });
  }

  // 보관 기간(기본 100일)이 지난 예약은 응답에서 제외한다.
  // 실제 Issue close는 /api/cleanup(하루 1회 cron)이 담당한다.
  const cutoff = cutoffDate(RETENTION_DAYS);
  const fresh = bookings
    .filter(b => b.date && b.date >= cutoff)
    // 달력 렌더링에 비밀번호 해시는 필요 없다. 취소는 close.js가 Issue를 직접 읽어
    // 검증하므로, 응답에서 빼도 예약/취소 흐름에는 영향이 없다.
    .map(({ passwordHash, password, ...rest }) => rest);

  res.status(200).json(fresh);
}
