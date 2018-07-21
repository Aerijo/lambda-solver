const inspect = tree => require("util").inspect(tree, { colors: true, depth: Infinity });

const fs = require("fs");

class LambdaTree {
  constructor(node) {
    this.sourceRoot = node;

  }
}


module.exports = class Expression {
  constructor(node, lambdaModule) {
    this.source = lambdaModule.source;

    this.parsed = this.buildExpressionNodes(node);

    this.normal;

    let next = reduceTree(this.parsed);
    // next = reduceTree(next);
    // console.log(inspect(next));
    // // this.writeTree(next);

    if (next === null) {
      this.normal = this.parsed;
    } else {
      let normal = next;
      while (true) {
        let future = reduceTree(normal);
        if (future === null) { this.normal = normal; break; }
        normal = future;
      }
    }

    this.writeTree(this.normal);
  }

  buildExpressionNodes(node) {
    const numNodes = node.namedChildren.length;
    if (numNodes === 0) {
      return null;
    } else if (numNodes === 1) {
      return this.buildNode(node.namedChildren[0]);
    }

    let result = null;

    for (let i = 0; i < numNodes; i++) {
      const child = node.namedChildren[i];
      if (result === null) {
        result = this.buildNode(child);
      } else {
        result = this.buildApply(result, child);
      }
    }

    return result;
  }

  buildApply(body, variable) {
    return {
      type: "apply",
      body: body,
      variable: this.buildNode(variable)
    };
  }

  buildNode(node) {
    const type = node.type;
    switch (type) {
      case "identifier":
      case "func_identifier":
      case "string":
      case "integer":
      return {
        type: type,
        value: this.getNodeValue(node),
        // node: node,
      };
      break;
      case "group":
      return this.buildGroup(node);
      case "function":
      return this.buildFunction(node);
      case "line_comment":
      case "block_comment":
      return;
      default:
      console.error(`Unidentified ${node.type} node!`);
      return;
    }
  }

  buildGroup(node) {
    return this.buildExpressionNodes(node);
  }

  buildFunction(node) {
    const { bound, body } = getFunctionNodeContents(node);
    let result = {
      type: "function",
      bound: this.parseBound(bound[bound.length-1]),
      body: this.buildExpressionNodes(body)
    };

    for (let i = bound.length - 2; i >= 0; i--) {
      result = {
        type: "function",
        bound: this.parseBound(bound[i]),
        body: result
      };
    }

    return result;
  }

  parseBound(node) {
    return {
      value: this.getNodeValue(node)
    };
  }

  getNodeValue(node) {
    return this.source.slice(node.startIndex, node.endIndex);
  }

  writeTree(tree) {
    let name = "";
    let trees = [];

    if (Array.isArray(tree)) {
      name = "<result>";
      trees = tree.map(t => treeify(t));
    } else {
      name = "<expression>";
      trees.push(treeify(tree));
    }

    const treeStruc = {
      chart: {
        source: this.source,
        container: "#tree-simple",
        connectors: {
          type: "step",
          style: {
            "arrow-end": "point",
            "stroke-width": 2
          }
        }
      },

      nodeStructure: {
        text: { name },
        children: trees
      }
    };


    fs.writeFile("./web/tree.js", "var my_tree = " + JSON.stringify(treeStruc, null, 2), { encoding: "utf-8" }, () => { console.log("done"); });
  }

};


function getFunctionNodeContents(node) {
  const bound = [];
  let body = null;

  let i = 0;
  const nodeLength = node.children.length;

  while (i < nodeLength) {
    const child = node.children[i];
    if (child.type === "identifier") {
      bound.push(child);
    } else if (child.type === "func_sep") {
      i++;
      break;
    }
    i++;
  }

  while (i < nodeLength) {
    const child = node.children[i];
    if (child.type === "func_body") {
      return {
        bound,
        body: child
      };
    }
    i++;
  }

  return {
    bound,
    body
  };
}

function treeify(expNode) {
  switch (expNode.type) {
    case "apply":
    return {
      text: { name: "apply" },
      children: [treeify(expNode.body), treeify(expNode.variable)]
    };
    case "function":
    return {
      text: { name: "function" },
      children: [{
        text: { name: expNode.bound.value },
        HTMLclass: "lambda-function-bound"
      }, treeify(expNode.body)],
      HTMLclass: "lambda-function"
    };
    case "string":
    return {
      text: { name: expNode.value },
      HTMLclass: "lambda-string"
    };
    case "integer":
    return {
      text: { name: expNode.value },
      HTMLclass: "lambda-integer"
    };
    case "func_identifier":
    return {
      text: { name: expNode.value },
      HTMLclass: "lambda-func_identifier"
    };
    default: return {
      text: { name: expNode.value },
      HTMLclass: "lambda-terminal"
    };
  }
}

function reduceTree(tree) {
  if (tree === null) { console.log("is null"); return null; }
  let reduce = true;

  function reduceNode(node) {
    switch (node.type) {
        case "apply":
        if (reduce && node.body.type === "function") {
          reduce = false;
          const newValue = applyReduction(node);
          return newValue;
        }
        return {
          type: "apply",
          body: reduceNode(node.body),
          variable: reduceNode(node.variable)
        };
        case "function":
        return {
          type: "function",
          bound: node.bound,
          body: reduceNode(node.body)
        };
        default:
        return {
          type: node.type,
          value: node.value
        };
      }
    }

  const reduced = reduceNode(tree);
  return reduce ? null : reduced;
}

function applyReduction(applyNode) {
  // console.log(applyNode);
  const value = applyNode.variable;
  // console.log(value);
  const functionNode = applyNode.body;
  // console.log(functionNode);
  // console.log(functionNode.bound);
  const boundVar = functionNode.bound.value;

  function replaceValues(node) {
    switch (node.type) {
      case "function":
      if (node.bound === boundVar) { return; }
      return {
        type: "function",
        bound: node.bound,
        body: replaceValues(node.body)
      };
      break;
      case "apply":
      return {
        type: "apply",
        body: replaceValues(node.body),
        variable: replaceValues(node.variable)
      };
      break;
      case "identifier":
      if (node.value === boundVar) {
        return value;
      }
      default:
      return {
        type: node.type,
        value: node.value
      };
    }
  }
  const replaced = replaceValues(functionNode.body);
  // console.log(replaced);
  return replaced;
}

function reduce(boundVar, varValue, tree) {
  switch (tree.type) {
    case "function":
    if (tree.bound === boundVar) { return; }
    reduce(boundVar, varValue, tree.body);
    break;
    case "apply":
    reduce(boundVar, varValue, tree.body);
    reduce(boundVar, varValue, tree.variable);
    break;
    case "identifier":
    if (tree.value === boundVar) {
      tree.value = varValue;
    }
  }
}
