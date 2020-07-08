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

const Login = require('../pages/LGN_Main')
const Pages = require('../pages')
const fecha = require("fecha")
const State = global.State || new (require('../models/State').State)()

const UAT = {
    
}
const PRE_UAT = {
    url: 'https://',
    password: ``,
    
    '1': [
        'login1',
    ]
}
        
const rolesMap = {
    User1: 0,
}

function getUrl(env = global['ENV']) {
    let data = (env == 0) ? PRE_UAT : UAT
    return data.url
}
exports.getUrl = getUrl

const logout = function() {
    Pages.NVGT_Header.logout()
    return this
}
const logoutByLink = function() {
    browser.url(getUrl() + '/logout')
    return this
}
exports.logout = logout
exports.logoutByLink = logoutByLink

const loginAllIfDont = function(users, env, set) {
    users.forEach(user => {
        loginIfDont(user, env, set)
    });
}
const loginIfDont = function (userName, env = 0, set = '1') {
    Pages.Deal.assignRoleToBrowser(userName)
    const title = browser.getTitle()
    console.log('try to log in ', userName, browser.getUrl(), title);
    
    if (!title.includes('exapmple1') && !title.includes('example2')) {
        login(userName, env, set)
        Pages.NVGT_Header.productLogo.waitForExist()
        return true
    }
    return false
}
exports.loginAllIfDont = loginAllIfDont
exports.loginIfDont = loginIfDont

const getRefData = function(userName, env, set) {
    let data = (env == 0) ? PRE_UAT : UAT
    let login = data[set][rolesMap[userName]]
    let password = data[`${set}_password`] ? data[`${set}_password`] : data.password
    let url = data.url
    return { login, password, url }
}
exports.getRefData = getRefData

function loginAndState(login, password) {
    
    return Login.login(login, password)
}
const relogin = function (userName, env = 0, set = '1') {
    const { login, password } = getRefData(userName, env, set)

    if (!login) {
        throw Error(`Unknown userName ${userName}`)
    }
    
    logoutByLink()
    loginAndState(login, password)
}
exports.relogin = relogin

const login = function (userName, env = 0, set = '1') {
    Pages.Deal.assignRoleToBrowser(userName)
    // browser.setWindowSize(1024, 968)
    browser.setWindowSize(1920, 1080)
    const { login, password, url } = getRefData(userName, env, set)

    if (!login) {
        throw Error(`Unknown userName ${userName}`)
    }
    
    browser.url(url)
    loginAndState(login, password)
}
exports.login = login

const loginAll = function(users, env, set) {
    users.forEach(user => {
        login(user, env, set)
    });
}
exports.loginAll = loginAll

const logoutAll = function(users) {
    users.forEach(user => {
        Pages.Deal.assignRoleToBrowser(user)
        Pages.NVGT_Header.logout()
    });
}
exports.logoutAll = logoutAll

exports.getUserEmail = function (user, set = global['MAIN_SET'], env = global['ENV']) {
    let data = (env == 0) ? PRE_UAT : UAT
    return data[set][rolesMap[user]]
}
exports.isEnabled = function (el) {
    return el.getAttribute('disabled') == null
}

exports.formatDate = function (date, format) {
    return fecha.format(date, format).replace(/(\+\d{2})/, '$1:')
}

exports.skipIe = function() {
    if (Pages.Deal.getBrowserName() == 'internet explorer') throw Error(`Skipped for Internet Explorer`)
    return this
}
exports.skipEdge = function() {
    if (Pages.Deal.getBrowserName() == 'MicrosoftEdge') throw Error(`Skipped for MicrosoftEdge`)
    return this
}
exports.skipFirefox = function() {
    if (Pages.Deal.getBrowserName() == 'firefox') throw Error(`Skipped for Firefox`)
    return this
}
exports.skipChrome = function() {
    if (Pages.Deal.getBrowserName() == 'chrome') throw Error(`Skipped for Chrome`)
    return this
}