const path = require("path");
const fs = require("fs");

const Parser = require("tree-sitter");
const Lambda = require("tree-sitter-lambda");

const LambdaModule = require("../lib/lambda-module.js");
const Expression = require("../lib/expression.js");

const parser = new Parser();
parser.setLanguage(Lambda);

const file = fs.readFileSync("./resources/logic.lmb", { encoding: "utf-8" });

// fs.readFileSync("./resources/logic.lmb", { encoding: "utf-8" }, (err, data) => {
//   console.log(data);
//   const tree = parser.parse(data).rootNode;
//   const lambdaModule = new LambdaModule(tree, data);
//
//   console.log(lambdaModule);
// });

const tree = parser.parse(file).rootNode;
const lambdaModule = new LambdaModule(tree, file);
console.log(lambdaModule);

module.exports = lambdaModule;
