export const site = {
  name: "한글뷰어",
  tagline: "HWP · HWPX를 여는 가장 짧은 길",
  description:
    "한글(.hwp, .hwpx) 파일을 열기 위한 뷰어 안내와 Mac용 오픈소스 알한글 소개를 모은 사이트입니다.",
  url: "https://www.hwpx.co.kr",
  lang: "ko",
};

export const nav = [
  { label: "글", href: "/#posts" },
  { label: "한글뷰어", href: "/2025/07/hancom-viewer.html" },
  { label: "알한글", href: "/alhangeul.html" },
  { label: "검색", href: "/search.html" },
];

export const alhangeul = {
  name: "알한글 for macOS",
  tagline: "Mac에서 한글 파일은 더 이상 이방인이 아닙니다.",
  description:
    "HWP/HWPX를 미리보고, 열고, 저장하고, 공유하고, PDF로 내보내는 오픈소스 데스크톱 앱입니다. 파일을 업로드하지 않고 로컬에서 다룹니다.",
  repo: "https://github.com/postmelee/alhangeul-macos",
  releases: "https://github.com/postmelee/alhangeul-macos/releases/latest",
  dmg: "https://github.com/postmelee/alhangeul-macos/releases/download/v0.2.0/alhangeul-macos-0.2.0.dmg",
  version: "v0.2.0",
  brew: "brew install --cask postmelee/tap/alhangeul",
};

export const pageSize = 12;
