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

const NeedToRun = require("./mocha-wrappers-utils");

const P = require('../pages')
var path = require('path');
const numeral = require('numeral')
const fecha = require("fecha")
const { browsersPrefixMap, rolesMap } = require('../helpers/constants')
const math = Math
const { getPattern, parsePattern } = require('../utils/report-utils')
var testOrderId = 1
const specName = global.specName
const config = browser.config
// const scriptName = typeof(specName) == "object" ? specName[0] : specName
const scriptId = path.win32.basename(specName + '_____').substr(0, 8)
const isDebug = config.debug
const debugPrefix = isDebug ? `${fecha.format(new Date(), 'YYYYMMDD_HHmmss')} | ${scriptId}` : `${scriptId}`

let selectedIds = config.mochaOpts.scopeRunSelectedIds
if (selectedIds) {
    selectedIds = selectedIds.map(idPattern => {
        return parsePattern(idPattern)
    })
    selectedIds = [].concat(...[].concat(...selectedIds)) // reduce dimentions
    log.info('scopeRunSelectedIds', config.mochaOpts.scopeRunSelectedIds);
}
const needToRun = new NeedToRun(global['CONFIG'].mochaOpts.scopeRunMode, )

const _describe = (users, text, fn, describeFn, withoutIt = false) => {
    users = typeof(users) == 'string' ? [users] : users
    let ids = undefined
    
    let isObligatory = text.startsWith('!')
    if (isObligatory) text = text.substr(1)

    const isPrecondition = text.startsWith('P_')
    if (isPrecondition) text = text.substr(2)
    isObligatory = isPrecondition

    const idPattern = getPattern(text)

    if (idPattern) {
        ids = parsePattern(idPattern)

        if (ids.length < users.length) {
            if (ids.length == 1) {
                ids = users.map(el => ids[0])
            } else {
                throw Error(`Ids and users.length not mached (users = ${users.length}, ids = ${ids.length})`)
            }
        }
    } else {
        log.warn(`Id not found in "${text}"`)
    }

    function getBrowserRole(businessRole) {
        for (const [browserRole, businessRoles] of Object.entries(config.singleCapabilities)) {
            if (businessRoles.indexOf(businessRole) != -1) {
                return browserRole
            }
        }
        return businessRole
    }
    function isRoleDefined(user) {
        return global.browserSet && global.browserSet.hasOwnProperty(user)
    }

    P.forUsers(users, (user, index) => {
        
        let browserRole = getBrowserRole(user)
        
        if (!isRoleDefined(browserRole)) {
            throw Error(`Browser not defined for role "${browserRole}:${user}"`)
        }
        
        const browserName = global.browserSet[browserRole].capabilities.browserName
        let caseId = `${debugPrefix} | ${browsersPrefixMap[browserName]} | ${numeral(testOrderId).format('000')}`
        testOrderId += 1
        
        let text2 = text
        
        if (ids) {
            if (!ids[index]) {
                log.warn(`Wrong ids for user ${user} in test "${text}"`)
            }
            
            needToRun.addReachedIds(ids[index])
            let isNeedToRun = needToRun.needToRun({
                ids: ids[index], 
                browser: browserName, 
                manualCsv: global.manualCsv, 
                selectedIds,
                runFrom: config.mochaOpts.scopeRunFrom,
                isPrecondition,
            })
            
            if (!isNeedToRun) {
                return
            }

            text2 = text2.replace(getPattern(text), ids[index])
        }
        text2 = text2.replace('{user}', user)
        let suitDescription = `${caseId} | ${rolesMap[user]} | ${text2}`
        describeFn(suitDescription, () => {
            before(() => {
                console.log(`Starting suite: ${suitDescription}`)
             
                if (global['CONFIG'].obligatoryFailed) throw Error('Stopped ' + global['CONFIG'].obligatoryFailed)
                
                global['CONFIG'].obligatory = isObligatory
                P.asUser(user)
            })

            if (withoutIt) {
                it('', () => {
                    fn(user)
                })
            } else {
                fn(user)
            }
        })
    })
}

function setupArgs(args) {
    if (args.length == 2) {
        args.unshift('User1')
    }
    return {users: args[0], text: args[1], fn: args[2]}
}
exports.test = (...args) => {
    let { users, text, fn } = setupArgs(args)
    _describe(users, text, fn, describe, true)
}
exports.testo = (...args) => {
    let { users, text, fn } = setupArgs(args)
    _describe(users, text, fn, describe.only, true)
}
exports.tests = (...args) => {
    let { users, text, fn } = setupArgs(args)
    _describe(users, text, fn, describe.skip, true)
}
exports.describeLr = (users, text, fn) => {
    _describe(users, text, fn, describe)
}
exports.describeLrOnly = (users, text, fn) => {
    _describe(users, text, fn, describe.only)
}
exports.describeLrSkip = (users, text, fn) => {
    _describe(users, text, fn, describe.skip)
}

exports.describeFr = (users, text, fn) => {
    if (!global['FULL_REGRESSION']) return
    _describe(users, text, fn, describe)
}
exports.describeFrOnly = (users, text, fn) => {
    if (!global['FULL_REGRESSION']) return
    _describe(users, text, fn, describe.only)
}
exports.describeFrSkip = (users, text, fn) => {
    if (!global['FULL_REGRESSION']) return
    _describe(users, text, fn, describe.skip)
}