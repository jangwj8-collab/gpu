// GitHub Issues를 예약 저장소로 쓰는 공통 로직.

export const LABEL = 'gpu-booking';
export const RETENTION_DAYS = 100;

// 오늘로부터 days일 전 날짜를 YYYY-MM-DD로. 예약 date와 문자열 비교가 가능하다.
export function cutoffDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function ghHeaders(token) {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
  };
}

// 본문 코드블록에 담긴 예약 JSON을 꺼낸다. 형식이 깨진 Issue는 null.
export function parseBooking(issue) {
  const match = (issue.body || '').match(/```json\n([\s\S]*?)\n```/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    parsed.issueNumber = issue.number;
    return parsed;
  } catch {
    return null;
  }
}

// 열린 예약 Issue를 전부 가져온다.
// per_page=100 한 장만 읽으면 예약이 100건을 넘는 순간 조용히 잘려나가므로 끝까지 넘긴다.
export async function fetchOpenBookings(repo, token) {
  const all = [];

  for (let page = 1; page <= 50; page++) {
    const url = `https://api.github.com/repos/${repo}/issues`
      + `?labels=${LABEL}&state=open&per_page=100&page=${page}`;
    const ghRes = await fetch(url, { headers: ghHeaders(token) });

    if (!ghRes.ok) throw new Error(`GitHub API ${ghRes.status}`);

    const issues = await ghRes.json();
    // PR은 issues 목록에 섞여 들어오므로 제외한다.
    all.push(...issues.filter(i => !i.pull_request));

    if (issues.length < 100) break;
  }

  return all.map(parseBooking).filter(Boolean);
}

export async function closeIssue(repo, token, issueNumber) {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/issues/${issueNumber}`,
    {
      method: 'PATCH',
      headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'closed', state_reason: 'completed' }),
    }
  );
  return res.ok;
}
