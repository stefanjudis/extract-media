const test = require('ava');
const { tmpdir } = require('os');
const { join } = require('path');
const { spawn } = require('child_process');
const { access } = require('fs').promises;
const { readFileSync } = require('fs');
const { constants: FS_CONSTANTS } = require('fs');

const command = join(__dirname, '..', 'extract-media');
const helpText = readFileSync(join(__dirname, '..', 'help.txt'), 'utf8');

function testMediaExtraction(t, { testFileName, expectedMediaFileName }) {
  return new Promise((resolve, reject) => {
    const currentTmpDir = tmpdir();
    const testFilePath = join(__dirname, 'files', testFileName);
    const extractMedia = spawn(command, [testFilePath, currentTmpDir]);

    const stdoutMsgs = [];
    const stderrMsgs = [];

    extractMedia.stdout.on('data', (data) => stdoutMsgs.push(data));
    extractMedia.stderr.on('data', (data) => stderrMsgs.push(data));
    extractMedia.on('close', async (code) => {
      try {
        if (code !== 0) {
          console.log(`stdout: ${stdoutMsgs.join('\n')}`);
          console.log(`stderr: ${stderrMsgs.join('\n')}`);
          return reject(`extract-media returned status code ${code}`);
        }

        await access(
          `${join(currentTmpDir, expectedMediaFileName)}`,
          FS_CONSTANTS.F_OK
        );
        t.pass();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

function testOutput(t, { commandArguments, expectedOutput, exitCode }) {
  return new Promise((resolve) => {
    const extractMedia = spawn(command, commandArguments);
    const stdoutMsgs = [];
    const stderrMsgs = [];

    extractMedia.stdout.on('data', (data) => stdoutMsgs.push(`${data}`));
    extractMedia.stderr.on('data', (data) => stderrMsgs.push(`${data}`));
    extractMedia.on('close', (code) => {
      t.is(stdoutMsgs.join(''), expectedOutput);
      t.is(stderrMsgs.length, 0);
      t.is(code, exitCode);
      t.pass();
      resolve();
    });
  });
}

test('extract media from .key file with absolute paths', (t) => {
  return testMediaExtraction(t, {
    testFileName: 'test.key',
    expectedMediaFileName: 'pasted-image-8948.png',
  });
});

test('extract media from .docx file with absolute paths', (t) => {
  return testMediaExtraction(t, {
    testFileName: 'test.docx',
    expectedMediaFileName: 'image1.png',
  });
});

test('show log message if file does not include media', (t) => {
  return testOutput(t, {
    commandArguments: [join(__dirname, 'files', 'test-empty.docx')],
    expectedOutput: 'No media found.\n',
    exitCode: 0,
  });
});

test('show help text', (t) => {
  return testOutput(t, {
    commandArguments: ['-h'],
    expectedOutput: helpText,
    exitCode: 1,
  });
});
