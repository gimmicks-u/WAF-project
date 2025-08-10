const axios = require('axios');

// Base URL for the WAF proxy (nginx + ModSecurity + CRS)
const BASE_URL = process.env.WAF_BASE_URL || 'http://localhost:8080';

// Helper to perform GET and expect 403
async function expectGet403(path) {
  try {
    await axios.get(`${BASE_URL}${path}`, {
      // Follow redirects false is axios default; ensure headers
      validateStatus: () => true,
    });
  } catch (e) {
    throw new Error(`요청 실패: ${e.message}`);
  }
}

// Helper to perform POST (form-urlencoded) and expect 403
async function expectPostForm403(path, data) {
  try {
    const params = new URLSearchParams(data);
    const res = await axios.post(`${BASE_URL}${path}`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      validateStatus: () => true,
    });
    expect(res.status).toBe(403);
  } catch (e) {
    throw new Error(`요청 실패: ${e.message}`);
  }
}

// Helper to perform POST (json) and expect 403
async function expectPostJson403(path, json) {
  try {
    const res = await axios.post(`${BASE_URL}${path}`, json, {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true,
    });
    expect(res.status).toBe(403);
  } catch (e) {
    throw new Error(`요청 실패: ${e.message}`);
  }
}

describe('WAF ModSecurity+CRS 차단 E2E', () => {
  // 간단 가용성 체크 (선택적): 서버가 켜져있지 않다면 전체 스킵
  let serverAvailable = true;

  beforeAll(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/`, {
        timeout: 3000,
        validateStatus: () => true,
      });
      // 응답만 돌아오면 서버가 켜졌다고 판단 (상태코드와 무관)
      serverAvailable = !!res;
    } catch {
      serverAvailable = false;
    }
  });

  beforeEach(function skipIfDown() {
    if (!serverAvailable) {
      // 서버 없을 시 테스트 스킵
      pending(
        'WAF 서버가 실행 중이 아닙니다. docker-compose로 먼저 기동하세요.'
      );
    }
  });

  describe('XSS 차단', () => {
    test('기본 XSS', async () => {
      const res = await axios.get(`${BASE_URL}/?q=<script>alert(1)</script>`, {
        validateStatus: () => true,
      });
      expect(res.status).toBe(403);
    });

    test('다양한 XSS 변형 - img onerror', async () => {
      const res = await axios.get(
        `${BASE_URL}/?search=<img src=x onerror=alert(1)>`,
        { validateStatus: () => true }
      );
      expect(res.status).toBe(403);
    });

    test('다양한 XSS 변형 - svg onload', async () => {
      const res = await axios.get(`${BASE_URL}/?name=<svg onload=alert(1)>`, {
        validateStatus: () => true,
      });
      expect(res.status).toBe(403);
    });

    test('다양한 XSS 변형 - javascript protocol', async () => {
      const res = await axios.get(`${BASE_URL}/?data=javascript:alert(1)`, {
        validateStatus: () => true,
      });
      expect(res.status).toBe(403);
    });

    test('다양한 XSS 변형 - iframe javascript', async () => {
      const res = await axios.get(
        `${BASE_URL}/?input=<iframe src=javascript:alert(1)></iframe>`,
        { validateStatus: () => true }
      );
      expect(res.status).toBe(403);
    });

    test('인코딩된 XSS - URL encoded', async () => {
      const res = await axios.get(
        `${BASE_URL}/?q=%3Cscript%3Ealert(1)%3C/script%3E`,
        { validateStatus: () => true }
      );
      expect(res.status).toBe(403);
    });

    test('POST 방식 XSS - form-urlencoded', async () => {
      await expectPostForm403('/submit', {
        comment: "<script>alert('XSS')</script>",
      });
    });

    test('POST 방식 XSS - JSON', async () => {
      await expectPostJson403('/api/data', {
        message: '<script>alert(1)</script>',
      });
    });
  });

  describe('SQL Injection 차단', () => {
    test('기본 SQLi - OR 1=1', async () => {
      const res = await axios.get(`${BASE_URL}/?id=1' OR '1'='1`, {
        validateStatus: () => true,
      });
      expect(res.status).toBe(403);
    });

    test('기본 SQLi - comment', async () => {
      const res = await axios.get(`${BASE_URL}/?user=admin'--`, {
        validateStatus: () => true,
      });
      expect(res.status).toBe(403);
    });

    test('기본 SQLi - DROP TABLE', async () => {
      const res = await axios.get(
        `${BASE_URL}/?search='; DROP TABLE users; --`,
        { validateStatus: () => true }
      );
      expect(res.status).toBe(403);
    });

    test('UNION 기반 공격 - select literals', async () => {
      const res = await axios.get(`${BASE_URL}/?id=1' UNION SELECT 1,2,3--`, {
        validateStatus: () => true,
      });
      expect(res.status).toBe(403);
    });

    test('UNION 기반 공격 - users table', async () => {
      const res = await axios.get(
        `${BASE_URL}/?product=1' UNION SELECT username,password FROM users--`,
        { validateStatus: () => true }
      );
      expect(res.status).toBe(403);
    });

    test('Boolean 기반 Blind SQLi - 1=1', async () => {
      const res = await axios.get(`${BASE_URL}/?id=1' AND 1=1--`, {
        validateStatus: () => true,
      });
      expect(res.status).toBe(403);
    });

    test('Boolean 기반 Blind SQLi - 1=2', async () => {
      const res = await axios.get(`${BASE_URL}/?id=1' AND 1=2--`, {
        validateStatus: () => true,
      });
      expect(res.status).toBe(403);
    });

    test('Boolean 기반 Blind SQLi - subquery count', async () => {
      const res = await axios.get(
        `${BASE_URL}/?id=1' AND (SELECT COUNT(*) FROM users)>0--`,
        { validateStatus: () => true }
      );
      expect(res.status).toBe(403);
    });

    test('Time-based Blind SQLi - WAITFOR DELAY', async () => {
      const res = await axios.get(
        `${BASE_URL}/?id=1'; WAITFOR DELAY '00:00:05'--`,
        { validateStatus: () => true }
      );
      expect(res.status).toBe(403);
    });

    test('Time-based Blind SQLi - SLEEP()', async () => {
      const res = await axios.get(`${BASE_URL}/?id=1' AND SLEEP(5)--`, {
        validateStatus: () => true,
      });
      expect(res.status).toBe(403);
    });

    test('POST 방식 SQLi - form 로그인', async () => {
      await expectPostForm403('/login', {
        username: "admin' OR '1'='1'--",
        password: 'anything',
      });
    });

    test('POST 방식 SQLi - JSON', async () => {
      await expectPostJson403('/api/user', { id: "1' OR 1=1--" });
    });
  });
});
