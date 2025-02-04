/**
 * @file command config operations
 * @author atom-yang
 */
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const { userHomeDir } = require('../utils/userHomeDir');

const REGISTRY_DEFAULT_OPTIONS = {
  endpoint: '',
  datadir: path.resolve(userHomeDir, 'aelf'),
  password: '', // this is not suggested stored in config file
  account: '' // the public address of aelf wallet, encoded with base58
};

const ENV_RC_KEYS = {
  endpoint: 'AELF_CLI_ENDPOINT',
  datadir: 'AELF_CLI_DATADIR',
  account: 'AELF_CLI_ACCOUNT'
};

const rcHeader = '# THIS IS AN AUTOGENERATED FILE FOR AELF-COMMAND OPTIONS. DO NOT EDIT THIS FILE DIRECTLY.\n\n\n';

class Registry {
  constructor() {
    this.globalConfigLoc = path.resolve(userHomeDir, 'aelf/.aelfrc');
    if (!fs.existsSync(path.resolve(userHomeDir, 'aelf'))) {
      mkdirp.sync(path.resolve(userHomeDir, 'aelf'));
    }
    this.aelfConfig = {};
    this.init();
  }

  static getFileOrNot(file, defaultContent = '') {
    if (fs.existsSync(file)) {
      return fs.readFileSync(file);
    }
    return defaultContent;
  }

  static getFileOrCreate(file) {
    if (fs.existsSync(file)) {
      return fs.readFileSync(file).toString();
    }
    fs.writeFileSync(file, rcHeader);
    return '';
  }

  static loadConfig(content = '') {
    const result = {};
    content
      .split('\n')
      .filter(v => !v.startsWith('#') && v.length > 0)
      .forEach(v => {
        const [key, value] = v.split(' ');
        result[key] = value;
      });
    return result;
  }

  static getConfigFromEnv() {
    const result = {};
    Object.entries(ENV_RC_KEYS).forEach(([key, value]) => {
      if (process.env[value]) {
        result[key] = process.env[value];
      }
    });
    return result;
  }

  /**
   * obj only contains one level field
   * @param {Object} obj
   * @return {string[]} the array of content
   */
  static stringify(obj = {}) {
    let result = Object.entries(obj).map(([key, value]) => `${key} ${value}`);
    result = rcHeader.split('\n').concat(result);
    return result;
  }

  init() {
    const pwdRc = Registry.loadConfig(Registry.getFileOrNot(path.resolve(process.cwd(), '.aelfrc')));
    const globalRc = Registry.loadConfig(Registry.getFileOrCreate(this.globalConfigLoc));
    const envRc = Registry.getConfigFromEnv();
    const rc = {
      ...REGISTRY_DEFAULT_OPTIONS,
      ...envRc,
      ...globalRc,
      ...pwdRc
    };
    this.aelfConfig = rc;
    return rc;
  }

  getOption(key) {
    return this.aelfConfig[key];
  }

  setOption(key, value) {
    this.aelfConfig[key] = value;
  }

  saveOption(key, value, filePath = this.globalConfigLoc) {
    this.aelfConfig[key] = value;
    const rc = Registry.loadConfig(Registry.getFileOrCreate(filePath));
    rc[key] = value;
    return fs.writeFileSync(filePath, `${Registry.stringify(rc).join('\n')}\n`);
  }

  deleteConfig(key, filePath = this.globalConfigLoc) {
    const rc = Registry.loadConfig(Registry.getFileOrCreate(filePath));
    delete rc[key];
    return fs.writeFileSync(filePath, `${Registry.stringify(rc).join('\n')}\n`);
  }

  getFileConfigs(filePath = this.globalConfigLoc) {
    return Registry.loadConfig(Registry.getFileOrCreate(filePath));
  }

  getConfigs() {
    return this.aelfConfig;
  }
}

module.exports = Registry;
