import {expectOutput} from "./expect-output.mjs";

describe('Concurrent processes', function () {
    this.timeout(5000);
    const expectedStdOut = [
        `Starting process "Say hello" 1 run remaining`,
        "Starting process \"Process One\" 1 run remaining",
        "Starting process \"Process Two\" 1 run remaining",
        "Starting process \"Should fail before process two finishes\" 1 run remaining",
        "Say hello (0)>  hello",
        "Process One (1)>  Run successfully for 2secs running",
        "Process Two (2)>  Run successfully for 3secs running",
        "Should fail before process two finishes (3)>  Fail after 2secs running",
        "Process One (1)>  Run successfully for 2secs Is it over already...",
        "Run successfully for 2secs done",
        "Should fail before process two finishes (3)>  Fail after 2secs I don't feel to good...",
        "##teamcity[buildProblem description='Processes failed to run']"
    ];
    const expectedStdErr = [''];
    expectOutput('./test/test-configs/concurrent-config.json', expectedStdOut, expectedStdErr, 1);
});
