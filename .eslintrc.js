module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        "plugin:@typescript-eslint/recommended",
        // 用于关闭 ESLint 相关的格式规则集，详见：https://github.com/prettier/eslint-config-prettier/blob/master/index.js
        "prettier",
        // 用于关闭 @typescript-eslint/eslint-plugin 插件相关的格式规则集，详见：https://github.com/prettier/eslint-config-prettier/blob/master/%40typescript-eslint.js
        "prettier/@typescript-eslint",
        "react-app",
        "react-app/jest",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 12,
        sourceType: "module",
    },
    plugins: ["react", "@typescript-eslint"],
    rules: {}
}
