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

const { parse, getAllureResults, update } = require("./report-utils")

const args = process.argv.slice(2)

let filepath = args[0]
let manualFilepath = args[1]
let updateNotStartedOnly = args[2] == "false" ? false : true
// filepath = '../Downloads/task8/suites.csv'
// manualFilepath = '../Downloads/task8/manual_real.csv'

let parsed = parse(getAllureResults(filepath))
let joined = update(manualFilepath, parsed, updateNotStartedOnly)
let outputFilepath = manualFilepath.replace('.csv', '_out.csv');
joined.toCSV(true, outputFilepath);
console.log(`Created ${outputFilepath}`);