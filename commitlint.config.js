/* eslint-env node */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "chore", "hotfix"],
    ],
    "type-empty": [2, "never", "提交类型不能为空！"],
    "subject-empty": [2, "never", "提交说明不能为空！"],
    "header-max-length": [2, "always", 72],
  },
  formatter: "@commitlint/format",
};
