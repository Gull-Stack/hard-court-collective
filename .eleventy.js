const { DateTime } = require("luxon");
const htmlmin = require("html-minifier-terser");

module.exports = function(eleventyConfig) {
  // HTML minification transform
  eleventyConfig.addTransform("htmlmin", async function(content) {
    if ((this.page.outputPath || "").endsWith(".html")) {
      return await htmlmin.minify(content, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeRedundantAttributes: true
      });
    }
    return content;
  });
  // Pass through static assets
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  
  // Date filters
  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd LLL yyyy");
  });
  
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });
  
  // Current year for copyright
  eleventyConfig.addFilter("currentYear", () => {
    return new Date().getFullYear();
  });
  
  // Watch for changes in these directories during development
  eleventyConfig.addWatchTarget("src/assets/css/");
  eleventyConfig.addWatchTarget("src/assets/js/");
  
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || ""
  };
};