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

function nl2br(str) {
  return str.replace(/\n/g,"<br>");
}
class Form {
    constructor() {
      this.status = $('[name="status"]')
      this.fields = {
        blockedBy: $('[name="blockedBy"]'),
        failedBy: $('[name="failedBy"]'),
        comment: $('[name="comment"]'),
      }
      this.browser = $('[name=browser]')
      this.jira = $('.jira')
      this.jiraModalTitle = $('.modal-title')
      this.jiraModalBody = $('.modal-body')

      this.data = {}
    }
    /**
     * @params {string} field - 'Blocked By', ... 
     * @params {string} value - 'TS-1235', ...
     * @params {string} id - 'TS_10', ...
     */
    setField (field, value) {
      this.fields[field].val(value)
    }
  
    getField (field, id) {
  
    }
  
    getFieldValus (field) {
    }
  
    /**
     * @params {string} status - 'Passed', ... 
     * @params {"chrome" | "firefox" | "edge" | "ie"} browser 
     * @params {string} id - 'TS_10', ...
     */
    setStatus (status) {
      this.status.val([status])
    }
  
    getStatuses () {
  
    }
  
    getBrowser () {
        return this.browser.val()
    }

    setBrowser (value) {
      this.browser.val([value])
    }

    setJira (list) {
      this.data.jira = list
      this.jira.text('')
      list.map(r => {
        this.jira.append($(`<a data-toggle="modal" data-target="#modal1" data-issue="${r.key}">`).text(`${r.key} - ${r.status} - ${r.summary} [${r.resolution}]`))
        this.jira.append($('<br>'))
      })
    }

    setJiraModal (id, obj = {}) {
      obj = this.data.jira.filter(r => r.key == id)[0]
      const table = $('<table>').addClass('table')
      const tbody = $('<tbody>')
      table.append(tbody)

      for (const key in obj) {
        let td1 = $(`<td>`).text(key)
        let td2 = $('<td>')

        if (typeof obj[key] == "object") {
          obj[key].map(r => td2.append($('<p>').html(nl2br(r))))
        } else {
          td2.html(nl2br(obj[key]))
        }
        
        tbody.append($('<tr>').append(td1).append(td2))
      }
      
      this.jiraModalTitle.html($(`<a href="" target=blank>`).text(obj.key))
      this.jiraModalBody.html(table)
    }
  }

  export { Form }