/**
 * @file get block height
 * @author atom-yang
 */
const Schema = require('async-validator/dist-node/index').default;
const BaseSubCommand = require('./baseSubCommand');
const {
  configCommandParameters,
  configCommandUsage,
  commonGlobalOptionValidatorDesc
} = require('../utils/constants');

const configCommandValidatorDesc = {
  ...commonGlobalOptionValidatorDesc,
  endpoint: {
    ...commonGlobalOptionValidatorDesc.endpoint,
    required: false
  }
};

class ConfigCommand extends BaseSubCommand {
  constructor(
    rc
  ) {
    super(
      'config',
      configCommandParameters,
      'get, set, delete or list aelf-command config',
      [],
      configCommandUsage,
      rc,
      configCommandValidatorDesc
    );
  }

  async validateParameters(rule, parameters) {
    const validator = new Schema(rule);
    try {
      await validator.validate(parameters);
    } catch (e) {
      this.handleUniOptionsError(e);
    }
  }

  handleList(content) {
    return Object.entries(content).filter(([, value]) => {
      if (value === '' || value === undefined || value === null) {
        return false;
      }
      return true;
    }).map(([key, value]) => `${key}=${value}\n`).join('');
  }

  async run(commander, ...args) {
    this.setCustomPrompts(true);
    const {
      subOptions
    } = await super.run(commander, ...args);
    // todo: specified which .aelfrc file to read or write
    const {
      flag,
      key,
      value
    } = subOptions;
    try {
      await this.validateParameters({
        flag: {
          type: 'enum',
          enum: ['set', 'get', 'delete', 'list'],
          required: true,
          message: 'Flag must one of set, get, list, delete'
        },
        key: {
          type: 'string',
          required: ['get', 'set', 'delete'].includes(flag),
          message: 'You need to enter the <key>'
        },
        value: {
          type: 'string',
          required: flag === 'set',
          message: 'You need to enter the <value> for config set'
        }
      }, subOptions);
      let result = null;
      switch (flag) {
        case 'get':
          result = this.rc.getOption(key);
          console.log(result);
          break;
        case 'set':
          this.rc.saveOption(key, value);
          this.oraInstance.succeed('Succeed!');
          break;
        case 'list':
          result = this.rc.getFileConfigs();
          console.log(`\n${this.handleList(result)}`);
          break;
        case 'delete':
          result = this.rc.deleteConfig(key);
          this.oraInstance.succeed('Succeed!');
          break;
        default:
          throw new Error(`${flag} is not a valid flag, must one of set, get, list, delete`);
      }
    } catch (e) {
      this.oraInstance.fail('Failed!');
      console.log(e);
    }
  }
}

module.exports = ConfigCommand;
