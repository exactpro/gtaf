/*
 * Copyright 2019-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const chai = require('chai');
const mochaBase = require('mocha/lib/reporters/base');
const mochaUtils = require('mocha/lib/utils');
var matcher = require("matcher")

const allure = require('@wdio/allure-reporter').default;

const expect = chai.expect;

chai.config.showDiff = true;

function termToHtml(out) {
    let result = '<div style="font-family: monospace;"><span>';
    let buf = '';
    let i = 0;

    function write(str) {
        buf += str;
    }

    function flush() {
        result += buf + '</span>';
        buf = '';
    }

    const colorMap = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'gray'];

    function selColor(color) {
        flush();
        result += `<span style="color: ${colorMap[color - 30]};">`
    }

    while (i < out.length) {
        let char = out[i];
        if (char === '\x1b') {
            let command = '';
            i++;
            while (char !== 'm') {
                char = out[++i];
                command += char;
            }
            const color = +command.replace('m', '');
            selColor(color);
        } else if (char === '\n') {
            write('<br/>');
        } else if (char === ' ') {
            write('\xa0');
        } else {
            write(char);
        }
        i++;
    }

    flush();
    result += '</div>';

    return result;
}

function stringify(val) {
    if (!mochaUtils.isString(val)) {
        val = mochaUtils.stringify(val);
    }
    return val;
}

function generateDiff(actual, expected) {
    return mochaBase.generateDiff(stringify(actual), stringify(expected));
}

function generateDiffHtml(actual, expected) {
    const diff = 'Difference:\n' + generateDiff(actual, expected);
    return termToHtml(diff);
}

function textToHtml(str) {
    return termToHtml(stringify(str))
}

function createActualExpected(ar) {
    if (!Array.isArray(ar) || ar[0].length != 3) {
        throw Error(`Argument "actual" has wrong format (Expected: [[name, actual, expected]], Actual: ${ar})`)
    }
    return {
        actual: ar.map(a => [a[0], a[1]]),
        expected: ar.map(a => [a[0], a[2]]),
    }
}
function equalsWithDiff(actual, expected = null, name = null) {
    if (expected === null) {
        let res = createActualExpected(actual)
        actual = res.actual
        expected = res.expected
    }

    if (typeof actual == 'number') actual = actual.toString()
    if (typeof expected == 'number') expected = expected.toString()

    // allure.startStep(name || 'Equality check');
    // const diffHtml = generateDiffHtml(actual, expected);
    // allure.addAttachment('actual.html', textToHtml(actual), 'text/html');
    // allure.addAttachment('expected.html', textToHtml(expected), 'text/html');
    global['diffPlugin'] = {}
    // global['diffPlugin'].diffHtml = generateDiffHtml(actual, expected);
    global['diffPlugin'].actual = actual
    global['diffPlugin'].expected = expected

    try {
        expect(actual).to.deep.equal(expected);
    }
    catch (e) {
        // allure.addDescription(diffHtml, 'html');
        console.log(name, generateDiff(actual, expected));

        if (name) {
            e.message = `${name}, ${e.message}`;
        }
        throw e
    }
    // allure.endStep();
}

function matchesWithDiff(actual, expected = null, name = null) {
    if (expected === null) {
        let res = createActualExpected(actual)
        actual = res.actual
        expected = res.expected
    }
    
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
        throw Error(`Actual/Expected arguments should have a type of Array but dont (Actual: ${actual}, Expected: ${expected})`)
    }

    if (actual.length == 0 || expected.length == 0) {
        throw Error('There are an empty Actual/Expected value!')
    }

    let abDiff = matcher(actual, expected)
    let newExpected = expected.slice()
    abDiff.map(val => {
        let idx = actual.indexOf(val)
        newExpected[idx] = actual[idx]
    })
    return equalsWithDiff(actual, newExpected, name)
}

module.exports = {
    equalsWithDiff,
    matchesWithDiff,
    generateDiffHtml,
    textToHtml,
}

// console.log(1, matchesWithDiff('abc',''))