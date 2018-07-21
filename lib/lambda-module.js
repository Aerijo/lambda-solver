const Expression = require("./expression.js");
const Block = require("./block.js");

module.exports = class LambdaModule {
  constructor(tree, text) {
    this.source = text;

    this.expressions = [];
    this.blocks = [];
    this.functions = [];
    this.imports = [];

    this.populateModuleFromTree(tree);
  }

  populateModuleFromTree(tree) {
    let annotations = [];
    tree.children.forEach(node => {
      const type = node.type;
      switch (type) {
        case "expression":
        this.addExpression(node, annotations);
        annotations = [];
        break;
        case "block":
        this.addBlock(node, annotations);
        annotations = [];
        break;
        case "function_definition":
        this.addFunction(node, annotations);
        annotations = [];
        break;
        case "annotation":
        annotations.push(this.getNodeValue(node));
      }
    });
  }

  addExpression(node, annotations) {
    this.expressions.push(new Expression(node, this));
  }

  addBlock(node, annotations) {

  }

  addFunction(node, annotations) {

  }

  getNodeValue(node) {
    return this.source.slice(node.startIndex, node.endIndex);
  }
};
