import {expectOutput} from "./expect-output.mjs";

describe('A single process', function () {
    const expectedOutput = [
        'Starting process "Say hello" 1 run remaining',
        'Say hello (0)>',
        'hello',
        'All processes completed successfully'
    ];
    expectOutput('./test/test-configs/single-process-config.json', expectedOutput, ['']);
});
