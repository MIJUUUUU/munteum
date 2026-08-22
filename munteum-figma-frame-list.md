# 문틈(Munteum) MVP Figma 프레임 목록

## 1. 문서 목적

이 문서는 `문틈` MVP의 모바일 화면을 Figma에서 빠르게 구성하기 위한 프레임 목록과 상태 정의 문서다.

사용 목적:

- 화면 설계 누락 방지
- 디자이너/PM/개발자 간 공통 화면 인벤토리 정렬
- 와이어프레임에서 UI 디자인 단계로 전환

기준 문서:

- `munteum-wireframes-ux-flow.md`

---

## 2. 기본 원칙

- 기준 디바이스: iPhone 14 / 390 x 844
- 모든 프레임은 모바일 우선
- Bottom Navigation 포함 화면과 미포함 화면을 구분
- 상태 변화가 큰 화면은 Variant 또는 별도 프레임으로 분리
- 모달, Toast, Bottom Sheet는 독립 프레임으로 관리

---

## 3. 페이지 구조 제안

```text
00 Cover
01 Foundations
02 Auth
03 Home
04 Library
05 Search & Add Book
06 Book Detail
07 Quick Record
08 Calendar
09 My
10 Components
11 Overlays
12 Prototype Flow
```

---

## 4. 프레임 네이밍 규칙

권장 형식:

```text
[섹션번호]_[화면명]_[상태]
```

예시:

- `03_Home_Default`
- `03_Home_Empty`
- `07_QuickRecord_Input_Error`
- `11_Modal_DeleteNote`

---

## 5. 화면별 프레임 목록

## 5.1 Cover

### 필수 프레임

1. `00_Cover_ProjectOverview`

### 포함 요소

- 서비스명 `문틈`
- 슬로건 `문장 사이, 나의 생각이 머무는 곳.`
- 버전 표기 `MVP v1`
- 작성일 `2026.08.21`

---

## 5.2 Foundations

### 필수 프레임

1. `01_Foundations_Color`
2. `01_Foundations_Typography`
3. `01_Foundations_Spacing`
4. `01_Foundations_Icons`
5. `01_Foundations_Buttons`
6. `01_Foundations_Inputs`

### 포함 요소

- Primary/Neutral/Error 색상
- 타이포 계층
- 4/8pt spacing rule
- 버튼 상태
- 입력 필드 상태

---

## 5.3 Auth

### 필수 프레임

1. `02_SignUp_Default`
2. `02_SignUp_InputError`
3. `02_SignUp_SubmitLoading`
4. `02_Login_Default`
5. `02_Login_InputError`
6. `02_Login_SubmitLoading`

### Optional 프레임

1. `02_Auth_SuccessTransition`

### 메모

- 로그인/회원가입은 심플한 진입 화면으로 유지
- 소셜 로그인은 MVP 범위 밖이므로 프레임 제외

---

## 5.4 Home

### 필수 프레임

1. `03_Home_Default`
2. `03_Home_NoReadingBook`
3. `03_Home_NoRecentNotes`
4. `03_Home_EmptyAll`

### Optional 프레임

1. `03_Home_Toast_SaveSuccess`

### 각 프레임 포함 요소

`03_Home_Default`

- 상단 워드마크
- 현재 읽는 책 카드
- 최근 기록 3개
- Bottom Navigation

`03_Home_NoReadingBook`

- 현재 읽는 책 영역 empty state
- 최근 기록은 존재

`03_Home_NoRecentNotes`

- 현재 읽는 책은 존재
- 최근 기록 empty state

`03_Home_EmptyAll`

- 책 없음
- 기록 없음
- CTA `책장에 책 놓기`, `첫 기록 남기기`

---

## 5.5 Library

### 필수 프레임

1. `04_Library_All`
2. `04_Library_Reading`
3. `04_Library_Finished`
4. `04_Library_WantToRead`
5. `04_Library_Empty`

### Optional 프레임

1. `04_Library_Scrolled`

### 메모

- 필터 탭별로 콘텐츠 차이가 커서 최소 4개 프레임 권장
- 책 표지 중심 Grid 확인 필요

---

## 5.6 Search & Add Book

### 필수 프레임

1. `05_Search_Initial`
2. `05_Search_Typing`
3. `05_Search_Result`
4. `05_Search_NoResult`
5. `05_Search_Error`
6. `05_AddBook_StatusSelect_Default`
7. `05_AddBook_StatusSelect_Reading`
8. `05_AddBook_StatusSelect_Finished`

### 상태 설명

`05_Search_Initial`

- 검색 전 가이드 문구

`05_Search_Typing`

- 키보드 열림 상태를 포함할지 선택

`05_Search_Result`

- 검색 결과 리스트
- `책장에 놓기` 버튼

`05_Search_NoResult`

- 결과 없음 안내

`05_Search_Error`

- API 실패 안내

`05_AddBook_StatusSelect_Default`

- 상태 미선택 기본 상태

`05_AddBook_StatusSelect_Reading`

- `읽고 있어요` 선택
- 시작일 입력 활성화

`05_AddBook_StatusSelect_Finished`

- `다 읽었어요` 선택 UI

---

## 5.7 Book Detail

### 필수 프레임

1. `06_BookDetail_Reading`
2. `06_BookDetail_Finished`
3. `06_BookDetail_WantToRead`
4. `06_BookDetail_NoNotes`
5. `06_BookDetail_WithNotes`
6. `06_BookDetail_NoteMenu`

### Optional 프레임

1. `06_BookDetail_StatusChangeSheet`

### 메모

- 책 상태별 상단 메타 정보가 달라짐
- 기록 없는 상태와 있는 상태를 분리하는 편이 명확함

---

## 5.8 Quick Record

### 필수 프레임

1. `07_QuickRecord_SelectBook_Default`
2. `07_QuickRecord_SelectBook_Empty`
3. `07_QuickRecord_Input_Default`
4. `07_QuickRecord_Input_QuoteOnly`
5. `07_QuickRecord_Input_ThoughtOnly`
6. `07_QuickRecord_Input_Filled`
7. `07_QuickRecord_Input_ValidationError`
8. `07_QuickRecord_SubmitLoading`
9. `07_QuickRecord_Toast_SaveSuccess`

### 상태 설명

`07_QuickRecord_SelectBook_Default`

- `READING` 도서 목록 노출

`07_QuickRecord_SelectBook_Empty`

- 기록 가능한 책 없음

`07_QuickRecord_Input_Default`

- 비어 있는 입력 상태

`07_QuickRecord_Input_QuoteOnly`

- 문장만 입력된 상태

`07_QuickRecord_Input_ThoughtOnly`

- 생각만 입력된 상태

`07_QuickRecord_Input_Filled`

- 페이지, 문장, 생각 모두 입력된 상태

`07_QuickRecord_Input_ValidationError`

- 문장/생각 모두 비어 있는 상태 또는 페이지 형식 에러

---

## 5.9 Note Edit / Delete

### 필수 프레임

1. `07_NoteEdit_Default`
2. `07_NoteEdit_Filled`
3. `07_NoteEdit_SaveLoading`
4. `11_Modal_DeleteNote`

### 메모

- Note Edit는 Quick Record와 별도 흐름으로 관리
- 삭제 모달은 공통 Overlay 페이지에도 복제 가능

---

## 5.10 Finish Book

### 필수 프레임

1. `07_FinishBook_Default`
2. `07_FinishBook_RatingSelected`
3. `07_FinishBook_WithReview`
4. `07_FinishBook_SubmitLoading`

### 메모

- 별점 선택 전/후 시각 변화 확인 필요
- 한줄평 입력 유무를 시안에서 확인해야 함

---

## 5.11 Calendar

### 필수 프레임

1. `08_Calendar_Default`
2. `08_Calendar_SelectedDate`
3. `08_Calendar_NoRecordMonth`
4. `08_Calendar_NoRecordDate`

### Optional 프레임

1. `08_Calendar_ScrolledList`

### 상태 설명

`08_Calendar_Default`

- 월간 뷰
- 기록 있는 날짜 Dot 노출

`08_Calendar_SelectedDate`

- 특정 날짜 선택
- 하단 기록 리스트 표시

`08_Calendar_NoRecordMonth`

- 해당 월 전체 기록 없음

`08_Calendar_NoRecordDate`

- 월 기록은 있으나 선택 날짜 기록 없음

---

## 5.12 My

### 필수 프레임

1. `09_My_Default`
2. `09_My_NoFinishedBooks`
3. `09_My_SettingsList`

### Optional 프레임

1. `09_My_LogoutConfirm`
2. `09_My_DeleteAccountConfirm`

### 메모

- 통계 카드와 최근 읽은 책이 핵심
- 설정 화면을 별도 분리할지 단일 스크롤 화면으로 둘지 결정 필요

---

## 5.13 Overlays

### 필수 프레임

1. `11_Modal_DeleteNote`
2. `11_Modal_LogoutConfirm`
3. `11_Modal_DeleteAccountConfirm`
4. `11_Toast_SaveSuccess`
5. `11_Toast_SaveFailure`
6. `11_Toast_DeleteSuccess`

### 메모

- Toast는 화면별 중복 제작 대신 공통 컴포넌트화 권장
- 파괴적 액션 모달은 문구 톤을 명확하게 유지

---

## 6. 컴포넌트 프레임 목록

## 6.1 Navigation

1. `10_Component_BottomNav_Default`
2. `10_Component_BottomNav_HomeActive`
3. `10_Component_BottomNav_LibraryActive`
4. `10_Component_BottomNav_RecordActive`
5. `10_Component_BottomNav_CalendarActive`
6. `10_Component_BottomNav_MyActive`

## 6.2 Book Card

1. `10_Component_BookCard_Grid`
2. `10_Component_BookCard_List`
3. `10_Component_CurrentReadingCard`

## 6.3 Note Item

1. `10_Component_NoteItem_Default`
2. `10_Component_NoteItem_WithMenu`

## 6.4 Input

1. `10_Component_Input_Default`
2. `10_Component_Input_Focus`
3. `10_Component_Input_Error`
4. `10_Component_Textarea_Default`
5. `10_Component_Textarea_Error`

## 6.5 Button

1. `10_Component_Button_Primary_Default`
2. `10_Component_Button_Primary_Disabled`
3. `10_Component_Button_Primary_Loading`
4. `10_Component_Button_Secondary_Default`
5. `10_Component_Button_Destructive_Default`

---

## 7. 프로토타입 연결 우선순위

## 1차 연결

1. `02_Login_Default`
2. `03_Home_Default`
3. `04_Library_All`
4. `05_Search_Result`
5. `05_AddBook_StatusSelect_Reading`
6. `06_BookDetail_Reading`
7. `07_QuickRecord_Input_Default`
8. `07_QuickRecord_Toast_SaveSuccess`
9. `08_Calendar_SelectedDate`
10. `09_My_Default`

## 2차 연결

1. Empty State 전환
2. Validation Error 전환
3. Delete Modal 전환
4. Finish Book 전환

---

## 8. 최소 제작 세트

디자인 리소스가 부족하면 아래 프레임부터 우선 제작한다.

1. `02_Login_Default`
2. `03_Home_Default`
3. `04_Library_All`
4. `05_Search_Result`
5. `05_AddBook_StatusSelect_Reading`
6. `06_BookDetail_WithNotes`
7. `07_QuickRecord_Input_Filled`
8. `08_Calendar_SelectedDate`
9. `09_My_Default`
10. `11_Modal_DeleteNote`

이 10개 프레임이면 MVP 핵심 흐름의 시각 설계를 시작할 수 있다.

---

## 9. 다음 단계 제안

이 문서 다음으로 바로 만들기 좋은 산출물:

1. 화면별 상세 UI 카피 문서
2. 디자인 토큰 초안
3. 개발용 화면 명세서
4. 구현 우선순위 티켓 목록
