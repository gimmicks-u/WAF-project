# WAF (Web Application Firewall)

OWASP ModSecurity CRS와 Nginx를 기반으로 한 리버스 프록시형 WAF 서버입니다.

- ModSecurity v3
- OWASP Core Rule Set(CRS)
- Nginx
- Docker Compose 기반 로컬 실행

---

### 아키텍처

```
Client → Nginx (ModSecurity + OWASP CRS) → backend-server (Express)
```

### 폴더 구조

```
WAF/
  ├─ docker-compose.yml
  ├─ backend-server/
  │  ├─ Dockerfile
  │  ├─ package.json
  │  └─ src/main.ts           # 간단한 Express 서버 (/ , /health)
  └─ modsecurity-crs-nginx/
     ├─ nginx/rules/custom_rules.conf          # Nginx 보안 헤더 등 커스텀
     └─ modsecurity-crs/rules/custom_rules.conf # ModSecurity/CRS 커스텀 룰
```

---

### 빠른 시작

사전 요구사항: Docker, Docker Compose

```bash
docker compose up -d
```

컨테이너 상태 확인 및 로그

```bash
docker compose ps
docker compose logs -f waf-nginx
docker compose logs -f backend-server
```

중지/정리

```bash
docker compose down
```

---

### 접속 정보

- **WAF(Proxy)**: http://localhost:8080
- **백엔드(직접 접근)**: http://localhost:4001

헬스체크 예시

```bash
curl -i http://localhost:8080/health
curl -i http://localhost:4001/health
```

CRS 차단 테스트(예시 — 실제 차단 여부/응답 코드는 룰셋/모드에 따라 달라질 수 있음)

```bash
curl -i "http://localhost:8080/?id=1 OR 1=1"
```

---

### 구성 개요

- `docker-compose.yml`

  - `waf-nginx`: `owasp/modsecurity-crs:nginx` 이미지를 사용하며, `BACKEND` 환경변수로 백엔드 업스트림을 지정합니다. 현재 값은 `http://backend-server:4000` 입니다.
  - `backend-server`: Node 20 Alpine 기반의 간단한 Express 서버(프로덕션 빌드 후 `dist/main.js` 실행).
  - 포트: `8080:8080`(HTTP), `8443:8443`(HTTPS), `4001:4001`(백엔드 직접 접근), `4002:3000`(프론트엔드), `4000:4000`(테넌트 예제)
  - 볼륨: 아래 두 파일이 컨테이너에 마운트됩니다.
    - `modsecurity-crs-nginx/nginx/rules/custom_rules.conf` → `/etc/nginx/conf.d/custom_rules.conf`
    - `modsecurity-crs-nginx/modsecurity-crs/rules/custom_rules.conf` → `/etc/modsecurity.d/owasp-crs/rules/custom_rules.conf`

- `backend-server/src/main.ts`
  - 라우트: `/` → "Hello world!", `/health` → "OK"
  - 환경변수: `PORT`(기본 4001)

---

### 트러블슈팅

- 403(차단) 발생: 요청이 CRS/ModSecurity 룰에 의해 차단되었을 수 있습니다. `waf-nginx` 로그를 확인하세요.
  ```bash
  docker compose logs -f waf-nginx
  ```
- 502/504: 백엔드 연결 문제일 수 있습니다. `backend-server` 컨테이너 상태와 `BACKEND` 환경변수를 확인하세요.
- HTTPS 경고: 데모/기본 인증서일 수 있으므로 로컬 테스트 시 `curl -k`를 사용하거나, 실환경에서는 정식 인증서를 적용하세요.

---

### 참고

- OWASP CRS: `https://coreruleset.org/`
- ModSecurity: `https://github.com/SpiderLabs/ModSecurity`
- OWASP ModSecurity CRS Nginx 이미지: `https://hub.docker.com/r/owasp/modsecurity-crs`
