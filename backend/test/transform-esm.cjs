// Jest runs CommonJS; current HTML-parser packages use ESM (Node handles this in production).
const ts = require('typescript');
module.exports = {
  process(sourceText, sourcePath) {
    return { code: ts.transpileModule(sourceText, {
      fileName: sourcePath,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText };
  },
};
