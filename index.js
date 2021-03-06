"use strict";
const comments = require("./src/comments");
const version = require("./package.json").version;
const printAstToDoc = require("./src/printer").printAstToDoc;
const printDocToString = require("./src/doc-printer").printDocToString;
const normalizeOptions = require("./src/options").normalize;
const parser = require("./src/parser");
const printDocToDebug = require("./src/doc-debug").printDocToDebug;

function parse(text, opts) {
  if (opts.parser === "flow") {
    return parser.parseWithFlow(text, opts.filename);
  }
  return parser.parseWithBabylon(text);
}

function attachComments(text, ast, opts) {
  if (ast.comments) {
    comments.attach(ast.comments, ast, text);
    ast.comments = [];
  }
  ast.tokens = [];
  opts.originalText = text;
}

function format(text, opts) {
  const ast = parse(text, opts);
  attachComments(text, ast, opts);
  const doc = printAstToDoc(ast, opts);
  const str = printDocToString(doc, opts.printWidth);
  return str;
}

function formatWithShebang(text, opts) {
  if (!text.startsWith("#!")) {
    return format(text, opts);
  }

  const index = text.indexOf("\n");
  const shebang = text.slice(0, index + 1);
  const programText = text.slice(index + 1);
  const nextChar = text.charAt(index + 1);
  const addNewline = nextChar == "\n" || nextChar == "\r";

  return shebang + (addNewline ? "\n" : "") + format(programText, opts);
}

module.exports = {
  format: function(text, opts) {
    return formatWithShebang(text, normalizeOptions(opts));
  },
  version: version,
  __debug: {
    // Doesn't handle shebang for now
    formatDoc: function(doc, opts) {
      opts = normalizeOptions(opts);
      const debug = printDocToDebug(doc);
      const str = format(debug, opts);
      return str;
    },
    printToDoc: function(text, opts) {
      opts = normalizeOptions(opts);
      const ast = parse(text, opts);
      attachComments(text, ast, opts);
      const doc = printAstToDoc(ast, opts);
      return doc;
    },
    printDocToString: function(doc, opts) {
      opts = normalizeOptions(opts);
      const str = printDocToString(doc, opts.printWidth);
      return str;
    }
  }
};
