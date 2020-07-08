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

const serialize = require('serialize-javascript')
const fs = require('fs')

class Serialize {
    constructor (filename) {
        this.serializedFilename = filename
    }

    serialize(props) {
        fs.writeFileSync(this.serializedFilename, serialize(props))
    }

    deserialize(){
        if (!fs.existsSync(this.serializedFilename)) {
            return {}
        }
        return eval('(' + fs.readFileSync(this.serializedFilename) + ')');
    }
    
    clean() {
        this.serialize({})
    }
}
module.exports = Serialize