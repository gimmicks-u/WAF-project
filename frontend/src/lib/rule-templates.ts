export const ruleTemplates = [
  {
    name: 'IP 차단',
    description: '특정 IP 주소를 차단합니다.',
    content:
      'SecRule REMOTE_ADDR "@ipMatch 203.0.113.10,198.51.100.22" "phase:1,deny,status:403,msg:\'차단된 IP\'"',
  },
  {
    name: 'User-Agent 차단',
    description: '봇/스크래퍼 등 특정 User-Agent를 차단합니다.',
    content:
      'SecRule REQUEST_HEADERS:User-Agent "@contains BadBot" "phase:1,deny,status:403,msg:\'차단된 User-Agent\'"',
  },
  {
    name: '확장자 업로드 제한',
    description: '위험한 확장자의 파일 업로드를 차단합니다.',
    content:
      'SecRule FILES_NAMES "@rx \\.(php|jsp|asp|exe|sh|bat)$" "phase:2,deny,status:403,msg:\'위험한 파일 업로드 차단\'"',
  },
  {
    name: '관리 경로 보호',
    description: '민감한 관리 경로 접근을 차단합니다.',
    content:
      'SecRule REQUEST_URI "@beginsWith /admin" "phase:1,deny,status:403,msg:\'관리 경로 접근 차단\'"',
  },
  {
    name: '요청 바디 크기 제한',
    description: '과도한 요청 바디를 제한합니다.',
    content:
      'SecRule REQUEST_HEADERS:Content-Length "@gt 1048576" "phase:1,deny,status:413,msg:\'요청 바디 과대\'"',
  },
  {
    name: '간단 요청 빈도 제한',
    description: '동일 IP에서 짧은 시간 내 과도한 요청을 제한합니다.',
    content:
      'SecRule IP:bf_counter "@gt 100" "phase:1,deny,expirevar:IP.bf_counter=60,msg:\'요청 빈도 제한\'"',
  },
  {
    name: 'SQLi 패턴 보강',
    description: 'OWASP CRS 외 간단 보강 예시입니다.',
    content:
      'SecRule ARGS "@rx (\bUNION\b|\bSELECT\b|\bSLEEP\s*\()" "phase:2,deny,status:403,msg:\'SQLi 의심 패턴\'"',
  },
];

export const crsHelp = {
  title: 'ModSecurity CRS 규칙 작성 가이드',
  sections: [
    {
      title: '기본 구조',
      content: 'SecRule [변수] "[연산자] [값]" "[액션]"\n예) SecRule REQUEST_URI "@contains admin" "phase:1,deny,status:403,msg:\'관리 페이지 접근 차단\'"',
    },
    {
      title: '주요 변수',
      content: 'REQUEST_URI, ARGS, REQUEST_HEADERS:User-Agent, FILES_NAMES, REMOTE_ADDR 등',
    },
    {
      title: '자주 쓰는 연산자',
      content: '@rx (정규식), @contains, @pm (phrase match), @ipMatch, @beginsWith 등',
    },
    {
      title: '주요 액션',
      content: 'phase:1|2 (요청/바디 처리 단계), deny (차단), status:403, msg:\'설명\', log/auditlog 등',
    },
    {
      title: 'Rule ID',
      content: '각 규칙에는 고유 id가 필요합니다. 시스템이 사용자별 권장 범위 내에서 자동으로 부여/검증합니다.',
    },
  ],
};
