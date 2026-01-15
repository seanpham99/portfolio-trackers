module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation only
        "style", // Formatting, missing semicolons, etc.
        "refactor", // Code change that neither fixes a bug nor adds a feature
        "perf", // Performance improvement
        "test", // Adding missing tests
        "chore", // Maintenance (deps, config, etc.)
        "revert", // Revert previous commit
      ],
    ],
    // Disable scope requirement warnings; scope is optional in ACs
    "scope-empty": [0, "never"],
    // Disable strict subject case to allow acronyms (e.g., README)
    "subject-case": [0],
  },
};
