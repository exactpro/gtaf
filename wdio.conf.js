const os = require('os')
const fs = require('fs')
const path = require('path');
const allure = require('@wdio/allure-reporter').default
const { equalsWithDiff, matchesWithDiff, textToHtml, generateDiffHtml } = require('./test/helpers/diff-plugin')
const Serialize = require('./test/helpers/serialize')
const allureResultsDir = './test/reports/allure-results/'
const seri = new Serialize(allureResultsDir + 'spec-statuses.json')
const { ManualCsv, AllureCsv, parsePattern, getReportPattern } = require('./test/utils/report-utils');
const log = require('loglevel');
const argv = require('yargs').argv

const debug = argv.debug ? true : false
const FR = process.env.FR === '0' ? false : true
const port = argv.port ? argv.port : 4444

const DOWNLOAD_THREAD_DIR = os.type() == 'Windows_NT'
    ? ``
    : ``

/**
 * Browsers capabilities
 */

const chromeCapabilities = {
    browserName: 'chrome',
    'goog:chromeOptions': {
        args: [],
        // prefs: {
        //     "download.default_directory": path.join(__dirname, 'test/reports/'),
        // }
    }
}
const firefoxCapabilities = {
    browserName: 'firefox',
    'moz:firefoxOptions': {
        'prefs': {
            'browser.download.dir': DOWNLOAD_THREAD_DIR,
            'browser.download.folderList': 2,
            'browser.download.manager.showWhenStarting': false,
            'browser.helperApps.alwaysAsk.force': false,
            'browser.helperApps.neverAsk.saveToDisk': 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'browser.download.manager.focusWhenStarting': false,
            'browser.download.manager.useWindow': false,
            'browser.download.manager.showAlertOnComplete': false
        }
    }
}
const ieCapabilities = {
    browserName: 'internet explorer',
    'se:ieOptions': {
        'ie.forceCreateProcessApi': true,
        'ie.browserCommandLineSwitches': '-private'
    }
}
const edgeCapabilities = {
    browserName: 'MicrosoftEdge',
    'ms:inPrivate': true,
}

const capabilities = {
    firefox: { capabilities: firefoxCapabilities },
    ie: { capabilities: ieCapabilities },
    chrome: { capabilities: chromeCapabilities },
    edge: { capabilities: edgeCapabilities },
}

exports.capabilities = capabilities
exports.getSingleCapabilitiesAndUpdateSet = (set) => {
    let out = { 'Single1': [] }
    for (const [role, browserName] of Object.entries(set)) {
        if (browserName.endsWith('1')) {
            out['Single1'].push(role)
            delete set[role]
            set['Single1'] = browserName.substring(0, browserName.length - 1)
        }
    }
    return out
}
exports.capabilitiesFromSet = (set, caps = capabilities) => {
    console.log(caps.chrome);
    
    let out = {}
    let browserSetIndexes = { C: 1, F: 1, E: 1, I: 1 }
    for (const [role, browserName] of Object.entries(set)) {
        if (!capabilities.hasOwnProperty(browserName)) {
            throw Error(`Unknown browser ${browserName}`)
        }
        
        let letter = browserName[0].toUpperCase()
        out[`${letter}${browserSetIndexes[letter]}`] = caps[browserName]
        browserSetIndexes[letter] += 1
    }
    return out
}
exports.config = {
    //
    // ====================
    // Runner Configuration
    // ====================
    //
    // WebdriverIO allows it to run your tests in arbitrary locations (e.g. locally or
    // on a remote machine).
    runner: 'local',
    path: '/wd/hub',

    // execArgv: withCheckpoints ? ['--inspect-brk=127.0.0.1:5859'] : [],
    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // from which `wdio` was called. Notice that, if you are calling `wdio` from an
    // NPM script (see https://docs.npmjs.com/cli/run-script) then the current working
    // directory is where your package.json resides, so `wdio` will be called from there.
    //
    specs: [
        './test/specs/**/*.js'
    ],

    suites: {
    },
    specStatuses: {},

    // Patterns to exclude.
    exclude: [
        // 'path/to/excluded/files'
    ],
    //
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your capabilities you can overwrite the spec and exclude options in
    // order to group specific specs to a specific capability.
    //
    // First, you can define how many instances should be started at the same time. Let's
    // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
    // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
    // files and you set maxInstances to 10, all spec files will get tested at the same time
    // and 30 processes will get spawned. The property handles how many capabilities
    // from the same test should run tests.
    //
    maxInstances: debug ? 1 : 1,
    //
    // If you have trouble getting all important capabilities together, check out the
    // Sauce Labs platform configurator - a great tool to configure your capabilities:
    // https://docs.saucelabs.com/reference/platforms-configurator
    //
    //     capabilities: [{
    //         // maxInstances can get overwritten per capability. So if you have an in-house Selenium
    //         // grid with only 5 firefox instances available you can make sure that not more than
    //         // 5 instances get started at a time.
    //         maxInstances: 5,
    //         //
    //         browserName: 'chrome', 
    //         // If outputDir is provided WebdriverIO can capture driver session logs
    //         // it is possible to configure which logTypes to include/exclude.
    //         // excludeDriverLogs: ['*'], // pass '*' to exclude all driver session logs
    //         // excludeDriverLogs: ['bugreport', 'server'],
    //   }],  // ONE-BROWSER CONFIGURATION

    capabilities: {
        F1: { capabilities: firefoxCapabilities },
        I1: { capabilities: ieCapabilities },
        C1: { capabilities: chromeCapabilities },
        E1: { capabilities: edgeCapabilities },
    },

    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    logLevel: 'warn',
    //
    // Set specific log levels per logger
    // loggers:
    // - webdriver, webdriverio
    // - @wdio/applitools-service, @wdio/browserstack-service, @wdio/devtools-service, @wdio/sauce-service
    // - @wdio/mocha-framework, @wdio/jasmine-framework
    // - @wdio/local-runner, @wdio/lambda-runner
    // - @wdio/sumologic-reporter
    // - @wdio/cli, @wdio/config, @wdio/sync, @wdio/utils
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    // logLevels: {
    //     webdriver: 'info',
    //     '@wdio/applitools-service': 'info'
    // },
    //
    // If you only want to run your tests until a specific amount of tests have failed use
    // bail (default is 0 - don't bail, run all tests).
    bail: 0,
    //
    // Set a base URL in order to shorten url command calls. If your `url` parameter starts
    // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
    // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
    // gets prepended directly.
    baseUrl: 'http://localhost',
    //
    // Default timeout for all waitFor* commands.
    waitforTimeout: debug ? 15000 : 41000,
    waitforTermTimeout: 15000,
    //
    // Default timeout in milliseconds for request
    // if Selenium Grid doesn't send response
    connectionRetryTimeout: 90000,
    //
    // Default request retries count
    connectionRetryCount: 3,
    //
    // Test runner services
    // Services take over a specific job you don't want to take care of. They enhance
    // your test setup with almost no effort. Unlike plugins, they don't add new
    // commands. Instead, they hook themselves up into the test process.
    services: ['selenium-standalone'],
    skipSeleniumInstall: false,
    seleniumInstallArgs: {
        version: '3.141.59',
        drivers: {
            ie: { version: '3.141.59', arch: process.arch },
            chrome: { version: '83.0.4103.39' }, // $(curl -s https://chromedriver.storage.googleapis.com/LATEST_RELEASE)
            firefox: { version: '0.25.0' },
            edge: { useNative: true },
        }
    },
    seleniumArgs: {
        version: '3.141.59',
        drivers: {
          ie: { version: '3.141.59', arch: process.arch },
          chrome: { version: '83.0.4103.39' },
          firefox: { version: '0.25.0' },
          edge: { useNative: true },
        }
    },

    // Framework you want to run your specs with.
    // The following are supported: Mocha, Jasmine, and Cucumber
    // see also: https://webdriver.io/docs/frameworks.html
    //
    // Make sure you have the wdio adapter package for the specific framework installed
    // before running any tests.
    framework: 'mocha',
    //
    // The number of times to retry the entire specfile when it fails as a whole
    // specFileRetries: 1,
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: https://webdriver.io/docs/dot-reporter.html
    reporters: [
        'spec',
        ['allure', {
            outputDir: allureResultsDir,
            disableWebdriverStepsReporting: true,
            disableWebdriverScreenshotsReporting: false,
        }
        ],
    ],


    //
    // Options to be passed to Mocha.
    // See the full list at http://mochajs.org/
    mochaOpts: {
        ui: 'bdd',
        timeout: 60 * 1000 * 25,
        bail: false,
        scopeRunMode: 'all', // (!) be careful using 'failed' in wdio 'watch' mode (in watch mode Passed/Failed statuses are not updated)
        // scopeRunFrom: 'ID_5',
        // scopeRunSelectedIds: ['ID_123'],
    },
    //
    // =====
    // Example vars
    //

    debug: debug,
    singleCapabilities: {},
    // =====
    // Hooks
    // =====
    // WebdriverIO provides several hooks you can use to interfere with the test process in order to enhance
    // it and to build services around it. You can either apply a single function or an array of
    // methods to it. If one of them returns with a promise, WebdriverIO will wait until that promise got
    // resolved to continue.
    /**
     * Gets executed once before all workers get launched.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     */
    onPrepare: function (config, capabilities) {
        // create report dir if didn't
        if (!fs.existsSync(allureResultsDir)) {
            fs.mkdirSync(allureResultsDir)
        }

        seri.clean()
    },
    /**
     * Gets executed just before initialising the webdriver session and test framework. It allows you
     * to manipulate configurations depending on the capability or spec.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that are to be run
     */
    beforeSession: function (config, capabilities, specs) {
        global['CONFIG'] = config
        let specName = path.basename(specs[0], '.js')
        const manualOrigPath = `./test/test-data/test_cases.csv`
        const manualCopyPath = `./test/reports/allure-results/${specName}_test_cases.csv`

        if (!fs.existsSync(manualCopyPath)) {
            fs.copyFileSync(manualOrigPath, manualCopyPath)
        }

        const manualCsv = global['manualCsv'] = new ManualCsv(manualCopyPath)
        const allureCsv = global['allureCsv'] = new AllureCsv(`./test/reports/allure-results/${new Date().getTime() + specName}_allure.csv`, true)

        if (!allureCsv.isEmpty()) {
            manualCsv.updateFromAllureDf(allureCsv.parse())
        }
    },
    /**
     * Gets executed before test execution begins. At this point you can access to all global
     * variables like `browser`. It is the perfect place to define custom commands.
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that are to be run
     */
    before: function (capabilities, specs) {
        global.State = new (require('./test/models/State').State)()
        const chai = require('chai');
        const log = global.log = require('loglevel').getLogger('example')
        global.log.setLevel(global['CONFIG'].logLevel)

        let specStatuses = seri.deserialize()

        // if (global['CONFIG'].mochaOpts.scopeRunMode == 'all' && specStatuses.hasOwnProperty(specs[0]) && specStatuses[specs[0]] != 0) {
        //     global['CONFIG'].mochaOpts.scopeRunMode = 'failed'
        // } 
        console.log('scopeRunMode:', global['CONFIG'].mochaOpts.scopeRunMode);

        global.browserSet = {}
        global.browserSingleSet = {}
        const { setBrowsers } = require('./test/helpers/browser-settings')
        setBrowsers(this.mySet)

        global.specName = specs[0]
        global.runningStopped = false
        global._browser = browser
        global['GLOB_DOWNLOAD_PATH'] = DOWNLOAD_THREAD_DIR
        global['FULL_REGRESSION'] = FR

        global.equals = equalsWithDiff
        global.matches = matchesWithDiff
        global.expect = chai.expect
    },
    /**
     * Runs before a WebdriverIO command gets executed.
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     */
    // beforeCommand: function (commandName, args) {
    // },
    /**
     * Hook that gets executed before the suite starts
     * @param {Object} suite suite details
     */
    // beforeSuite: function (suite) {
    // },
    /**
     * Function to be executed before a test (in Mocha/Jasmine) starts.
     */
    // beforeTest: function (test, context) {
    // },
    /**
     * Hook that gets executed _before_ a hook within the suite starts (e.g. runs before calling
     * beforeEach in Mocha)
     */
    // beforeHook: function (test, context) {
    // },
    /**
     * Hook that gets executed _after_ a hook within the suite starts (e.g. runs after calling
     * afterEach in Mocha)
     */
    afterHook: function (test, context, { error, result, duration, passed }) {
        afterTestInner(test);
    },
    /**
     * Function to be executed after a test (in Mocha/Jasmine).
     */
    afterTest: function (test, context, { error, result, duration, passed }) {
        afterTestInner(test);
    },


    /**
     * Hook that gets executed after the suite has ended
     * @param {Object} suite suite details
     */
    // afterSuite: function (suite) {
    // },
    /**
     * Runs after a WebdriverIO command gets executed
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     * @param {Number} result 0 - command success, 1 - command error
     * @param {Object} error error object if any
     */
    // afterCommand: function (commandName, args, result, error) {
    // },
    /**
     * Gets executed after all tests are done. You still have access to all global variables from
     * the test.
     * @param {Number} result 0 - test pass, 1 - test fail
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    after: function (result, capabilities, specs) {
        State.serialize()
        browser = global._browser

        let specStatuses = seri.deserialize()
        specStatuses[specs[0]] = result
        seri.serialize(specStatuses)

        global['manualCsv'].save()
        global['allureCsv'].save()
    },
    /**
     * Gets executed right after terminating the webdriver session.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    afterSession: function (config, capabilities, specs) {
        // global['manualCsv'].save()
        // global['allureCsv'].save()
    },
    /**
     * Gets executed after all workers got shut down and the process is about to exit. An error
     * thrown in the onComplete hook will result in the test run failing.
     * @param {Object} exitCode 0 - success, 1 - fail
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {<Object>} results object containing test results
     */
    onComplete: function (exitCode, config, capabilities, results) {
        console.log('onComplete', seri.deserialize())
    },
    /**
    * Gets executed when a refresh happens.
    * @param {String} oldSessionId session ID of the old session
    * @param {String} newSessionId session ID of the new session
    */
    //onReload: function(oldSessionId, newSessionId) {
    //}
}

function afterTestInner(test) {
    let description, iframeHtml = ''
    let id

    for (const value of Object.values(global.browserSet)) {
        value.getTitle()
    }
    allure.addFeature(path.win32.basename(test.file));
    allure.addStory(test.parent);
    const parentTitle = debug ? test.parent.substr(18) : test.parent;
    
    const idPattern = getReportPattern(parentTitle, test.title);
    if (idPattern) {
        id = parsePattern(idPattern)[0][0]
    }
    else {
        log.warn(`idPattern not recognized from test ${parentTitle + test.title}`);
    }
    if (id) {
        iframeHtml = 
        `<iframe id="inlineFrameExample"
            title="Inline Frame Example"
            width="100%"
            height="300"
            src="http://localhost:2222/?&test_id=${id}&browser=${getBrowser(browser)}">
        </iframe>`
    }

    if (test.error !== undefined) {
        let img = browser.takeScreenshot();
        
        if (global['CONFIG'].obligatory) {
            global['CONFIG'].obligatoryFailed = 'by broken precondition';
        }

        
        description = `
            ${generateDiffHtml(test.error.actual, test.error.expected)}
            ${iframeHtml}
            <img src="data:image/png;base64,${img}" width="100%">
        `
        allure.addAttachment('actual.html', textToHtml(test.error.actual), 'text/html');
        allure.addAttachment('expected.html', textToHtml(test.error.expected), 'text/html');
        allure.addAttachment('screenshot.png', Buffer.from(img, 'base64'), 'image/png');
    } else {
        if (global['diffPlugin'] && global['diffPlugin'].actual) description = textToHtml(global['diffPlugin'].actual)
        description += iframeHtml
    }
    
    allure.addDescription(description, 'html');
    const status = test.error !== undefined ? 'failed' : 'passed'
    global['allureCsv'].addRow(parentTitle, test.title, status)
}

function getBrowser(browser) {
    const browsersMap = {
        'chrome': 'chrome',
        'firefox': 'firefox',
        'MicrosoftEdge': 'edge',
        'internet explorer': 'ie',
    }
    return browsersMap[browser.capabilities.browserName]
}
