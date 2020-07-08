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

const faker = require('faker');
// faker.locale = "pt_BR";

// Personal data
function fakeFirstName() {
  return faker.name.firstName()
}

function fakeLastName() {
  return faker.name.lastName()
}

function fakeStreetName() {
  return faker.address.streetName()
}

function fakeSecondaryAddress() {
  return faker.address.secondaryAddress()
}

function fakeCityName() {
  return faker.address.city()
}

function fakePostalCode() {
  return faker.address.zipCode('#####')
}

function fakePhoneNumber() {
  return faker.phone.phoneNumber()
}

// User auth data
function fakeEmail() {
  return faker.internet.email();
}

function fakePassword() {
  return faker.internet.password()
}

// Company data
function fakeCompanyName() {
  return faker.company.companyName()
}

// Others
function fakeLorem() {
  return faker.lorem.paragraph(2)
}

function fakeNumber(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

class Gen {
    setSeed(seed) {
        faker.seed(seed)
    }
    
    yesNo () {
        return faker.random.number(1) == 1 ? 'yes' : 'no'
    }

    number(min, max) {
        return faker.random.number(max)
    }

    max(num = 0) {
      return this.number(0, num)
    }

    loremWords(num = 2) {
        return faker.lorem.words(num)
    }

    text(length = 10) {
      return faker.random.alphaNumeric(length)
    }

    date() {
        return '13-Dec-2019'
    }
}

module.exports = new Gen()