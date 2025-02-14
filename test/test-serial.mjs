import {expectOutput} from "./expect-output.mjs";

describe('Serial processes', function () {
    this.timeout(15000);
    const expectedOutput = [
        'Starting process "Say hello" 1 run remaining',
        'Starting process "Process One" 1 run remaining',
        'Run successfully for 2secs running',
        'Run successfully for 2secs Is it over already...',
        'Run successfully for 2secs done',
        'Starting process "Process Two" 1 run remaining',
        'Run successfully for 3secs running',
        'Run successfully for 3secs hello world...',
        'Run successfully for 3secs I\'m ok',
        'Starting process "Should fail after everything else" 1 run remaining',
        'Fail after 2secs running',
        'Fail after 2secs I don\'t feel to good...'
    ];
    expectOutput('./test/test-configs/serial-config.json', expectedOutput, [''], {expectedExitCode: 1});
});
