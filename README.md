# 한글뷰어 (`www.hwpx.co.kr`)

블로그스팟을 Astro + GitHub + Cloudflare Pages + Decap CMS로 옮긴 사이트입니다.
기존 글 주소 `/YYYY/MM/slug.html` 을 그대로 유지합니다.

디자인은 [Hasagi](https://hasagi-template.vercel.app/)의 점 배경, 라이트/다크, 큰 히어로를 참고했고,
Mac용 한글 도구로는 [알한글](https://github.com/postmelee/alhangeul-macos)을 소개합니다.
알한글은 웹 테마가 아니라 데스크톱 앱이라, 사이트 스킨이 아니라 추천 도구로 연결했습니다.

## 가져오기

공식 Atom 피드만 사용합니다. HTML 페이지는 크롤링하지 않습니다.

```bash
npm run import:atom
```

- `https://www.hwpx.co.kr/feeds/posts/default?alt=atom&max-results=150`
- `start-index=151`, `301` … 으로 피드가 알려 주는 편수 전부
- 현재 공개 피드는 **2편**입니다 (`openSearch:totalResults=2`)
- `blogger.googleusercontent.com` 이미지는 `public/uploads/` 로 저장

## 로컬

```bash
npm install
npm run dev
```

확인할 주소:

- `/` 홈
- `/2025/07/hancom-viewer.html` 기존 퍼머링크
- `/2025/06/open-hwp-hwpx.html` 기존 퍼머링크
- `/alhangeul.html` 알한글 소개
- `/search.html?q=한글`
- `/rss` (rss.xml 아님)

## 배포

GitHub Actions가 `main` 푸시 후 Cloudflare Pages 프로젝트 `hwpx` 에 `dist` 를 올립니다.

필요한 시크릿:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Pages 설정(대시보드에서 직접 연결할 때):

- Build command: `npm run build`
- Output: `dist`

도메인은 `hwpx.co.kr` 과 `www.hwpx.co.kr` 둘 다 Pages에 붙이면 됩니다.

## Decap CMS (`/admin/`)

Netlify Identity 없이 GitHub OAuth를 Pages Functions로 처리합니다.

1. GitHub → Settings → Developer settings → OAuth Apps 에서 앱 생성
2. Homepage URL: `https://www.hwpx.co.kr`
3. Authorization callback URL: `https://www.hwpx.co.kr/api/oauth/callback`
   - 커스텀 도메인 전에는 `https://hwpx.pages.dev/api/oauth/callback` 도 추가
4. Cloudflare Pages → Settings → Environment variables
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
5. `public/admin/config.yml` 의 `repo` 와 `base_url` 이 실제 GitHub 저장소·접속 주소와 같아야 합니다.

미디어는 `public/uploads` 에 커밋됩니다. CMS에서 Publish 하면 GitHub `main` 에 커밋되고 Pages가 다시 빌드됩니다.
