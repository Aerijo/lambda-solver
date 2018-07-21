global.$ = require("jquery");

// const Treant = require("treant-js").Treant;
const Parser = require("tree-sitter");
const Lambda = require("tree-sitter-lambda");

const LambdaModule = require("./lib/lambda-module.js");
const Expression = require("./lib/expression.js");

const parser = new Parser();

parser.setLanguage(Lambda);
console.log(parser);

const example = "> (\\x -> x) y";
const tree = parser.parse(example).rootNode;

const lambdaModule = new LambdaModule(tree, example);

console.log(lambdaModule);

console.log(lambdaModule.expressions[0].readyNormal);

var my_chart = new Treant(lambdaModule.expressions[0].readyNormal);
