## Tomado-BE (Backend) — 개발환경 템플릿 (TypeScript + Express)

이 레포는 **백엔드 팀 공통 개발환경(코드 구조/실행 명령/환경변수/문서화/코드 품질 규칙)** 을 빠르게 맞추기 위한 템플릿입니다.

- **Language**: TypeScript
- **Framework**: Express
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **API Docs**: Swagger
- **Code Quality**: ESLint, Prettier

- **API 명세(초안)**: [Notion 문서](https://www.notion.so/API-321296d38a608020a3f2e3730ac04fda?source=copy_link)

---

## 빠른 시작

### 요구사항

- Node.js 20+
- npm

### 0) 의존성 설치

```bash
npm install
```

### 1) 환경변수 준비

```bash
cp env/example.env env/local.env
```

필요 시 `env/local.env` 값을 수정하세요.

- **Supabase 사용 시**: `DATABASE_URL`에 Supabase Postgres 연결 문자열을 넣습니다.

---

## 서버 실행

```bash
npm run dev
```

- Health check: `GET /health`
- Swagger UI: `GET /docs`

---

## Prisma

```bash
npm run generate
```

## 폴더/파일 컨벤션

- `src/`: Express 서버 코드
  - `src/index.ts`: 서버 엔트리 포인트(실행 시작점)
  - `src/app.ts`: Express 앱 생성(미들웨어/라우터 등록)
  - `src/env.ts`: 환경변수 로딩/검증(zod)
  - `src/routes/`: 라우팅(엔드포인트) 정의
  - `src/controllers/`: 요청/응답 처리(컨트롤러)
  - `src/services/`: 비즈니스 로직
  - `src/repositories/`: DB 접근(Repository) 및 영속성 계층
- `prisma/`: Prisma 스키마
  - `prisma/schema.prisma`: DB 모델 정의(변경 시 `npx prisma generate` 권장)
- `docs/`: 문서
  - `docs/api/README.md`: API 명세 운영(초안/동기화 전략) 가이드
- `env/`: 환경변수 템플릿
  - `env/example.env`: 팀 공통 기본값 템플릿
  - `env/local.env`: 개인 로컬 설정(커밋 금지)

---

## 문서(Documentation) 운영 가이드

### Swagger(OpenAPI) 문서

- **접속**: `GET /docs`
- **역할**: REST API를 **자동 문서화**하고, 개발 중에 **요청/응답을 빠르게 확인**하는 용도입니다.
- **관리 위치**: 현재는 `src/docs/swagger.ts`에서 기본 스펙을 생성하고, 향후에는
  - 코드 주석 기반(JSDoc)으로 스펙을 확장하거나,
  - `docs/api/openapi.yaml`을 소스 오브 트루스로 두고 서버에서 서빙하는 방식으로 전환할 수 있습니다.

### API 명세(팀 합의 문서)

- 현재 초안은 Notion에서 관리합니다: [Notion 문서](https://www.notion.so/API-321296d38a608020a3f2e3730ac04fda?source=copy_link)
- 권장: Notion(논의/결정 기록) + OpenAPI 파일(코드/테스트/모킹용 “실행 가능한 스펙”)의 역할을 분리하고, 최종적으로는 OpenAPI 파일을 레포에 커밋해 **프론트/백이 같은 스펙을 바라보게** 합니다.

### 환경변수 문서

- `env/example.env`는 **팀 공통 템플릿**이고, `env/local.env`는 **개인 로컬 값**입니다.
- 필수 키:
  - `DATABASE_URL`: Supabase(Postgres) 또는 로컬 Postgres 연결 문자열
  - `PORT`: 서버 포트

### 코드 품질(ESLint/Prettier) & 커밋 훅

- `npm run lint`: 코드 규칙 검사(잠재 버그/안티패턴 방지)
- `npm run format`: 포맷 자동 정리(팀 스타일 통일)
- Husky + lint-staged:
  - 커밋 시 변경된 파일만 Prettier 포맷을 자동 적용합니다.

---

## 다음 단계(팀 합의 후 확장)

- 인증(JWT), 에러 핸들링, 로깅(pino) 표준 미들웨어 추가
- 테스트(Jest/Vitest) 및 CI 구성
- OpenAPI 파일(`docs/api/openapi.yaml`)을 기준으로 스펙/코드 동기화 규칙 확정
