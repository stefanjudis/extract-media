const test = require('ava');
const { tmpdir } = require('os');
const { join } = require('path');
const { spawn } = require('child_process');
const { access } = require('fs/promises');
const { constants: FS_CONSTANTS } = require('fs');

const command = join(__dirname, '..', 'extract-media');

function testCommand(t, testFileName, expectedMediaFileName) {
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

test('.key file', (t) => {
  return testCommand(t, 'test.key', 'pasted-image-8948.png');
});

test('.docx file', (t) => {
  return testCommand(t, 'test.docx', 'image1.png');
});
