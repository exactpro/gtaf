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

const path = require('path');
const fs = require('fs')
const { ManualCsv, AllureCsv, RemoteTable } = require('./report-utils')

const manualOrigPath = 'test/test-data/test_cases.csv'
const manualCsv = global['manualCsv'] = new ManualCsv(manualOrigPath)

function convertResults(resultsDir) {
    let results = {}
    const files = fs.readdirSync(resultsDir)
    const specs = files.filter(f => f.match(/_allure.csv/))
    let allureCsv = null
    
    for (const spec of specs) {
        let specName = path.win32.basename(spec, '.js')
        let allureResultsSpec = path.join(resultsDir, specName)
        let currentAllureCsv = new AllureCsv(allureResultsSpec)
        console.log(`Reading ${allureResultsSpec}`);
        
        if (!allureCsv) {
            allureCsv = currentAllureCsv
        } else {
            allureCsv.merge(currentAllureCsv.export())
        }
    }

    if (!allureCsv.isEmpty()) {
        try {
            results = manualCsv.getObject(allureCsv.parse(true))

        } catch (e) {
            throw Error(e.message);
        }
    }
    return new RunResults(results)
}

class RunResults {
    constructor(data = {}) {
        this.data = data
    }
    getItems() {
        return this.data
    }
    addItem(id) {
        this.data[id] = { id }
    }
    getItem(id) {
        if (this.data[id] === undefined) throw Error(`Not found id "${id}"`)
        return this.data[id]
    }
    getBrowserStatuses(id) {
        const item = this.getItem(id)
        if (item.status == undefined) return undefined
        return Object.assign({}, item.status)
    }
    setBrowserStatus(browser, status, id) {
        const item = this.getItem(id)
        if (item.status == undefined) item.status = {}
        this.data[id].status[browser] = status
    }
}

module.exports = {
    convertResults,
    RunResults,
}