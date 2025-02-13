import {execa} from "execa";
import assert from "assert";

export function expectOutput(testConfigPath, expectedStdOut, expectedStdErr, expectedExitCode = 0) {
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
        checkSubstringsOrder(stdout, expectedStdOut);
        if (!!expectedStdErr) {
            checkSubstringsOrder(stderr, expectedStdErr);
        }
        assert.equal(exitCode, expectedExitCode);
    });
}

function checkSubstringsOrder(str, substrings) {
    let currentIndex = 0;

    for (const substring of substrings) {
        currentIndex = str.indexOf(substring, currentIndex);
        if (currentIndex === -1) {
            assert.fail(`Substring not found: ${substring}\nin the string:\n${str}`);
        }
        currentIndex += substring.length;
    }
}
