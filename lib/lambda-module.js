const fs = require("fs");

const Expression = require("./expression.js");
const Block = require("./block.js");

const Parser = require("tree-sitter");
const Lambda = require("tree-sitter-lambda");

module.exports = class LambdaModule {
  constructor(text, registry) {
    this.source = text;
    this.registry = registry;

    this.parser = new Parser();
    this.parser.setLanguage(Lambda);

    this.expressions = [];
    this.blocks = [];
    this.functions = new Map();
    this.imports = new Map();

    this.tree = null;

    if (text) {
      this.tree = this.parser.parse(text).rootNode;
      this.populateModuleFromTree(this.tree);
    }
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
    this.blocks.push(new Block(node, this));
  }

  addFunction(node, annotations) {
    const { name, value } = this.getFunctionDefinition(node);

    if (name === null || value === null) {
      console.error("Missing function information!"); return;
    }

    this.functions.set(name, new Expression(value, this));
  }

  addImport(fileName) {
    const file = fs.readFileSync("./resources/logic.lmb", { encoding: "utf-8" });
    const tree = parser.parse(file).rootNode;
    const lambdaModule = new LambdaModule(tree, file);
  }

  getNodeValue(node) {
    return this.source.slice(node.startIndex, node.endIndex);
  }

  getFunctionDefinition(node) {
    let name = null;
    let value = null;

    let i = 0;
    const nodeLength = node.namedChildren.length;

    while (i < nodeLength) {
      const child = node.namedChildren[i];
      if (child.type === "func_identifier") {
        name = this.getNodeValue(child);
        i++;
        break;
      }
      i++;
    }

    while (i < nodeLength) {
      const child = node.namedChildren[i];
      if (child.type === "expression") {
        value = child;
        break;
      }
    }

    return {
      name,
      value
    };
  }

  getFunctionExpansion(funcName) {
    if (this.functions.has(funcName)) {
      return this.functions.get(funcName).parsed;
    } else {
      return this.registry.getFunctionExpansion(funcName, this);
    }
  }
};
