/** @type {import("@commitlint/types").UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 100],
    "body-max-line-length": [2, "always", 200],
    "footer-max-line-length": [2, "always", 200],
    "type-enum": [
      2,
      "always",
      [
        "build",
        "chore",
        "ci",
        "db",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "style",
        "test",
      ],
    ],
  },
};
