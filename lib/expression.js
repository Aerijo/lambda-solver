const util = require("util");
const inspect = tree => util.inspect(tree, { colors: true, depth: Infinity });
const fs = require("fs");

module.exports = class Expression {
  constructor(node, lambdaModule, source) {
    this.source = lambdaModule.source || source;
    this.lambdaModule = lambdaModule;

    this.parsed = this.buildExpressionNodes(node);

    this.next = this.parsed;
    this.normal = this.parsed;
  }

  getFunctionExpansion(funcName) {
    return this.lambdaModule.getFunctionExpansion(funcName);
  }

  toString(type="next") {
    let tree;
    switch (type) {
      case "input":
      tree = this.parsed;
      break;
      case "normal":
      tree = this.normal;
      break;
      default:
      tree = this.next;
    }

    if (!tree) { return null; }

    return stringify(tree);
  }

  getParsed() {
    return this.toTreantTree(this.parsed);
  }

  getNext() {
    let future = this.reduceTree(this.next);
    if (future === null) { return null; }

    this.next = future;
    return this.toTreantTree(this.next);
  }

  getNormal() {
    let finished = false;
    for (let i = 0; i < 500; i++) {
      let future = this.reduceTree(this.normal);
      if (future === null) {
        finished = true;
        console.log(`Finished in ${i} steps`);
        break;
      }
      this.normal = future;
    }

    if (!finished) {
      alert("Did not finish; too many steps\nTry again to continue");
      console.error("Too many steps");
    }

    return this.toTreantTree(this.normal);
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
      body: body, // already built
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
        value: this.getNodeValue(node)
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

  toTreantTree(tree) {
    let name = "<expression>";

    return {
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
        children: [treantify(tree)]
      }
    };
  }

  reduceTree(tree) {
    if (tree === null) { console.log("is null"); return null; }
    let reduce = true;

    const reduceNode = (node) => {
      switch (node.type) {
          case "apply":
          if (reduce) {

            if (node.body.type === "func_identifier") {
              const name = node.body.value;
              const expansion = this.getFunctionExpansion(name);
              if (expansion === null) {
                console.error("Undefined function", name);
              } else {
                reduce = false;
                node.body = expansion;
              }
            }

            if (reduce && node.body.type === "function") {
              reduce = false;
              const newValue = applyReduction(node);
              return newValue;
            }

          }
          return {
            type: "apply",
            body: reduceNode(node.body),
            variable: reduceNode(node.variable)
          };
          case "function":
          return {
            type: "function",
            bound: { value: node.bound.value },
            body: reduceNode(node.body)
          };
          case "func_identifier":
          return {
            type: node.type,
            value: node.value
          };
          default:
          return {
            type: node.type,
            value: node.value
          };
        }
      };

    const reduced = reduceNode(tree);
    return reduce ? null : reduced;
  }
};



function applyReduction(applyNode) {
  const value = applyNode.variable;
  const functionNode = applyNode.body;
  const boundValue = functionNode.bound.value;

  function replaceValues(node) {
    switch (node.type) {
      case "function":
      if (node.bound.value === boundValue) { return node; }
      return {
        type: "function",
        bound: { value: node.bound.value },
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
      if (node.value === boundValue) {
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
  return replaced;
}





function treantify(expNode, depth=0) {
  if (depth > 20) { return { text: { name: "..." } }; }
  depth += 1;
  switch (expNode.type) {
    case "apply":
    return {
      text: { name: "apply" },
      children: [
        treantify(expNode.body, depth),
        treantify(expNode.variable, depth)
      ]
    };
    case "function":
    return {
      text: { name: "function" },
      children: [{
        text: { name: expNode.bound.value },
        HTMLclass: "lambda-function-bound"
      }, treantify(expNode.body, depth)],
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
    default:
    return {
      text: { name: expNode.value },
      HTMLclass: "lambda-terminal"
    };
  }
}



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


function stringify(node) {
  switch (node.type) {
    case "function":
    return "\\" + node.bound.value.trim() + " -> " + stringify(node.body).trim();
    case "apply":
    let body = stringify(node.body).trim() + " ";
    let variable = stringify(node.variable).trim() + " ";
    if (node.variable.type === "function" || node.variable.type === "apply") {
      variable = "(" + variable.trim() + ")";
    }
    if (node.body.type === "function") {
      body = "(" + body.trim() + ")";
    }
    return body + variable;
    default:
    return node.value + " ";
  }
}
