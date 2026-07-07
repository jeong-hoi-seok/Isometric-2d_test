# worklog

## 2026-07-07

- 대시보드 UI 개편: 뷰어·에디터를 aside 탭(배치/그리드) 단일 화면으로 병합, Tailwind v4·zustand·shadcn/ui 도입(#13111B 우주 배경, 캔버스 화면 fit). 그리드 옵션을 실시간 조정 가능하게 해 캘리브레이션-배치 사이클 단축.
- 아이소 랜덤 배치 MVP 구현: 가상 그리드 캘리브레이션 에디터(?editor) + footprint 랜덤 배치 + 깊이 정렬 캔버스 렌더. 그리드 정보 없는 완성 PNG에 논리 좌표를 입히는 방식 검증이 목적. 캘리브레이션은 상판 타원 내접 12×12 마름모(origin 825,250 / tileW 100)로 산출, 브라우저 검증 통과.

- React 프로젝트 셋팅: Vite 8 react-ts 템플릿 (React 19·TypeScript 6·oxlint), packageManager pnpm@11.10.0·engines node>=24 고정. 2D 아이소메트릭 에셋 배치 MVP를 캔버스로 직접 구현할 예정이라 외부 캔버스·게임 라이브러리는 넣지 않음.
- 프로젝트 초기 셋팅: frontend-wiki 심볼릭링크 연동, AGENTS.md·CLAUDE.md 생성, .gitignore(위키 링크·superpowers 산출물 제외), .nvmrc(Node 24) 추가. 사내 공통 위키 규칙(agent-instruction-guide)에 맞추기 위함.
