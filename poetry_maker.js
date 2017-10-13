/******************************************************************************
  A javascript program with a cli that gets the code of a webpage and
  creates poetry from its content.

******************************************************************************/
/** constants **/
const request = require('request')         // node module to get the content of a webpage
const prompt = require('prompt')           // node module to ask user questions and respond to them
const colors = require('colors/safe')      // node module to color strings
const clear = require('clear')             // node module to clear console
const cheerio = require('cheerio')         // node module to simulate jQuery through back end JS
const fs = require('fs')                   // node module to do anything related to files.
const menuScreen = [
  '~~~~~~~~~~POETRY GENERATOR~~~~~~~~~~',
  '',
  '',
  'What would you like to do?',
  '    (1):  Create a Poem',
  '    (2):  Add a text file',
  '    (3):  Read random poem',
  '',
  'Enter choice here'
]
// Prompt parameters
const menu = {
  name: 'choice',
  description: colors.red(menuScreen.join('\n')),
  format: /[1-3]{1}/i,
  message: 'Please choose a number from 1 - 3',
  type: 'integer',
  required: true
}

const properties = [
  {
    name: 'fileOrWebsite',
    description: colors.red('Would you like to use a website or a txt file'),
    type: 'string',
    format: /(website|file)/i,
    message: 'Please choose a format to use',
    required: true,
    before: function (value) {
      return (/^website/i).test(value)
    }
  },
  {
    name: 'file',
    description: colors.red('Enter a text file to make a poem from'),
    conform: function (value) {
      return fs.existsSync(process.cwd() + '/txt_files/' + value.split(' ').join('_').toLowerCase() + (value.endsWith('.txt') ? '' : '.txt'))
    },
    ask: function () {
      return !prompt.history('fileOrWebsite').value
    },
    message: 'This file doesn\'t exist in the text_files directory. Please input another one. Existing Files include:\n\n' + fs.readdirSync(process.cwd() + '/txt_files/').join('\n'),
    type: 'string',
    required: true,
    before: function (value) {
      return process.cwd() + '/txt_files/' + value.split(' ').join('_').toLowerCase() + (value.endsWith('.txt') ? '' : '.txt')
    }
  },
  {
    name: 'website',
    description: colors.red('Enter a link to make a poem from'),
    format: 'url',
    message: 'Please input a valid URL',
    ask: function () {
      return prompt.history('fileOrWebsite').value
    },
    type: 'string',
    required: true
  },
  {
    name: 'poemLength',
    description: colors.red('Enter maximum length of your poem'),
    type: 'integer',
    default: 40,
    required: true
  },
  {
    name: 'lineNumber',
    description: colors.red('Enter a specified line length'),
    type: 'integer',
    default: 8,
    required: true
  }
]

const saveProperties = [
  {
    name: 'saveChoice',
    description: colors.red('Would you like to save this poem?'),
    type: 'string',
    pattern: /(yes|no)/i,
    message: 'Please input a yes or no answer',
    required: true,
    before: function (value) {
      return (/^yes/i).test(value)
    }
  },
  {
    name: 'fileName',
    description: colors.red('Enter a file name'),
    type: 'string',
    conform: function (value) {
      return !fs.existsSync(process.cwd() + '/poetry/' + value.split(' ').join('_') + (value.endsWith('.txt') ? '' : '.txt'))
    },
    message: 'File already exists. Please input a new file name.',
    ask: function () {
      return prompt.history('saveChoice').value
    },
    before: function (value) {
      return process.cwd() + '/poetry/' + value.split(' ').join('_') + (value.endsWith('.txt') ? '' : '.txt')
    }
  }
]

const textFileCreation = [
  {
    name: 'txtFileName',
    description: colors.red('Enter a file name'),
    type: 'string',
    conform: function (value) {
      return !fs.existsSync(process.cwd() + '/txt_files/' + value.split(' ').join('_') + (value.endsWith('.txt') ? '' : '.txt'))
    },
    message: 'File already exists. Please input a new file name.',
    before: function (value) {
      return process.cwd() + '/txt_files/' + value.split(' ').join('_') + (value.endsWith('.txt') ? '' : '.txt')
    },
    required: true
  },
  {
    name: 'fileContents',
    description: colors.red('Enter the text you want to have in the file\nPlease remove all paragraph breaks and line breaks from your input'),
    type: 'string',
    required: true
  }
]

/** algorithms **/
function removeElementFromBody ($, element) {
  $(element).each(function () {
    $(this).remove()
  })
}
function checkForRepeatedValue (array, valueToCheck) {
  return array.indexOf(valueToCheck) !== -1
}
function makeRandomizedArray (currentArrayLength, resultArrayLength) {
  for (var finalArray = []; resultArrayLength; --resultArrayLength) {
    var value = Math.floor(Math.random() * currentArrayLength)
    checkForRepeatedValue(finalArray, value) ? finalArray.push(value) : finalArray.push(Math.floor(Math.random() * currentArrayLength))
  }
  return finalArray
}
function createPoem (text, poemLength, lineNumber) {
  var poem = ''
  var word
  // make an array of set length full of randomized non-repeating numbers
  var randomizedWordArray = makeRandomizedArray(text.length, poemLength)
  var k = Math.floor(poemLength / lineNumber)
  for (var i = 0, length = randomizedWordArray.length; i < length; ++i) {
    word = text[randomizedWordArray[i]].split('').map(function (a, b) {
      return (i % k === 0 && b === 0) ? a.toUpperCase() : a
    })
    poem += (i % k === 0 ? '\t' : '') +
          word.join('') +
          ((i !== 0) && (i + 1) % k === 0 ? '\n' : ' ')
  }
  return poem
}

/** implementation of both user interface and program **/
clear()
prompt.message = ''
prompt.delimiter = colors.yellow(':')
prompt.start()
prompt.get(menu, function (error, res) {
  if (error) {
    clear()
    return
  }
  clear()
  switch (res.choice) {
    case 1 :
      prompt.start()
      prompt.get(properties, function (error, res) {
        if (error) {
          clear()
          return
        }
        clear()
        if (res.website) {
          request(res.website, function (error, response, body) {
            // don't run the following code if there is an error
            if (error) return
            var $ = cheerio.load(body, { ignoreWhitespace: true })

            // Create a title for the poem using the title of the webpage
            var title = $('title').text()
            console.log(colors.cyan('A poem generated from ' + title + '\n\n'))

            removeElementFromBody($, 'script')
            var allText = $('body *').text()
                          .replace(/[.,\/#?|!$%\^&\*;:{}=\-_`~()"]|\d+/g, '')
                          .toLowerCase()
                          .split(' ')
                          .filter(Boolean)
            var poemText = createPoem(allText, res.poemLength, res.lineNumber)
            console.log(colors.green(poemText + '\n\n\n\n'))

            // final user prompt
            prompt.start()
            prompt.get(saveProperties, function (error, res) {
              if (error) return
              if (res.saveChoice) {
                fs.openSync(res.fileName, 'w')
                fs.writeFile(res.fileName, 'A poem generated from ' + title + '\n\n' + poemText.replace(/\t+/g, ''))
              }
              clear()
            })
          })
        } else {
          fs.readFile(res.file, function (err, data) {
            if (err) return
            var title = res.file.split('/')[6]
            console.log(colors.cyan('A poem generated from ' + title + '\n\n'))
            var allText = data.toString()
                          .replace(/\r?\n|\r/g, ' ')
                          .replace(/[.,\/#?|!$%\^&\*;:{}=\-_`~()"]|\d+/g, '')
                          .toLowerCase()
                          .split(' ')
                          .filter(Boolean)
            var poemText = createPoem(allText, res.poemLength, res.lineNumber)
            console.log(colors.green(poemText + '\n\n\n\n'))

            // final user prompt
            prompt.start()
            prompt.get(saveProperties, function (error, res) {
              if (error) return
              if (res.saveChoice) {
                fs.openSync(res.fileName, 'w')
                fs.writeFile(res.fileName, 'A poem generated from ' + title + '\n\n' + poemText.replace(/\t+/g, ''))
              }
              clear()
            })
          })
        }
      })
      break
    case 2 :
      prompt.start()
      prompt.get(textFileCreation, function (error, res) {
        if (error) {
          clear()
          return
        }
        fs.openSync(res.txtFileName, 'w')
        fs.writeFile(res.txtFileName, res.fileContents)
        clear()
      })
      break
    case 3 :
      var poems = fs.readdirSync(process.cwd() + '/poetry/')
      poems.shift()
      fs.readFile(process.cwd() + '/poetry/' + poems[Math.floor(Math.random() * poems.length)], function (err, data) {
        if (err) return
        console.log(data.toString() + '\n\n\n\n\n')
      })
      break
  }
})
