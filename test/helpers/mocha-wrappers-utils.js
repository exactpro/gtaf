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

let log = require('loglevel').getLogger('NeedToRun')

class NeedToRun {
    constructor(mode, from = undefined) {
        this.mode = mode
        this.reachedIds = []
        this.from = from
    }
    needToRun({ 
        ids, 
        browser, 
        manualCsv, 
        selectedIds = undefined, 
        runFrom = this.from, 
        isPrecondition,
        failedValues = ['In progress','Not started'] 
    }) {
        const runFromTriggered = runFrom && this.reachedIds.indexOf(runFrom) != -1;
        const manualTableIds = manualCsv.getStatuses()
        failedValues = failedValues.map(el => el.toLowerCase())
        
        if (runFrom && !runFromTriggered) {
            return false;
        }

        if (typeof ids != "object") {
            ids = [ids]
        }

        if (this.mode == 'failed') {
            if (!manualTableIds) {
                throw Error(`manualTableIds not defined`)
            }
            for (const id of ids) {
                const manualRow = manualTableIds[id]

                if (!manualRow) {
                    log.warn(`No id in manualTable: ${id}`)
                }
                if (manualRow && failedValues.indexOf(manualRow[browser].toLowerCase()) != -1) {
                    return true;
                }
            }
        }
        else if (this.mode == "selected") {
            if (!selectedIds) {
                throw Error(`selectedIds not defined`)
            }

            for (const id of ids) {
                if (selectedIds.indexOf(id) != -1) {
                    return true;
                }
            }
            
            let allSelectedDone = 0
            for (const id of selectedIds) {
                if (this.reachedIds.indexOf(id) != -1) {
                    allSelectedDone++;
                }
            }
            
            if (allSelectedDone == selectedIds.length) {
                return false
            }
        }
        else {
            return true;
        }

        if (isPrecondition) {
            return true;
        }

        return false;
    }

    addReachedIds(ids) {
        if (typeof ids != "object") {
            ids = [ids]
        }
        this.reachedIds.push(...ids)
    }

    getMode() {
        return this.mode
    }
}
module.exports = NeedToRun;
