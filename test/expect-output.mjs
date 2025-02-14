import {execa} from "execa";
import assert from "assert";
import chalk from "chalk";

export function expectOutput(
    testConfigPath,
    expectedStdOut,
    expectedStdErr,
    options = {
        expectedExitCode: 0,
        checkOrder: true
    }) {

    const {
        expectedExitCode = 0,
        checkOrder = true
    } = options;

    it('should output the correct text', async () => {
        let stdout;
        let stderr;
        let exitCode;
        try {
            ({stdout, stderr, exitCode} = await execa('node', ['./index.mjs', testConfigPath]));
        } catch (e) {
            stdout = e.stdout;
            stderr = e.stderr;
            exitCode = e.exitCode;
        }
        checkOrder ? checkSubstringsOrder(stdout, expectedStdOut) : checkSubstringExists(stdout, expectedStdOut);
        if (!!expectedStdErr) {
            checkOrder ? checkSubstringsOrder(stderr, expectedStdErr) : checkSubstringExists(stdout, expectedStdOut);
        }
        assert.equal(exitCode, expectedExitCode);
    });
}

function checkSubstringExists(str, substrings) {
    for (const substring of substrings) {
        if (!str.includes(substring)) {
            assert.fail(`Substring not found: ${substring}\nWas not found in string:\n${chalk.italic(str)}`);
            break;
        }
    }
}

function checkSubstringsOrder(str, substrings) {
    let currentIndex = 0;

    for (const substring of substrings) {
        currentIndex = str.indexOf(substring, currentIndex);
        if (currentIndex === -1) {
            assert.fail(`Substring not found: ${substring} at index ${currentIndex}\nWas not found in string:\n${chalk.italic(str)}`);
        }
        currentIndex += substring.length;
    }
}
