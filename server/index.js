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

const express = require ('express')
const app = express();
const path = require('path')
const bodyParser = require('body-parser')
const { RemoteTable } = require('../test/utils/report-utils')
const { convertResults } = require('../test/utils/results-run-converter')
const SheetUpdater = require('../test/utils/spreadsheet')

const tableId = ''
const tableTabId = ''
const tableColId = 'Test Case ID'
const sheet = new SheetUpdater(tableTabId, tableColId, tableId);
const remoteTable = new RemoteTable(sheet)

const JiraData = require('../test/utils/jira-data.class')
const jira = new JiraData('./test/test-data/jira_issues.csv')
const runResults = convertResults('./test/reports/allure-results')
let item = jira.getItem('TS-1511')
var queue = require('fastq')(updateRemote, 1)
var num = 0

const Status = {
    // server: 1,
    remote: 0,
    message: ''
}
function isEmptyQueue() {
    return queue.length() == 0
}

function updateRemote(data, cb) {
    const { status, browser, id,
        blockedBy, failedBy, comment } = data

    remoteTable.setStatus(browser, status, id)
    remoteTable.setField('blockedBy', blockedBy, id)
    remoteTable.setField('failedBy', failedBy, id)
    remoteTable.setField('comment', comment, id)
    remoteTable.save().then(() => {
        console.log(data, 'finished');
        cb(null, 1)
    }).catch((e) => {
        cb(e)
    })
}

function getData(id, browser) {
    if (runResults.getItem(id) === undefined) {
        throw Error(`No item with id "${id}"`)
    }
    const data = {}
    data['status'] = remoteTable.getStatus(browser, id)
    data['fields'] = {
        blockedBy: remoteTable.getField('blockedBy', id),
        failedBy: remoteTable.getField('failedBy', id),
        comment: remoteTable.getField('comment', id),
    }
    data['jira'] = []

    const jiraKeys = jira.getKeysFromString(`${data.fields['blockedBy']} ${data.fields['failedBy']} ${data.fields['comment']}`)
    if (jiraKeys.length > 0) {
        data['jira'] = jiraKeys.map(key => jira.getItem(key)).filter(r => r)
    }
    return data
}

const handleData = (req, res, next) => {
    const data = req.body
    console.log(num, 'pushed', data);
    
    queue.push(data, (err, result) => {
        if (err) {
            next(err)
        }

        Status.remote = isEmptyQueue() ? 1 : 0
        res.send(Object.assign(getData(data.id, data.browser), {requestStatus: Status}))
    })
    num++
}

const routeGetAllData = (req, res, next) => {
    try {
        const data = getData(req.params.id, req.params.browser)
        res.send(data)
    } catch (e) {
        console.error(e.stack);
        next(Error(e))
    }
}

const routeGetJiraItem = (req, res, next) => {
    try {
        const data = getJiraData(req.params.id)
        res.send(data)
    } catch (e) {
        console.error(e.stack);
        next(Error(e))
    }
}

app.use(bodyParser.urlencoded({extended: true}));

app.post('/api', handleData)
app.get('/api/all-data/:id/:browser', routeGetAllData)
app.use(express.static(__dirname + '/public'))

app.use(function(err, req, res, next) {
    console.error(err); // Log error message in our server's console
    if (!err.statusCode) err.statusCode = 500; // If err has no specified error code, set error code to 'Internal Server Error (500)'
    res.status(err.statusCode).send(err.message); // All HTTP requests must have a response, so let's send back an error with its status code and message
  });

sheet.getRows().then(async () => {
    remoteTable.updateStatuses(runResults.getItems())
    await remoteTable.save()
    app.listen(2222);
    console.log('server is running')
})
