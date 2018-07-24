global.$ = require("jquery");

const Parser = require("tree-sitter");
const Lambda = require("tree-sitter-lambda");

const LambdaRegistry = require("./lib/lambda-registry.js");
const LambdaModule = require("./lib/lambda-module.js");
const Expression = require("./lib/expression.js");

const parser = new Parser();
parser.setLanguage(Lambda);

let expression;

const registry = new LambdaRegistry();

registry.addModule("logic");
registry.addModule("SKI");
registry.addModule("church");


function handleInputEvent(e) {
  let text = e.target.value;
  if (e.key !== "Enter") { return; }
  return handleInput(text);
}

function handleInput(text) {
  text = text.trim();

  text = ">" + text + "\n";

  // console.log(text);

  try {
    const tree = parser.parse(text).rootNode.namedChildren[0];
    if (tree.hasError()) { throw "Error"; }

    expression = new Expression(tree, registry.dummyModule, text);

    const parseTree = expression.getParsed();

    new Treant(parseTree);
    document.getElementById("tree-text").innerHTML = expression.toString();

  } catch (error) {
    // console.error(error);
    // document.getElementById("tree-simple").innerHTML = "ERROR";
  }


}

function buildTree(e) {
  if (e.key !== "Enter") { return; }
  try {

    const value = ">" + e.target.value + "\n";
    const tree = parser.parse(value).rootNode.namedChildren[0];

    if (tree.hasError()) { throw "Error"; }

    expression = new Expression(tree);
    const parseTree = expression.getParsed();


    new Treant(parseTree);

    document.getElementById("tree-text").innerHTML = expression.toString();

  } catch (error) {
    console.error(error);
    document.getElementById("tree-simple").innerHTML = "ERROR";
  }
}

function updateTreeStep(e) {
  const tree = expression.getNext();
  if (tree === null) { return; }
  new Treant(tree);
  document.getElementById("tree-text").innerHTML = expression.toString();
}

function updateTreeToNormal(e) {
  try {
    new Treant(expression.getNormal());
    document.getElementById("tree-text").innerHTML = expression.toString("normal");
  } catch (error) {
    console.log("ERROR in evaluation", error);
    document.getElementById("tree-simple").innerHTML = "ERROR2";
    return;
  }
}
