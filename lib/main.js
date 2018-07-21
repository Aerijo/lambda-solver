/*

file -> parse -> syntax trees -> evaluate -> return results

*/

const Parser = require("tree-sitter");
const Lambda = require("tree-sitter-lambda");

const LambdaModule = require("./lambda-module.js");

function main() {
  const parser = new Parser();
  parser.setLanguage(Lambda);

  const options = process.argv.slice(2);

  options.forEach(text => {
    text = text + "\n";
    const tree = parser.parse(text);
    if (tree.rootNode.hasError()) { console.error("ERROR"); return; }
    new LambdaModule(tree.rootNode, text);
  });


}

function parse(text, parser) {
  text = text + "\n";
  const tree = parser.parse(text);
  return tree.rootNode.toString();
}




main();
