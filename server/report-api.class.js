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

class ReportAPI {
    constructor (runResults, remoteTable) {
        this.runResults = runResults
        this.remoteTable = remoteTable
    }

    getItem(id) {
        return this.runResults.getItem(id)
    }

    getAllData(id) {
        let obj = this.runResults.getItem(id)
        obj['fields'] = {
            blockedBy: this.remoteTable.getField('blockedBy', id),
            failedBy: this.remoteTable.getField('failedBy', id),
            comment: this.remoteTable.getField('comment', id),
        }
        
        return obj
    }

    /**
     * @params {string} field - 'Blocked By', ... 
     * @params {string} value - 'TS-1235', ...
     * @params {string} id - 'TC_10', ...
     */
    updateField (field, value, id) {
        this.remoteTable.setField(field, value, id)
    }

    getField (field, id) {

    }

    getFieldValus (field) {
    }

    /**
     * @params {string} status - 'Passed', ... 
     * @params {"chrome" | "firefox" | "edge" | "ie"} browser 
     * @params {string} id - 'TC_10', ...
     */
    updateBrowserStatus (browser, status, id) {
        this.runResults.setBrowserStatus(browser, status, id)
    }

    getStatuses () {

    }

    getBrowsers () {
        return 'firefox'
    }
}

module.exports = ReportAPI