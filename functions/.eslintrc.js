module.exports = {
  parser: "@typescript-eslint/parser",
  env: {
    browser: true,
    es6: true,
    commonjs: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "google"
    // "plugin:@typescript-eslint/eslint-recommended"
  ],
  // overrides: [
  //   {
  //     parser: "@typescript-eslint/parser",
  //     extends: [
  //       "plugin:@typescript-eslint/recommended",
  //       "plugin:import/typescript",
  //     ],
  //     plugins: ["@typescript-eslint"],

  //     files: ["*.ts", "*.tsx"],

  //     rules: {},
  //   },
  // ],
  rules: {
    "quotes": ["error", "double"],
    "object-curly-spacing": ["error", "always"],
    "max-len": [
      "error",
      {
        code: 150,
        tabWidth: 4
      }
    ],
    "indent": ["error", 2, { SwitchCase: 1 }],
    "no-invalid-this": [0],
    "require-jsdoc": [0],
    "default-case": "error",
    "curly": "error",
    "dot-notation": ["error", { allowPattern: "^[a-z]+(_[a-z]+)+$" }],
    "eqeqeq": ["error", "always"],
    "array-bracket-newline": ["error", { multiline: true }],
    "block-spacing": "error",
    "brace-style": "error",
    "comma-dangle": ["error", "never"],
    "comma-spacing": [
      "error",
      {
        before: false,
        after: true
      }
    ],
    "comma-style": ["error", "last"],
    "computed-property-spacing": ["error", "never"],
    "eol-last": ["error", "always"],
    "func-call-spacing": ["error", "never"],
    "func-name-matching": ["error", "always"],
    "func-style": ["error", "declaration", { allowArrowFunctions: true }],
    "function-call-argument-newline": ["error", "consistent"],
    "function-paren-newline": ["error", "multiline-arguments"],
    "key-spacing": ["error", { beforeColon: false }],
    "keyword-spacing": ["error", { before: true }],
    "linebreak-style": ["error", "unix"],
    "multiline-ternary": ["error", "always-multiline"],
    "no-lonely-if": "error",
    "no-multiple-empty-lines": "error",
    "no-trailing-spaces": "error",
    "no-unneeded-ternary": "error",
    "no-whitespace-before-property": "error",
    "object-curly-newline": ["error", { multiline: true }],
    "object-property-newline": "error",
    "switch-colon-spacing": "error",
    "space-unary-ops": "error",
    "import/no-anonymous-default-export": [2, { allowArray: true }],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [1]
    // "no-nested-ternary": "error"
    // "newline-per-chained-call": ["error", { "ignoreChainWithDepth": 1 }]
  },
  ignorePatterns: ["lib", "node_modules", "build", "dist", "public"]
};
