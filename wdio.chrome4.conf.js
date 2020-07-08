// const merge = require('deepmerge')
const { config, capabilities, capabilitiesFromSet, getSingleCapabilitiesAndUpdateSet } = require('./wdio.conf')
const argv = require('yargs').argv

const set = {
    User1: 'chrome',
    User2: 'chrome',
    User3: 'chrome',
    User4: 'chrome',
}

exports.config = config

if (argv.headless) {
    exports.config.singleCapabilities = getSingleCapabilitiesAndUpdateSet(set)
    capabilities.chrome.capabilities['goog:chromeOptions'].args.push('--headless')
}
exports.config.capabilities = capabilitiesFromSet(set, capabilities)
exports.config.mySet = set

global['ENV'] = argv.env
global['PRE_SET'] = argv.pre_set
global['MAIN_SET'] = argv.main_set