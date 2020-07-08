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

const fs = require('fs')
const parseCsv = require('csv-parse/lib/sync')
const log = require('loglevel')

const fieldsMap = {
    'Issue key': 'key',
    'Summary': 'summary',
    'Status': 'status',
    'Description': 'description',
    'Resolution': 'resolution',
    'Comment': 'comment',
}

class JiraData {
    constructor(jiraFilename) {
        this.data = parseCsv(fs.readFileSync(jiraFilename), {
            // columns: true,
        })

        this.map = {}
        this.data[0].map((r,i) => this.map[r] = i)

        // for (const key in fieldsMap) {
        //     if (this.data[0][key] === undefined) throw Error(`Jira source: no "${key}" key`)
        // }
    }

    value(key, r) { return r[this.map[key]] }
    key(i) { return this.data[0][i] }

    getItem(id) {
        const item = {}
        const items = this.data.filter(r => this.value('Issue key', r) == id)
        if (items.length == 0) return undefined

        items[0].map((value, i) => {
            const origKey = this.key(i)
            const key = fieldsMap[origKey]

            if (key === undefined) {
                return
            }

            if (item[key] !== undefined) {

                if (typeof item[key] == "string") {
                    item[key] = [item[key]]
                }

                if (value.trim() != '') {
                    item[key].push(value)
                }
            } else {
                item[key] = value
            }
        })
        return item
    }

    getKeysFromString(str) {
        return str.match(/\w+\-\d+/g) || []
    }
}

module.exports = JiraData