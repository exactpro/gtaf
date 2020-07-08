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

 const browsersPrefixMap = {
    'chrome': 'Ch',
    'firefox': 'FF',
    'MicrosoftEdge': 'Ed',
    'internet explorer': 'IE'
}
let browsersMap = {}
for (const [browser, pref] of Object.entries(browsersPrefixMap)) {
    browsersMap[pref] = browser
}
exports.browsersPrefixMap = browsersPrefixMap
exports.browsersMap = browsersMap

exports.rolesMap = {
    'User1': 'Tst1',
    'User2': 'Tst2',
    'User4': 'Tst3',
    'User3': 'Tst4'
}