import { execa } from 'execa';
let execaProcesses = [];
const abortController = new AbortController();
export function run(config) {
    // Start serial processes
    execaProcesses.push(new Promise((parentResolve, parentReject) => {
        let generator = serialRunner(config.serialProcesses);
        let serialProcesses = [];
        function runNextProcess() {
            let generatorResult = generator.next();
            let process = generatorResult.value;
            if (process instanceof Error) {
                console.log('Ending serial run because process failed to start');
                parentReject(process);
            }
            if (process != null) {
                serialProcesses.push(process);
                process.then(() => {
                    runNextProcess();
                }).catch(e => {
                    console.log('Error running process: ', e);
                    parentReject('process failed');
                });
            }
            if (generatorResult.done) {
                Promise.all(serialProcesses).then(execaReturnValues => {
                    parentResolve(execaReturnValues);
                });
            }
        }
        runNextProcess();
    }));
    // Start concurrent processes
    config.concurrentProcesses?.forEach(process => {
        let execaProcess = runProcess(process);
        execaProcesses.push(execaProcess);
    });
    return Promise.all(execaProcesses);
}
export const killAll = () => {
    abortController.abort();
};
function* serialRunner(processes) {
    let index = 0;
    while (index < processes?.length) {
        let process = processes[index];
        let execaProcess;
        try {
            execaProcess = runProcess(process);
        }
        catch (e) {
            yield e;
        }
        yield execaProcess;
        index = index + 1;
    }
}
const runProcess = (childProcessConfig) => {
    console.log('Starting process: ', childProcessConfig.name);
    let execaProcess = execa(childProcessConfig.command, childProcessConfig.args?.split(' '), { signal: abortController.signal });
    execaProcess.stdout.on('data', data => {
        console.log(`${childProcessConfig.name}::: `, data.toString());
        checkForFailureStrings(childProcessConfig, data);
    });
    return execaProcess;
};
const checkForFailureStrings = (childProcessConfig, stdOut) => {
    childProcessConfig.failIfSeen?.forEach(failIfSeenString => {
        if (stdOut.includes(failIfSeenString)) {
            console.log('Found failIfSeen string: ', failIfSeenString);
            killAll();
            process.exit(2);
        }
    });
};
//# sourceMappingURL=runner.mjs.map