// const merge = require('deepmerge')
const { config, capabilities, capabilitiesFromSet, getSingleCapabilitiesAndUpdateSet } = require('./wdio.conf')
const argv = require('yargs').argv

const set = {
    User1: 'edge1',
    User2: 'edge1',
    User3: 'edge1',
    User4: 'edge1',
    PRE_User1: 'chrome',
    PRE_User2: 'chrome',
    PRE_User3: 'chrome',
}

exports.config = config
exports.config.singleCapabilities = getSingleCapabilitiesAndUpdateSet(set)
capabilities.chrome.capabilities['goog:chromeOptions'].args.push('--headless')
exports.config.capabilities = capabilitiesFromSet(set, capabilities)
exports.config.mySet = set

global['ENV'] = argv.env
global['PRE_SET'] = argv.pre_set
global['MAIN_SET'] = argv.main_set