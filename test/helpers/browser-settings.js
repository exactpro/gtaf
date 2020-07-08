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

exports.setBrowsers = function (set) {
    if (!global.hasOwnProperty('browserSetIndexes')) {
        global.browserSetIndexes = { C: 1, F: 1, E: 1, I: 1 }
    }

    for (const [role, browserName] of Object.entries(set)) {
        log.debug(`Set ${browserName} for ${role}`)
        let letter = browserName[0].toUpperCase()
        let globalName = letter + browserSetIndexes[letter]

        if (!global.hasOwnProperty(globalName))
            throw Error(`Not configured capability "${globalName}" for "${role}"`)

        global.browserSet[role] = global[globalName]
        addCommands(global.browserSet[role])
        browserSetIndexes[letter] += 1
    }
    // State.setLastBrowserSet(set)
}
const addCommands = (browserInstance) => {
    browserInstance.addCommand('scrollIntoView', (el) => {
        let browserName = browser.capabilities.browserName
        
        if (browserName == 'chrome'
                || browserName == 'firefox') {
            el.scrollIntoView({ block: 'center' })
            return el
        }

        el.scrollIntoView()
        browser.execute(function(elem){
            try{
                let doc = document.documentElement
                let scrollTop = (document.documentElement && document.documentElement.scrollTop) || 
                    document.body.scrollTop
                
                if (doc.scrollHeight <= (doc.clientHeight + scrollTop)
                        && elem.getBoundingClientRect().top > 100) { // if scrolled to the end
                   return
                }
                
                window.scrollTo(0, scrollTop - doc.clientHeight/2)
             }
             catch(e){
                console.log(e);
             }
        }, el)
        return el
    })

    browserInstance.addCommand('find', (selector, timeout = 5000) => {
        let browserName = browser.capabilities.browserName

        if (browserName == 'chrome'
                || browserName == 'firefox') {
            return browser.$(selector)
        }

        for (let i = 0, el; i < timeout/1000; i++) {
            try{
                el = browser.$(selector)
            }
            catch(e) {
                if (e.message == 'The specified selector is invalid.') {
                    continue  
                }
            }
            return el // element found
        }
        return browser.$('edge-element-notfound') // return empty el as stub
    })
}