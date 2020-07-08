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

const fs = require('fs');
const parseCsv = require('csv-parse/lib/sync');
const stringifyCsv = require('csv-stringify/lib/sync')
const DataFrame = require('dataframe-js').DataFrame
const log = require('loglevel').getLogger('report-utils')
const constants = require('../helpers/constants')

const ID_COL = 'Test Case ID'

function getIdFromSuite(value) {
    let id = value.match(/^.{28}([\w\d\_\-\/\,\.]*)\..*/)
    return id ? id[1] : null
}
exports.getIdFromSuite = getIdFromSuite
function getPattern(value) {
    if (!value) value = ''
    
    let id = value.match(/^([\w\d\_\-\/\,\.]+)\..*/)
    return id ? id[1] : null
}
exports.getPattern = getPattern
function parsePattern(str, toFull = true) {
    let match = str.match(/(.*_)([\d\.]+[\-\/\,].+)/);
    
    let a = 1
    if (match != null) {
        let groups = []
        let grouped = match[2].split(',')
        grouped.forEach(group => {
            
            let separated = group.split('/')
            if (separated.length > 1) {
                groups.push(separated.map(r => match[1] + r))
                return
            }

            let ranged = group.split('-').map(v => Number(v)) // convert to number
            let ids = []
            const diff = ranged[0].toString().includes('.') ? 0.1 : 1
            const toFixed = ranged[0].toString().includes('.') ? 1 : 0
            for (let i = ranged[0]; i <= (ranged[1] || ranged[0]); i = Number(Number(i) + diff).toFixed(toFixed)) {
                ids.push(match[1] + i)
            }
            groups.push(ids)
        });
        return groups
    }
    return [[str]]
}
exports.parsePattern = parsePattern

function getReportPattern(parent, title) {
    let id = getPattern(title)

    if (id == null) {
        return getIdFromSuite(parent)
    }
    return id
}
exports.getReportPattern = getReportPattern

function getAllureResults(filepath) {
    if (!filepath) {
        log.info('Please, define source file with results');
        return;
    }
    if (!fs.existsSync(filepath)) {
        log.info(`File "${filepath}" doesn't exist`);
        return;
    }
    const obj = parseCsv(fs.readFileSync(filepath), {
        columns: true,
    });
    return obj
}
exports.getAllureResults = getAllureResults

function parse(obj, alreadyParsed = false) {
    let obj1 = [];

    // extract pattern
    obj.map((row, index) => {
        row['id'] = getReportPattern(row.Suite, row.Name)
        
        if (!row.id) {
            log.error('parsing allure csv:', `ID not extracted neither from Name nor Suite at row "${index}": "${row.Suite}":"${row.Name}"`);
        }
        
        let browser = constants.browsersMap[row.Suite.substr(11, 2)];
        if (!browser) {
            log.error('parsing allure csv:', `Browser not defined for row "${index}"`);
            return
        }
        row['browser'] = browser;
        obj1.push(row);
    });

    // extract ids from pattern 
    let obj2 = [];
    obj1.map(row => {
        if (row.id == undefined) {
            return
        }

        let groups

        if (alreadyParsed) {
            let group = row.id.split(',')
            groups = [group]
        } else {
            groups = parsePattern(row.id)
        }

        groups.map(group => {
            group.map(id => {
                let rowCopy = Object.assign({}, row)
                rowCopy.id = id
                obj2.push(rowCopy)
            })
        })
        
    });

    // group by id and count statuses by a browser ("status": {browser: [], statuses: []}])
    let df = new DataFrame(obj2);
    const dfg = df.groupBy('Suite', 'Name','id','browser')
    df = dfg.aggregate(group => group.tail(1).getRow(0).get('Status')).rename('aggregation', 'Status')
    var grouped = df.groupBy('id').aggregate(g => {
        return g.groupBy('browser').aggregate(gg => {
            let statuses = gg.groupBy('Status').aggregate(f => f.count()).rename('aggregation', 'statusCount').toDict().Status;
            if (statuses.length == 1) {
                return statuses[0]
            } else if (statuses.includes('failed')) {
                return 'failed';
            } else if (statuses.includes('broken')) {
                return 'broken'
            } else if (statuses.includes('skipped')) {
                return 'skipped'
            } else {
                return 'failed'
            }
        }).rename('aggregation', 'status').toDict();
    }).rename('aggregation', 'status');
    return grouped;
}
exports.parse = parse;

function update(manualFilepath, parsed, updateNotStartedOnly = true) {
    if (!manualFilepath) {
        log.info('Please, define target file with results');
        return;
    }
    if (!fs.existsSync(manualFilepath)) {
        log.error(`The Manual csv "${manualFilepath}" doesn't exist`);
        return;
    }
    const idCol = ID_COL;
    parsed = parsed.rename('id', idCol);
    const browsersMap = {
        'chrome': 'Actual result in Chrome',
        'firefox': 'Actual result in Firefox',
        'MicrosoftEdge': 'Actual result in EDGE',
        'internet explorer': 'Actual result in IE11',
    };
    const statusMap = {
        'passed': 'Passed',
        'failed': 'Failed'
    };
    const obj = parseCsv(fs.readFileSync(manualFilepath), {
        columns: true,
    });
    var df = new DataFrame(obj);
    // Fill empty cells
    let i = 0;
    df = df.map(r => {
        if (r.get(idCol) == '') {
            r = r.set(idCol, i);
            i += 1;
        }
        return r;
    });
    // Check for duplicates
    const uniqueDf = df.groupBy(idCol).aggregate(g => g.count()).rename('aggregation', 'count');
    const duplicatesDf = uniqueDf.filter(r => r.get('count') > 1);
    if (duplicatesDf.count() > 0) {
        console.log(`Duplecated id(s) found "${duplicatesDf.select(idCol).toArray()}"`);
        return;
    }
    let joined = df.leftJoin(parsed, idCol);
    joined = joined.map(r => {
        const status = r.get('status');
        if (status) {
            status.browser.map((browser, i) => {
                const browserCol = browsersMap[browser];
                if (updateNotStartedOnly && r.get(browserCol) != 'Not started') {
                    return;
                }
                r = r.set(browserCol, statusMap[status.status[i]]);
            });
        }
        return r;
    });

    return joined
}
exports.update = update;

// class ResultsCsv

class ManualCsv {
    constructor(manualFilepath) {
        this.filepath = manualFilepath
        this.indexesMap = {}
        this.caseStatuses = {}
        
        if (!manualFilepath) {
            log.info('Please, define target file with results')
            return
        }
        if (!fs.existsSync(manualFilepath)) {
            log.error(`The Manual csv "${manualFilepath}" doesn't exist`)
            return
        }
    
        const idCol = ID_COL
        // parsed = parsed.rename('id', idCol)
        this.browsersMap = {
            'chrome': 'Actual result in Chrome',
            'firefox': 'Actual result in Firefox',
            'MicrosoftEdge': 'Actual result in EDGE',
            'internet explorer': 'Actual result in IE11',
        }
        this.automatedMap = {
            'chrome': 'Automated in Chrome',
            'firefox': 'Automated in Firefox',
            'MicrosoftEdge': 'Automated in EDGE',
            'internet explorer': 'Automated in IE11',
        }
        this.columnsMap = {
            'isStep': 'Service Column',
            'func': 'Func',
            'wfRelated': "Actual result for Workflow Related TC's",
            'release': 'Release',
        }
        const statusMap = {
            'passed': 'Passed',
            'failed': 'Failed'
        }
        
        const obj = parseCsv(fs.readFileSync(manualFilepath), {
            columns: true,
            delimiter: ',',
        })
    
        var df = new DataFrame(obj)
        
        // Fill empty cells
        let uid = 0

        this.df = df.map((r,index) => {
            r = r.set('index', index + 2)
            r = r.set('dfIndex', index)

            if (r.get(idCol) == '') {
                r = r.set(idCol, uid)
                uid += 1
            }

            this.indexesMap[r.get(idCol)] = index
            return r
        })
    
        // Check for duplicates
        const uniqueDf = this.df.groupBy(idCol).aggregate(g => g.count()).rename('aggregation', 'count')
        const duplicatesDf = uniqueDf.filter(r => r.get('count') > 1)
    
        if (duplicatesDf.count() > 0) {
            log.warn(`Duplicated id(s) found "${duplicatesDf.select(idCol).toArray()}"`)
            return
        }
    }

    getTestRow(testId) {
        return this.df.find({[ID_COL]: testId}) || null
    }

    // getTestFailedBy(testId) {
    //     return this.getTestRow(testId).get('Failed by')
    // }
    
    // getTestBlockedBy(testId) {
    //     return this.df.find({[ID_COL]: testId}).get('Blocked by')
    // }
    
    // getTestComment(testId) {
    //     return this.df.find({[ID_COL]: testId}).get('Failed by')
    // }

    getStatuses() {
        let out = {}
        this.df.map(row => {
            let obj = row.toDict()
            let out_row = {'isStep': obj[this.columnsMap['isStep']]}
            for (const [key,value] of Object.entries(this.browsersMap)) {
                out_row[key] = obj[value]
            }
            out[obj[ID_COL]] = out_row
        })
        
        return out
    }

    passTestAtRow(index, browser) {
        this.df = this.df.setRow(index, row => row.set(this.browsersMap[browser], 'Passed'))
    }

    failTestAtRow(index, browser) {
        this.df = this.df.setRow(index, row => row.set(this.browsersMap[browser], 'Failed'))
    }

    passTest(id, browser) {
        let status = this.caseStatuses[id]

        if (status === undefined) {
            this.passTestAtRow(this.indexesMap[id], browser)
            this.caseStatuses[id] = 1
        }
    }

    failTest(id, browser) {
        this.failTestAtRow(this.indexesMap[id], browser)
        this.caseStatuses[id] = 0
    }

    save(filepath = this.filepath) {
        if (this.df.listColumns().indexOf('status') != -1) 
            this.df = this.df.drop('status')
        this.df = this.df.drop('index').drop('dfIndex')

        this.df.toCSV(true, filepath)
    }

    updateFromAllureDf(parsedDf) {
        const statusMap = {
            'passed': 'Passed',
            'failed': 'Failed'
        }
        parsedDf = parsedDf.rename('id', ID_COL);
        let joined = this.df.leftJoin(parsedDf, ID_COL);
        
        this.df = joined.map(r => {
            const status = r.get('status');
            
            if (typeof status == "object")  {
                status.browser.map((browser, i) => {
                    const browserCol = this.browsersMap[browser];
                    let targetCol = r.get(this.columnsMap.func) == 'NWF' ? browserCol : this.columnsMap.wfRelated
                    let statusValue = statusMap[status.status[i]]
                    if (
                        (statusValue != 'Passed' && this.automatedMap[browser] != 'Yes') ||
                        Array.from(['N/A','Retired','Passed','Failed', 'Execution Blocked']).indexOf(r.get(targetCol)) != -1) {
                        return
                    }

                    if (statusValue == 'Failed') {
                        statusValue = 'In progress'
                    }

                    r = r.set(targetCol, statusValue);
                    // sheet.setValues({targetCol: statusValue})
                })
            }
            return r
        });
    }

    getObject(parsedDf) {
        let obj = {}
        parsedDf.map(r => {
            const testId = r.get('id')
            const status = r.get('status');
            const rowObj = {
                id: testId,
                status: {},
            }
            
            if (typeof status != "object")  {
                throw `Wrong status property`
            }

            status.browser.map((browser, i) => {
                rowObj.status[browser] = status.status[i]
            })
            
            obj[testId] = rowObj
        })
        return obj
    }
}
exports.ManualCsv = ManualCsv

function swapKeyValues(obj) {
    const out = {}
    for (const [key,value] of Object.entries(obj)) {
        out[value] = key
    }
    return out
}

class RemoteTable {
    constructor (sheet) {
        this.sheet = sheet

        this.colsMap = {
            'chrome': 'Actual result in Chrome',
            'firefox': 'Actual result in Firefox',
            'edge': 'Actual result in EDGE',
            'ie': 'Actual result in IE11',
            'wfRelated': "Actual result for Workflow Related TC's",

            'func': 'Func',
            'isStep': 'Service Column',
            'release': 'Release',

            'blockedBy': 'Blocked by',
            'failedBy': 'Failed by',
            'comment': 'Comments',
        }

        this.statusMap = {
            'not-started': 'Not started',
            'blocked': 'Execution Blocked',
            'in-progress': 'In progress',
            'passed': 'Passed',
            'failed': 'Failed'
        }
    }

    getRow (id) {
        return this.sheet.getValues(id)
    }

    getField (field, id) {
        return this.sheet.getRowValue(id, this.colsMap[field])
    }

    setField (field, value, id) {
        let mapped = this.colsMap[field]
        if (mapped === undefined) throw Error(`not mapped key ${field}`)
        return this.sheet.setValues({[mapped]: value}, id)
    }

    getStatus (browser, id, row = null) {
        if (!row) row = this.getRow(id)
        if (!row) return undefined

        const field = row[this.colsMap.func] == 'NWF' ? browser : 'wfRelated'
        const status = row[this.colsMap[field]]
        return swapKeyValues(this.statusMap)[status]
    }

    setStatus (field, value, id) {
        field = this.getField('func', id) == 'NWF' ? field : 'wfRelated'
        value = this.statusMap[value] || value
        this.setField(field, value, id)
    }

    isAutomatedForBrowser(browser, id, row = null) {
        if (!row) row = this.getRow(id)
        if (!row) return undefined
        const automatedMap = {
            'chrome': 'Automated in Chrome',
            'firefox': 'Automated in Firefox',
            'edge': 'Automated in EDGE',
            'ie': 'Automated in IE11',
        }

        return row[automatedMap[browser]] == 'Yes'
    }

    async save() {
        let time1 = Date.now()
        await this.sheet.save()
        let time2 = Date.now()
        console.log('Saved in', Math.ceil(time2 - time1)/1000, 'seconds');
    }
    
    async updateStatuses(obj) {
        for (const [id, r] of Object.entries(obj)) {
            const statuses = r.status
            const row = this.sheet.getValues(id)
           
            if (typeof statuses == "object")  {
                for(let [browser, status] of Object.entries(statuses)) {
                    if (
                        (status != 'passed' && !this.isAutomatedForBrowser(browser, id, row)) ||
                        Array.from(['not-started', 'in-progress']).indexOf(this.getStatus(browser, id, row)) == -1 
                    ) {
                        continue
                    }


                    if (status == 'failed' || status == 'broken') {
                        status = 'in-progress'
                    } else if (status == 'skipped') {
                        status = 'blocked'
                    }
                    
                    this.setStatus(browser, status, id)
                }
            }
        }
    }
}
exports.RemoteTable = RemoteTable

class AllureCsv {
    constructor(filepath, createIfDont = false) {
        this.filepath = filepath
        this.allure = []

        if (!filepath) {
            log.info('Please, define target file with results')
            return
        }

        if (!fs.existsSync(filepath)) {
            if (createIfDont) {
                fs.writeFileSync(filepath, '')
            } else {
                throw Error(`File not exists "${filepath}"`)
            }
        }

        this.allure = parseCsv(fs.readFileSync(filepath), {
            columns: true,
        })
    }

    isEmpty() {
        return this.allure.length == 0
    }

    addRow(suite, name, status) {
        this.allure.push({
                Suite: suite,
                Name: name,
                Status: status,
            })
    }

    merge(list) {
        this.allure = this.allure.concat(list)
    }

    export() {
        return this.allure
    }

    parse(alreadyParsed = false) {
        return parse(this.allure, alreadyParsed)
    }

    clean() {
        this.allure = []
    }

    save() {
        let data = stringifyCsv(this.allure, { header: true })
        fs.writeFileSync(this.filepath, data)
    }
}
exports.AllureCsv = AllureCsv