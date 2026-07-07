# AGENTS.md

이 프로젝트의 모든 에이전트는 공통 위키를 참조해 작업한다.

- 연동돼 있으면 `./frontend-wiki/20_wiki/index.md`를 직접 열어 읽는다.
- 아직 연동 안 됐으면 위키 `20_wiki/operations/agent-instruction-guide.md`의
  "위키 연동" 절차를 따라 연동한 뒤 진행한다.
- index를 읽은 뒤 `./frontend-wiki/20_wiki/conventions/`·`./frontend-wiki/20_wiki/operations/`
  문서를 **선행 학습한다(필수).**

## git 규칙 (필수)

보호 브랜치(`main`·`dev`·`prod`)에 직접 커밋·push 금지(예외 없음). "커밋/푸시 해줘"만 말해도 묻지 말고 작업 브랜치부터 만든다.
브랜치 전략은 `./frontend-wiki/20_wiki/operations/branch-strategy.md`를 따른다 —
인프라·위키 저장소는 main 단일 트랙, 사내 제품 프로젝트는 prod/dev 트랙.
커밋 전 `git branch --show-current`로 확인하고, 보호 브랜치면 트랙에 맞는
작업 브랜치를 만들어 이동한 뒤 진행한다. 반영은 작업 브랜치 → PR/MR.

## 작업 기록 (필수)

작업이 끝나면 `./frontend-wiki/20_wiki/operations/project-wiki-guide.md`를 따라
작업 내용을 `docs/worklog.md`에 기재한다.

## MR / PR (필수)

사용자가 MR/PR 작성을 요청하면 `./frontend-wiki/20_wiki/operations/mr-pr-guide.md`를
반드시 먼저 읽고 숙지한 뒤 절차대로 작성한다.

## 도구 활용

- 라이브러리·프레임워크 문서 검색은 **context7**(MCP)을 우선 활용한다.
  사용법·설치는 `./frontend-wiki/20_wiki/operations/context7-instruction-guide.md`를 따른다.
- 개발은 **superpowers** 프로세스 스킬 사용을 권장한다. 설치되어 있지 않으면
  `./frontend-wiki/20_wiki/operations/superpowers-instruction-guide.md`의 설치 절차를 참고한다.
