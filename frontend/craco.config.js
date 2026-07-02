const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

// react-scripts 5 does not read postcss.config.js and craco's style.postcss
// injection is unreliable, so we directly patch every postcss-loader instance.
function injectPostcssPlugins(rules) {
  rules.forEach((rule) => {
    if (Array.isArray(rule.oneOf)) {
      injectPostcssPlugins(rule.oneOf);
    }
    if (Array.isArray(rule.use)) {
      rule.use.forEach((u) => {
        if (
          u &&
          u.loader &&
          u.loader.includes('postcss-loader') &&
          u.options &&
          u.options.postcssOptions
        ) {
          const po = u.options.postcssOptions;
          const existing = typeof po.plugins === 'function' ? po.plugins() : po.plugins || [];
          po.plugins = [tailwindcss, autoprefixer, ...existing];
        }
      });
    }
  });
}

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      injectPostcssPlugins(webpackConfig.module.rules);
      return webpackConfig;
    },
  },
};
