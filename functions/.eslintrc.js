module.exports = {
  parser: "babel-eslint",
  env: {
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended", "google"],
  rules: {
    "quotes": ["error", "double"],
    "object-curly-spacing": ["error", "always"],
    "max-len": ["error", { code: 150 }],
    "indent": ["error", 2],
    "no-invalid-this": [0],
  },
};
