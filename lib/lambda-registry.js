const fs = require("fs");
const path = require("path");

const lambdaModule = require("./lambda-module.js");

module.exports = class LambdaRegistry {
  constructor() {
    this.modules = [];
    this.modulesPath = "./resources";
    this.dummyModule = new lambdaModule(null, this);
  }

  addModule(moduleName) {
    moduleName += ".lmb";
    const location = path.resolve(this.modulesPath, moduleName);

    let file;
    try {
      file = fs.readFileSync(location, { encoding: "utf-8" });
    } catch (e) {
      console.error(e);
      return;
    }

    const lambdaModule = new LambdaModule(file, this);
    if (lambdaModule.tree.hasError()) {
      console.error("Could not parse module", moduleName);
      return;
    }

    this.modules.push(lambdaModule);
  }

  getFunctionExpansion(funcName, askingModule) {
    let endIndex = this.modules.indexOf(askingModule);
    if (endIndex < 0) { endIndex = this.modules.length - 1; }

    for (let i = endIndex; i >= 0; i--) {
      const lambdaModule = this.modules[i];
      if (lambdaModule.functions.has(funcName)) {
        return lambdaModule.functions.get(funcName).parsed;
      }
    }

    return null;
  }
};
