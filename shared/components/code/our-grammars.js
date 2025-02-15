Prism.languages['graphql-schema'] = Prism.languages['graphql'];

// inject comments into regular JSON
Prism.languages.json['comment'] = /\/\/.*/;

Prism.hooks.add('wrap', function(env) {
  if (env.type == 'synopsis-placeholder') {
    // remove leading "&lt;" and trailing ">"
    env.content = env.content.replace(/^&lt;|>$/g, "");
  }
  else if (env.type == 'synopsis-text') {
    env.content = env.content.replace(/^#\s+/, '');
  }
})

// python function signature highlighter
Prism.languages.python_function = {
  'module-prefix': {
    pattern: /[\w]+\./,
    greedy: true,

    inside: {
      'module': /[\w]+/,
      'modseparator': /\./,
    }
  },
  'funcname': /[\w]+/,
  'funcparams': {
    pattern: /\(.*(?=\))/,
    greedy: true,
    inside: {
      'parenthesis': /\(/,
      'funcarg': {
        pattern: /[^,)]*(,\s*|$)/,
        inside: {
          'boolean': Prism.languages.python['boolean'],
          'number': Prism.languages.python['number'],
          'string': [
            Prism.languages.python['triple-quoted-string'],
            Prism.languages.python['string'],
          ],
          'keyword': /\*{1,2}/,
          'equals': /=/,
          'argname': /[\w]+/,
        }
      }
    }
  },
  'funcreturn': {
    pattern: /\)\s*->.*$/,
    greedy: true,
    inside: {
      'parenthesis': /\)/,
      'return': /->/,
      'type': /\w+/,
    }
  }
};

// js function signature highlighter
Prism.languages.js_function = {
  'module-prefix': {
    pattern: /[\w]+\./,
    greedy: true,

    inside: {
      'module': /[\w]+/,
      'modseparator': /\./,
    }
  },
  'funcname': /[\w]+/,
  'funcparams': {
    pattern: /\(.*(?=\))/,
    greedy: true,
    inside: {
      'parenthesis': /\(/,
      'funcarg': {
        pattern: /[^,)]*(,\s*|$)/,
        inside: {
          'boolean': Prism.languages.js['boolean'],
          'number': Prism.languages.js['number'],
          'string': Prism.languages.js['string'],
          'annotation': {
            pattern: /\??:\s*\w+/,
            inside: {
              'type': /\w+/,
            }
          },
          'keyword': Prism.languages.js['keyword'],
          'equals': /=/,
          'argname': /[\w]+/,
        }
      }
    }
  },
  'funcreturn': {
    pattern: /\).*$/,
    greedy: true,
    inside: {
      'parenthesis': /\)/,
      'return': /:/,
      'type': /\w+/,
    }
  }
};


// js class signature highlighter
Prism.languages.js_class = {
  ...Prism.languages.js_function,
  'funcname': /[\w]+(?=\(| extends)/,
  'funcreturn': {
    pattern: /(\)|extends).*$/,
    greedy: true,
    inside: {
      'parenthesis': /\)/,
      'keyword': /extends/,
      'type': /\w+/,
    }
  }
};
