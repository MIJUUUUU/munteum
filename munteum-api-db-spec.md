# 문틈(Munteum) MVP API / DB 명세

## 1. 문서 목적

이 문서는 `문틈` MVP의 백엔드 구현을 위한 API와 DB 구조를 정의한다.

포함 범위:

- 도메인 모델
- 테이블 스키마
- 제약 조건
- 주요 API 엔드포인트
- 요청/응답 예시
- 화면과 API 매핑

제외 범위:

- 인프라 구성
- 외부 책 검색 API의 실제 공급자 선택
- 비동기 이벤트 아키텍처

---

## 2. MVP 백엔드 범위

MVP에서 필요한 서버 기능:

1. 이메일 회원가입 / 로그인
2. 사용자별 책장 관리
3. 외부 책 검색 결과 기반 책 등록
4. 독서 상태 관리
5. 독서 기록 CRUD
6. 완독 처리
7. 홈 요약 조회
8. 캘린더 조회
9. 간단한 마이페이지 통계 조회

MVP에서 제외:

- 소셜 로그인
- OCR
- 추천 시스템
- 공개 피드
- 좋아요 / 댓글 / 팔로우
- 알림
- 파일 업로드

---

## 3. 기술 가정

- API 스타일: REST JSON
- 인증 방식: Bearer Token
- 응답 인코딩: UTF-8 JSON
- 시간 저장 기준: UTC
- 사용자 표시용 날짜 포맷팅: 클라이언트 처리

권장 HTTP 헤더:

- `Authorization: Bearer {accessToken}`
- `Content-Type: application/json`

---

## 4. 도메인 모델

## 핵심 엔티티

- `User`
- `Book`
- `UserBook`
- `Note`

## 관계

- 한 명의 `User`는 여러 권의 `UserBook`을 가진다.
- 한 권의 `Book`은 여러 명의 사용자 책장에 들어갈 수 있다.
- 하나의 `UserBook`에는 여러 개의 `Note`가 달릴 수 있다.

---

## 5. 상태값 정의

## 독서 상태

- `WANT_TO_READ`
- `READING`
- `FINISHED`

## 사용자 노출 라벨

- `WANT_TO_READ` → `읽고 싶어요`
- `READING` → `읽고 있어요`
- `FINISHED` → `다 읽었어요`

---

## 6. DB 스키마

아래 예시는 PostgreSQL 기준이다.

## 6.1 users

| column | type | null | key | note |
|---|---|---:|---|---|
| id | bigserial | N | PK | 사용자 ID |
| email | varchar(255) | N | UK | 소문자 정규화 저장 권장 |
| password_hash | varchar(255) | N |  | bcrypt/argon2 해시 |
| nickname | varchar(20) | N |  | 표시 이름 |
| created_at | timestamptz | N |  | 생성 시각 |
| updated_at | timestamptz | N |  | 수정 시각 |
| deleted_at | timestamptz | Y |  | soft delete 여부 선택 가능 |

### 제약

- unique: `email`
- check: `char_length(nickname) between 1 and 20`

---

## 6.2 books

| column | type | null | key | note |
|---|---|---:|---|---|
| id | bigserial | N | PK | 책 ID |
| isbn | varchar(20) | Y | IDX | ISBN-10/13 |
| title | varchar(255) | N |  | 제목 |
| author | varchar(255) | N |  | 저자 |
| publisher | varchar(255) | Y |  | 출판사 |
| cover_url | text | Y |  | 표지 이미지 URL |
| created_at | timestamptz | N |  | 생성 시각 |
| updated_at | timestamptz | N |  | 수정 시각 |

### 제약

- index: `isbn`
- unique는 `isbn` 단독보다 nullable 처리와 공급자 품질을 고려해 운영 판단

### 저장 원칙

- 검색 결과 자체는 저장하지 않는다.
- 사용자가 책장에 등록하는 시점에만 `books` 레코드를 생성하거나 재사용한다.

---

## 6.3 user_books

| column | type | null | key | note |
|---|---|---:|---|---|
| id | bigserial | N | PK | 사용자 책장 항목 ID |
| user_id | bigint | N | FK | users.id |
| book_id | bigint | N | FK | books.id |
| status | varchar(20) | N | IDX | 독서 상태 |
| started_at | date | Y |  | 읽기 시작일 |
| finished_at | date | Y |  | 완독일 |
| rating | smallint | Y |  | 1~5 |
| review | varchar(300) | Y |  | 한줄평 |
| created_at | timestamptz | N |  | 생성 시각 |
| updated_at | timestamptz | N |  | 수정 시각 |

### 제약

- unique: `(user_id, book_id)`
- check: `status in ('WANT_TO_READ', 'READING', 'FINISHED')`
- check: `rating between 1 and 5 or rating is null`
- check: `char_length(review) <= 300`

### 상태 규칙

- `WANT_TO_READ`: `started_at`, `finished_at`, `rating`, `review` 모두 null 가능
- `READING`: `started_at` 권장, `finished_at`는 null
- `FINISHED`: `finished_at` 권장, `rating`, `review`는 optional

---

## 6.4 notes

| column | type | null | key | note |
|---|---|---:|---|---|
| id | bigserial | N | PK | 기록 ID |
| user_book_id | bigint | N | FK | user_books.id |
| page | integer | Y |  | 페이지 |
| quote | text | Y |  | 마음에 머문 문장 |
| thought | text | Y |  | 나의 생각 |
| created_at | timestamptz | N | IDX | 생성 시각 |
| updated_at | timestamptz | N |  | 수정 시각 |

### 제약

- check: `page > 0 or page is null`
- check: `quote is not null or thought is not null`

### 비고

- 빈 문자열 대신 null 정규화 권장
- `quote`와 `thought`는 둘 다 optional이지만 둘 다 null은 불가

---

## 7. 인덱스 권장안

- `users(email)`
- `books(isbn)`
- `user_books(user_id, status)`
- `user_books(user_id, updated_at desc)`
- `notes(user_book_id, created_at desc)`
- `notes(created_at)`

캘린더 조회 최적화를 위해 고려:

- `notes(created_at desc)`
- 또는 `notes(user_book_id, created_at desc)` + `user_books(user_id)` 조합

---

## 8. 공통 응답 규칙

## 성공 응답

```json
{
  "data": {},
  "meta": {}
}
```

## 에러 응답

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "페이지는 숫자만 입력해주세요."
  }
}
```

## 공통 에러 코드 예시

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `CONFLICT`
- `INTERNAL_ERROR`
- `EXTERNAL_API_ERROR`

---

## 9. 인증 API

## 9.1 회원가입

`POST /api/v1/auth/signup`

### request

```json
{
  "email": "user@example.com",
  "password": "password1234",
  "nickname": "문틈러"
}
```

### validation

- email required
- valid email format
- password min 8
- nickname 1~20자

### response `201`

```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "문틈러"
    },
    "accessToken": "jwt-or-session-token"
  }
}
```

---

## 9.2 로그인

`POST /api/v1/auth/login`

### request

```json
{
  "email": "user@example.com",
  "password": "password1234"
}
```

### response `200`

```json
{
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "문틈러"
    },
    "accessToken": "jwt-or-session-token"
  }
}
```

---

## 9.3 내 정보 조회

`GET /api/v1/me`

### response `200`

```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "문틈러"
  }
}
```

---

## 9.4 로그아웃

`POST /api/v1/auth/logout`

### response `200`

```json
{
  "data": {
    "success": true
  }
}
```

---

## 10. 책 검색 API

## 10.1 책 검색

`GET /api/v1/books/search?q={keyword}`

### query

- `q`: 제목 또는 저자 검색어, required
- `page`: optional, default 1
- `size`: optional, default 10, max 20

### response `200`

```json
{
  "data": [
    {
      "externalId": "book-api-123",
      "isbn": "9781234567890",
      "title": "아무튼, 기록",
      "author": "홍길동",
      "publisher": "문장출판",
      "coverUrl": "https://example.com/cover.jpg"
    }
  ],
  "meta": {
    "page": 1,
    "size": 10,
    "hasNext": false
  }
}
```

### 비고

- 검색 결과는 외부 API 응답 기반
- 이 API 호출만으로는 DB 저장이 일어나지 않음

---

## 11. 책장 API

## 11.1 내 책장 조회

`GET /api/v1/library?status=READING`

### query

- `status`: optional, `WANT_TO_READ | READING | FINISHED`

### response `200`

```json
{
  "data": [
    {
      "userBookId": 10,
      "status": "READING",
      "startedAt": "2026-08-21",
      "finishedAt": null,
      "rating": null,
      "review": null,
      "book": {
        "id": 7,
        "isbn": "9781234567890",
        "title": "아무튼, 기록",
        "author": "홍길동",
        "publisher": "문장출판",
        "coverUrl": "https://example.com/cover.jpg"
      }
    }
  ]
}
```

---

## 11.2 책장에 책 추가

`POST /api/v1/library`

### request

```json
{
  "book": {
    "isbn": "9781234567890",
    "title": "아무튼, 기록",
    "author": "홍길동",
    "publisher": "문장출판",
    "coverUrl": "https://example.com/cover.jpg"
  },
  "status": "READING",
  "startedAt": "2026-08-21"
}
```

### 규칙

- 이미 같은 사용자가 같은 책을 등록했다면 `409 CONFLICT`
- `READING`이면 `startedAt` 허용 및 기본값 오늘
- `WANT_TO_READ`면 `startedAt` 없이 생성 가능
- `FINISHED`로 바로 추가도 허용 가능하나 MVP에서는 정책 결정 필요

### response `201`

```json
{
  "data": {
    "userBookId": 10
  }
}
```

---

## 11.3 책 상세 조회

`GET /api/v1/library/{userBookId}`

### response `200`

```json
{
  "data": {
    "userBookId": 10,
    "status": "READING",
    "startedAt": "2026-08-21",
    "finishedAt": null,
    "rating": null,
    "review": null,
    "book": {
      "id": 7,
      "title": "아무튼, 기록",
      "author": "홍길동",
      "publisher": "문장출판",
      "coverUrl": "https://example.com/cover.jpg"
    },
    "notes": [
      {
        "id": 31,
        "page": 132,
        "quote": "마음에 머문 문장",
        "thought": "내가 남긴 생각",
        "createdAt": "2026-08-21T12:34:56Z"
      }
    ]
  }
}
```

---

## 11.4 독서 상태 변경

`PATCH /api/v1/library/{userBookId}/status`

### request examples

`READING`으로 변경:

```json
{
  "status": "READING",
  "startedAt": "2026-08-21"
}
```

`FINISHED`로 변경:

```json
{
  "status": "FINISHED",
  "finishedAt": "2026-08-21",
  "rating": 5,
  "review": "오래 두고 다시 펼쳐보고 싶은 책."
}
```

### 규칙

- `FINISHED`이면 `finishedAt` 권장
- `rating`, `review`는 optional
- `READING → FINISHED`가 대표 흐름

### response `200`

```json
{
  "data": {
    "userBookId": 10,
    "status": "FINISHED"
  }
}
```

---

## 12. 기록 API

## 12.1 빠른 기록용 책 목록

`GET /api/v1/library/reading`

### response `200`

```json
{
  "data": [
    {
      "userBookId": 10,
      "title": "아무튼, 기록",
      "author": "홍길동",
      "coverUrl": "https://example.com/cover.jpg"
    }
  ]
}
```

### 비고

- `READING` 상태 책만 반환
- 한 권뿐인 경우 클라이언트에서 자동 선택 가능

---

## 12.2 기록 생성

`POST /api/v1/notes`

### request

```json
{
  "userBookId": 10,
  "page": 132,
  "quote": "마음에 머문 문장",
  "thought": "이 문장에서 오래 머물렀다."
}
```

### validation

- `userBookId` required
- `page` numeric optional
- `quote` or `thought` required

### response `201`

```json
{
  "data": {
    "id": 31,
    "userBookId": 10,
    "page": 132,
    "quote": "마음에 머문 문장",
    "thought": "이 문장에서 오래 머물렀다.",
    "createdAt": "2026-08-21T12:34:56Z"
  }
}
```

---

## 12.3 기록 상세 조회

`GET /api/v1/notes/{noteId}`

### response `200`

```json
{
  "data": {
    "id": 31,
    "userBookId": 10,
    "page": 132,
    "quote": "마음에 머문 문장",
    "thought": "이 문장에서 오래 머물렀다.",
    "createdAt": "2026-08-21T12:34:56Z",
    "updatedAt": "2026-08-21T12:34:56Z"
  }
}
```

---

## 12.4 기록 수정

`PATCH /api/v1/notes/{noteId}`

### request

```json
{
  "page": 140,
  "quote": "수정한 문장",
  "thought": "수정한 생각"
}
```

### validation

- 수정 후에도 `quote` 또는 `thought` 중 하나는 남아 있어야 함

### response `200`

```json
{
  "data": {
    "id": 31,
    "page": 140,
    "quote": "수정한 문장",
    "thought": "수정한 생각"
  }
}
```

---

## 12.5 기록 삭제

`DELETE /api/v1/notes/{noteId}`

### response `200`

```json
{
  "data": {
    "success": true
  }
}
```

---

## 13. Home API

## 13.1 홈 요약 조회

`GET /api/v1/home`

### response `200`

```json
{
  "data": {
    "currentReadingBook": {
      "userBookId": 10,
      "startedAt": "2026-08-21",
      "book": {
        "title": "아무튼, 기록",
        "author": "홍길동",
        "coverUrl": "https://example.com/cover.jpg"
      }
    },
    "recentNotes": [
      {
        "id": 31,
        "page": 132,
        "quotePreview": "마음에 머문 문장",
        "createdAt": "2026-08-21T12:34:56Z",
        "bookTitle": "아무튼, 기록"
      }
    ]
  }
}
```

### 비고

- `currentReadingBook`는 0개 또는 1개를 기대
- 여러 권이 `READING`이어도 홈에는 최근 업데이트 기준 1권만 노출하는 정책 가능

---

## 14. Calendar API

## 14.1 월별 기록 존재 날짜 조회

`GET /api/v1/calendar?month=2026-08`

### response `200`

```json
{
  "data": {
    "month": "2026-08",
    "daysWithNotes": ["2026-08-18", "2026-08-20", "2026-08-21"]
  }
}
```

---

## 14.2 특정 날짜 기록 조회

`GET /api/v1/calendar/daily?date=2026-08-21`

### response `200`

```json
{
  "data": [
    {
      "id": 31,
      "page": 132,
      "quote": "마음에 머문 문장",
      "thought": "이 문장에서 오래 머물렀다.",
      "createdAt": "2026-08-21T12:34:56Z",
      "book": {
        "title": "아무튼, 기록",
        "coverUrl": "https://example.com/cover.jpg"
      }
    }
  ]
}
```

---

## 15. My API

## 15.1 마이페이지 요약 조회

`GET /api/v1/my`

### response `200`

```json
{
  "data": {
    "year": 2026,
    "stats": {
      "finishedBooks": 14,
      "notesCount": 58,
      "recordedDays": 31
    },
    "recentFinishedBooks": [
      {
        "userBookId": 55,
        "finishedAt": "2026-08-20",
        "book": {
          "title": "아무튼, 기록",
          "coverUrl": "https://example.com/cover.jpg"
        }
      }
    ]
  }
}
```

### 집계 규칙

- `finishedBooks`: 해당 연도 `finished_at` 기준 완독한 책 수
- `notesCount`: 전체 기록 수 또는 해당 연도 기준 여부는 정책 결정 필요
- `recordedDays`: 기록을 남긴 distinct date 수

권장:

- `finishedBooks`와 `recordedDays`는 해당 연도 기준
- `notesCount`도 같은 연도 기준으로 맞추는 편이 UI 해석이 쉬움

---

## 16. 설정 API

## 16.1 비밀번호 변경

`PATCH /api/v1/me/password`

### request

```json
{
  "currentPassword": "password1234",
  "newPassword": "new-password1234"
}
```

### response `200`

```json
{
  "data": {
    "success": true
  }
}
```

---

## 16.2 회원 탈퇴

`DELETE /api/v1/me`

### response `200`

```json
{
  "data": {
    "success": true
  }
}
```

### 데이터 처리 정책

- hard delete 또는 soft delete 선택 필요
- MVP에서는 운영 단순성을 위해 hard delete도 가능
- 다만 참조 무결성을 위해 cascade 전략 명확화 필요

---

## 17. 화면-API 매핑

| 화면 | API |
|---|---|
| 회원가입 | `POST /api/v1/auth/signup` |
| 로그인 | `POST /api/v1/auth/login` |
| Home | `GET /api/v1/home` |
| Library | `GET /api/v1/library` |
| 책 검색 | `GET /api/v1/books/search` |
| 책 등록 | `POST /api/v1/library` |
| 책 상세 | `GET /api/v1/library/{userBookId}` |
| 상태 변경 | `PATCH /api/v1/library/{userBookId}/status` |
| 빠른 기록 책 선택 | `GET /api/v1/library/reading` |
| 기록 생성 | `POST /api/v1/notes` |
| 기록 수정 | `PATCH /api/v1/notes/{noteId}` |
| 기록 삭제 | `DELETE /api/v1/notes/{noteId}` |
| Calendar 월 조회 | `GET /api/v1/calendar` |
| Calendar 날짜 조회 | `GET /api/v1/calendar/daily` |
| My | `GET /api/v1/my` |
| 비밀번호 변경 | `PATCH /api/v1/me/password` |
| 로그아웃 | `POST /api/v1/auth/logout` |
| 회원 탈퇴 | `DELETE /api/v1/me` |

---

## 18. 구현 메모

## 서버 로직에서 먼저 확정할 것

1. Access token 방식: JWT vs session
2. 외부 책 검색 API 공급자
3. `FINISHED` 상태로 바로 책 등록 허용 여부
4. 홈의 현재 읽는 책 선정 규칙
5. `My` 통계의 연도 기준 범위
6. 회원 탈퇴 시 soft delete 여부

## MVP 우선 구현 순서

1. Auth
2. Library / Book Search
3. Note CRUD
4. Home Summary
5. Finish Book
6. Calendar
7. My Summary
8. Settings

---

## 19. 다음 단계 제안

이 문서 다음으로 바로 만들기 좋은 산출물:

1. SQL DDL 초안
2. OpenAPI YAML 초안
3. 백엔드 작업 티켓 목록
4. 프론트엔드 화면별 연동 명세
