## API 명세 관리

현재 API 명세 **초안**은 Notion에서 관리합니다.

- 문서: https://www.notion.so/API-321296d38a608020a3f2e3730ac04fda?source=copy_link

권장 운영 방식(팀 합의 후 업데이트):

- Notion(협업/코멘트) ↔ OpenAPI(YAML/JSON, 코드/테스트/모킹)로 싱크 전략 결정
- OpenAPI 파일을 이 폴더에 커밋하여 백엔드/프론트가 동일한 소스 오브 트루스를 보게 하기
