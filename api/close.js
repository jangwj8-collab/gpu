import bcrypt from "bcryptjs";
import { parseBooking, closeIssue } from "./_lib.js";

export default async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO;
  const adminPassword = process.env.ADMIN_PASSWORD;

  const { issueNumber, password } = req.body;

  if (!issueNumber || !password) {
    return res.status(400).json({ error: "값 누락" });
  }

  // 1️⃣ Issue 가져오기
  const issueRes = await fetch(
    `https://api.github.com/repos/${repo}/issues/${issueNumber}`,
    {
      headers: { Authorization: `token ${token}` },
    }
  );

  if (!issueRes.ok) {
    return res.status(404).json({ error: "예약 없음" });
  }

  const issue = await issueRes.json();

  // 2️⃣ JSON 데이터 추출
  const bookingData = parseBooking(issue);

  if (!bookingData) {
    return res.status(500).json({ error: "예약 데이터 파싱 실패" });
  }

  // 3️⃣ 관리자 비밀번호 허용
  if (password === adminPassword) {
    await closeIssue(repo, token, issueNumber);
    return res.status(200).json({ success: true, admin: true });
  }

  // 4️⃣ 일반 사용자 비밀번호 비교
  const valid = await bcrypt.compare(
    password,
    bookingData.passwordHash
  );

  if (!valid) {
    return res.status(403).json({ error: "비밀번호 틀림" });
  }

  await closeIssue(repo, token, issueNumber);

  res.status(200).json({ success: true });
}
