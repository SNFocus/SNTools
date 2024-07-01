const antfu = require('@antfu/eslint-config').default;

module.exports = antfu({
  rules: {
    'no-debugger': 'error',
    'style/semi': 'off',
    'style/member-delimiter-style': 'off',
    'style/arrow-parens': ['warn', 'as-needed'],
    'no-console': 'off',
  },
});
