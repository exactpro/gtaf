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

import { Form } from './form.class.js'

let Status = {
  server: 0,
  remote: 0,
  message: ''
}

function sendForm(e, sync) {
  e.preventDefault();
  console.log('sent', form.serialize());
  
  statusMessage.text(saving)
  $.post(form.attr("action"), form.serialize(), (data) => {
    Status = data.requestStatus
    statusMessage.text(Status.remote != 1 ? saving : saved)
    updateForm(data)
    console.log('res', data);
  }, "json").fail((e) => {
    console.error(e);
  })
}

function updateForm(data) {
  formApi.setStatus(data.status)
  for (const [field, value] of Object.entries(data.fields)) {
    formApi.setField(field, value)
  }
  formApi.setJira(data.jira)
}

const statusMessage = $('#update-status')
const saving = 'Status: Saving';
const saved = 'Status: Saved';

const form = $("#form")
const formApi = new Form()

// get test ID
const urlParams = new URLSearchParams(window.location.href)
const testId = urlParams.get('test_id')
const browser = urlParams.get('browser')

$('.title').text(`Test: ${testId}`)
$('#test-id').val(testId)
formApi.setBrowser(browser)
// formApi.setId(testId)

$.get(`/api/all-data/${testId}/${browser}`, $(this).serialize(), (data) => {
    console.log('got all-data', data);
    updateForm(data)
  }
).fail((e) => {
  console.log(e);
})

form.change(function(e) {
  sendForm(e)
})

form.submit(function(e) {
  sendForm(e, true);
})

$('#modal1').on('show.bs.modal', function (event) {
  var button = $(event.relatedTarget) // Button that triggered the modal
  var issue = button.data('issue') // Extract info from data-* attributes
  formApi.setJiraModal(issue)
  // $.post('/api/jira/' + issue, (data) => {
  // }).fail(e => {
  //   console.error(e);
  // })
  // var modal = $(this)
  // modal.find('.modal-title').text('New message to ' + recipient)
  // modal.find('.modal-body').text(recipient)
})