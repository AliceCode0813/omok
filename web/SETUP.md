# 전체 설정 가이드 (함께 진행)

아래 순서대로 하면 **친구랑 폰으로 실시간 오목**까지 완성됩니다.

---

## 진행 체크리스트

- [ ] 1. GitHub 코드 업로드 (Agent가 처리)
- [ ] 2. Supabase 프로젝트 만들기 (5분)
- [ ] 3. 환경 변수 넣기 (Agent가 처리)
- [ ] 4. Vercel 배포 (5분)

---

## 1. GitHub ✅

코드는 `AliceCode0813/omok` 저장소의 `web` 폴더에 있습니다.

---

## 2. Supabase 만들기 (직접 한 번만)

### 2-1. 가입/로그인
1. https://supabase.com 접속
2. **Start your project** → GitHub로 로그인

### 2-2. 새 프로젝트
1. **New project** 클릭
2. 이름: `omok` (아무거나 OK)
3. Database Password: **꼭 메모해 두세요** (나중에 DB 직접 볼 때 필요)
4. Region: **Northeast Asia (Seoul)** 추천
5. **Create new project** → 1~2분 대기

### 2-3. 테이블 만들기
1. 왼쪽 **SQL Editor** 클릭
2. **New query** 클릭
3. 아래 파일 내용 전체 복사해서 붙여넣기:
   - `web/supabase/schema.sql`
4. **Run** 클릭 → Success 나오면 OK

### 2-4. Realtime 켜기 (UI가 안 보이면 SQL로)

**방법 A — SQL (추천, 가장 쉬움)**

SQL Editor에서 아래 한 줄만 실행:

```sql
alter publication supabase_realtime add table public.rooms;
```

Success 나오면 완료입니다.

**방법 B — 화면에서**

1. 왼쪽 **Database** → **Publications** (또는 **Realtime**)
2. `supabase_realtime` 항목 찾기
3. `rooms` 테이블 체크/토글 ON

> 예전 안내의 **Replication** 메뉴는 없거나 이름이 바뀌었을 수 있습니다.

### 2-5. API 키 복사
1. 왼쪽 **Project Settings** (톱니바퀴)
2. **API** 메뉴
3. 아래 두 값 복사:
   - **Project URL** (예: `https://abcdefgh.supabase.co`)
   - **anon public** 키 (긴 문자열)

→ 이 두 값을 Agent에게 알려주시면 `.env.local` 설정과 Vercel 변수까지 이어서 처리합니다.

---

## 3. Vercel 배포

### 3-1. 프로젝트 연결
1. https://vercel.com 로그인
2. **Add New...** → **Project**
3. GitHub에서 **`omok`** 저장소 **Import**
4. **중요:** **Root Directory** → **Edit** → `web` 입력 후 Continue

### 3-2. 환경 변수 추가
**Environment Variables**에 아래 2개 추가:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public 키 |

### 3-3. Deploy
**Deploy** 클릭 → 2~3분 후 `https://omok-xxx.vercel.app` 주소 생성

---

## 4. 친구랑 테스트

1. 배포된 주소 접속
2. **새 방 만들기**
3. **초대 링크 복사** → 친구에게 전송
4. 친구가 폰에서 링크 열기
5. 번갈아 두기 → 실시간 동기화 확인

---

## 막힐 때

| 문제 | 해결 |
|------|------|
| 방 만들기 실패 | Supabase SQL·환경 변수 확인 |
| 상대 수가 안 보임 | Replication에서 `rooms` Realtime ON |
| Vercel 빌드 실패 | Root Directory가 `web`인지 확인 |

---

## Agent에게 알려줄 것

Supabase 설정 후 아래 형식으로 보내주세요:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
```

그러면 로컬 테스트와 Vercel 환경 변수 설정을 이어서 도와드립니다.
