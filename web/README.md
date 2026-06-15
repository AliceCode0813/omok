# 오목 온라인 (웹)

친구와 실시간으로 대국하는 웹 오목입니다. 방 코드 또는 초대 링크로 같은 게임에 참가할 수 있습니다.

## 기능

- 방 만들기 / 6자리 코드로 참가
- 초대 링크 복사
- Supabase Realtime으로 실시간 동기화
- 모바일 브라우저 지원

## 1. Supabase 설정

1. [https://supabase.com](https://supabase.com) 에서 무료 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 내용 실행
3. **Database → Replication** 에서 `rooms` 테이블 Realtime 활성화
4. **Project Settings → API** 에서 URL과 `anon public` 키 복사

## 2. 환경 변수

`web/.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Vercel 배포 시에도 같은 변수를 **Environment Variables**에 추가하세요.

## 3. 로컬 실행

```powershell
cd web
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 4. Vercel 배포

1. GitHub `omok` 저장소를 Vercel에 연결
2. **Root Directory** 를 `web` 으로 설정
3. 환경 변수 2개 추가
4. Deploy

배포 후 주소 예: `https://omok.vercel.app`

## 사용 방법

1. 한 사람이 **새 방 만들기**
2. **초대 링크 복사** 후 친구에게 전송
3. 친구가 링크를 열면 자동으로 백돌로 참가
4. 서로 번갈아 두면 실시간으로 판이 동기화됩니다

## PC용 오목

상위 폴더의 `omok.py` 는 PC용 tkinter 버전입니다.
