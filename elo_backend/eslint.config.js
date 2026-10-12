const js = require('@eslint/js');
const importPlugin = require('eslint-plugin-import');
const globals = require('globals');

module.exports = [
    js.configs.recommended,
    importPlugin.flatConfigs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.commonjs,
                ...globals.es2022,
                ...globals.jest,
                ...globals.node,
                console: 'readonly',
                module: 'readonly',
                require: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly'
            }
        },
        rules: {
            // Import rules
            'import/no-empty-named-blocks': 'error',
            'import/no-mutable-exports': 'error',
            'import/no-named-as-default': 'error',
            'import/no-import-module-exports': 'error',
            'import/no-self-import': 'error',
            'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
            'import/no-namespace': 'error',
            'import/no-amd': 'error',
            'import/no-cycle': ['error', { maxDepth: 1 }],
            'import/no-dynamic-require': 'error',
            // Node rules (some may conflict, adjust as needed)
            'node/no-unpublished-require': 'off',
            'node/no-unsupported-features/es-syntax': 'off',
            'node/no-unsupported-features/node-builtins': 'off',
            // Custom rules
            'arrow-spacing': 'error',
            'array-bracket-spacing': ['error', 'never'],
            'arrow-body-style': ['error', 'as-needed'],
            'space-in-parens': ['error', 'never'],
            'brace-style': ['error', '1tbs'],
            'block-scoped-var': 'error',
            indent: ['error', 4, { SwitchCase: 1 }],
            'comma-spacing': ['error', { before: false, after: true }],
            'computed-property-spacing': ['error', 'never'],
            'default-case': 'error',
            'default-case-last': 'error',
            'no-duplicate-case': 'error',
            'default-param-last': ['error'],
            'dot-location': ['error', 'property'],
            camelcase: 'off',
            quotes: ['error', 'single', { allowTemplateLiterals: true }],
            semi: ['error', 'always'],
            'linebreak-style': ['error', 'unix'],
            'no-unused-vars': ['error', {
                vars: 'all',
                args: 'after-used',
                ignoreRestSiblings: false
            }],
            'no-multiple-empty-lines': ['error', {
                max: 1,
                maxBOF: 0,
                maxEOF: 0
            }],
            'func-names': 'off',
            'func-call-spacing': ['error', 'never'],
            'function-call-argument-newline': ['error', 'consistent'],
            'grouped-accessor-pairs': ['error', 'getBeforeSet'],
            'guard-for-in': 'error',
            'no-global-assign': 'error',
            'no-param-reassign': 'off',
            'no-multi-spaces': ['error', { ignoreEOLComments: true }],
            'new-cap': ['error', { capIsNewExceptions: ['Router'] }],
            'no-alert': 'error',
            'no-caller': 'error',
            'no-array-constructor': 'error',
            'no-empty-static-block': 'error',
            'no-delete-var': 'error',
            'no-lonely-if': 'error',
            'no-constructor-return': 'error',
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-script-url': 'error',
            'no-extend-native': 'error',
            'no-extra-bind': 'error',
            'no-self-compare': 'error',
            'no-floating-decimal': 'error',
            'no-iterator': 'error',
            'no-whitespace-before-property': 'error',
            'no-label-var': 'error',
            'no-labels': 'error',
            'no-lone-blocks': 'error',
            'no-loop-func': 'error',
            'no-new-func': 'error',
            'no-new-object': 'error',
            'no-new-wrappers': 'error',
            'no-undef-init': 'error',
            'no-undefined': 'error',
            'no-unreachable-loop': 'error',
            'no-use-before-define': 'error',
            'no-obj-calls': 'error',
            'newline-before-return': 'error',
            'no-ex-assign': 'error',
            'class-methods-use-this': 'off',
            'implicit-arrow-linebreak': ['error', 'beside'],
            'no-underscore-dangle': ['error', { allow: ['_id', '_Id'] }],
            'object-shorthand': ['error', 'always', {
                avoidQuotes: true,
                ignoreConstructors: true
            }],
            'object-curly-spacing': ['error', 'always'],
            'key-spacing': ['error', {
                beforeColon: false,
                afterColon: true
            }],
            'no-console': 'error',
            'max-len': ['error', {
                code: 150,
                comments: 180,
                ignoreStrings: true,
                ignoreTemplateLiterals: false,
                ignoreUrls: false
            }],
            'spaced-comment': ['error', 'always', { markers: ['/'] }],
            'space-before-function-paren': ['error', {
                anonymous: 'always',
                named: 'never',
                asyncArrow: 'always'
            }],
            'switch-colon-spacing': ['error', { after: true, before: false }],
            'space-before-blocks': ['error', 'always'],
            'keyword-spacing': ['error', {
                before: true,
                after: true
            }],
            'comma-dangle': ['error', {
                arrays: 'never',
                objects: 'never',
                imports: 'never',
                exports: 'never',
                functions: 'never'
            }],
            'space-unary-ops': [2, {
                words: true,
                nonwords: false,
                overrides: {
                    new: false,
                    '++': false
                }
            }],
            'no-useless-concat': 'error',
            'no-useless-call': 'error',
            'no-useless-computed-key': 'error',
            'no-useless-constructor': 'error',
            'nonblock-statement-body-position': ['error', 'beside'],
            'no-useless-rename': ['error', {
                ignoreDestructuring: false,
                ignoreImport: false,
                ignoreExport: false
            }],
            'no-useless-return': 'error',
            'no-unneeded-ternary': ['error', { defaultAssignment: false }],
            'no-sequences': 'error',
            'no-new': 'error',
            'prefer-template': 'error',
            'no-var': 'error',
            'no-proto': 'error',
            'no-octal': 'error',
            'no-octal-escape': 'error',
            'no-shadow': ['error', {
                builtinGlobals: true,
                hoist: 'functions',
                allow: ['editor', 'course'],
                ignoreOnInitialization: false
            }],
            'no-shadow-restricted-names': 'error',
            'no-unused-labels': 'error',
            'no-throw-literal': 'error',
            'no-void': ['error', { allowAsStatement: true }],
            'no-with': 'error',
            'no-compare-neg-zero': 'error',
            'no-class-assign': 'error',
            'no-constant-condition': 'error',
            'no-dupe-args': 'error',
            'no-dupe-class-members': 'error',
            'no-dupe-keys': 'error',
            'no-duplicate-imports': 'error',
            'no-empty-character-class': 'error',
            'no-sparse-arrays': 'error',
            'no-case-declarations': 'error',
            'no-setter-return': 'error',
            'no-unsafe-finally': 'error',
            'no-template-curly-in-string': 'error',
            'template-curly-spacing': ['error', 'never'],
            'no-mixed-spaces-and-tabs': 'error',
            'no-return-await': 'off',
            'max-depth': ['error', 4],
            'use-isnan': 'error',
            'max-classes-per-file': ['error', { ignoreExpressions: true, max: 3 }],
            'padded-blocks': ['error', 'never'],
            'prefer-const': ['error', {
                destructuring: 'any',
                ignoreReadBeforeAssign: false
            }],
            'prefer-exponentiation-operator': 'error',
            'prefer-spread': 'error',
            'rest-spread-spacing': ['error', 'never'],
            'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
            'space-infix-ops': 'error',
            'func-name-matching': 'error',
            radix: ['error', 'as-needed'],
            eqeqeq: ['error', 'smart'],
            'unicode-bom': ['error', 'never'],
            'wrap-iife': 'error',
            'eol-last': ['error', 'always'],
            'vars-on-top': 'error',
            yoda: ['error', 'never', { exceptRange: true }],
            'yield-star-spacing': ['error', 'before']
        }
    },
    {
        files: ['scripts/**/*.js'],
        rules: {
            'no-console': 'off',
            'no-use-before-define': 'off'
        }
    }
];
