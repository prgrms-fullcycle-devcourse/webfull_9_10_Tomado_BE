import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
    // 1. 검사 제외 대상 (빌드 결과물과 패키지 폴더)
    {
        ignores: ['dist', 'node_modules', 'env', 'prettier.config.cjs', '.prettierrc'],
    },

    // 2. 기본 추천 규칙 적용
    js.configs.recommended,
    ...tseslint.configs.recommended,

    {
        // 3. 대상 파일 설정
        files: ['**/*.ts'],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            // 핵심: 브라우저가 아닌 Node.js 전역 변수(process, __dirname 등)를 허용합니다.
            globals: {
                ...globals.node,
            },
        },
        rules: {
            // 백엔드 개발 편의를 위한 규칙 조정
            'no-console': 'off', // 서버 로그 확인을 위해 console.log 허용
            '@typescript-eslint/no-unused-vars': 'warn', // 안 쓰는 변수는 경고만
            '@typescript-eslint/no-explicit-any': 'warn', // any 타입 사용 자제 권고
        },
    },

    // 4. Prettier와 충돌하는 ESLint 규칙들을 마지막에 꺼줍니다.
    prettierConfig
);
