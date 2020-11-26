const test = require('ava');
const { tmpdir } = require('os');
const { join } = require('path');
const { spawn } = require('child_process');
const { access } = require('fs').promises;
const { readFileSync } = require('fs');
const { constants: FS_CONSTANTS } = require('fs');
const { stderr } = require('process');

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

test('extract media from .key file', (t) => {
  return testMediaExtraction(t, {
    testFileName: 'test.key',
    expectedMediaFileName: 'pasted-image-8948.png',
  });
});

test('extract media from .docx file', (t) => {
  return testMediaExtraction(t, {
    testFileName: 'test.docx',
    expectedMediaFileName: 'image1.png',
  });
});

test('show help text', (t) => {
  return new Promise((resolve, reject) => {
    const extractMedia = spawn(command, ['-h']);
    const stdoutMsgs = [];
    const stderrMsgs = [];

    extractMedia.stdout.on('data', (data) => stdoutMsgs.push(`${data}`));
    extractMedia.stderr.on('data', (data) => stderrMsgs.push(`${data}`));
    extractMedia.on('close', (code) => {
      t.is(stdoutMsgs.join(''), helpText);
      t.is(stderrMsgs.length, 0);
      t.is(code, 1);
      t.pass();
      resolve();
    });
  });
});
