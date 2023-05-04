import { execa } from 'execa';
import * as debug from "./debug.mjs";
import { getConfig } from "./config.mjs";
export const runAlongsideProcesses = [];
const allProcesses = [];
const processesToWaitOn = [];
const abortController = new AbortController();
export function run(config) {
    // Start runAlongSide processes
    config.runAlongsideProcesses?.forEach(process => {
        runAlongsideProcesses.push(runProcess(process, false));
    });
    // Start serial processes
    processesToWaitOn.push(new Promise((parentResolve, parentReject) => {
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
        processesToWaitOn.push(execaProcess);
    });
    return Promise.all(processesToWaitOn);
}
export function kill(process) {
    debug.log(`Killing process ${process.pid}`);
    process.kill('SIGTERM', {
        forceKillAfterTimeout: 2000
    });
}
export const killAll = () => {
    abortController.abort();
    allProcesses.forEach(kill);
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
const runProcess = (childProcessConfig, shouldCheckForFailureStrings = true) => {
    console.log('Starting process: ', childProcessConfig.name);
    let execaProcess = execa(childProcessConfig.command, childProcessConfig.args?.split(' '), {
        signal: abortController.signal,
        stripFinalNewline: false
    });
    execaProcess.stdout.on('data', data => {
        console.log(`${childProcessConfig.name}::: `, data.toString());
        if (shouldCheckForFailureStrings)
            checkForFailureStrings(childProcessConfig, data);
    });
    allProcesses.push(execaProcess);
    return execaProcess;
};
const checkForFailureStrings = (childProcessConfig, stdOut) => {
    childProcessConfig.failIfSeen?.forEach(failIfSeenString => {
        if (stdOut.includes(failIfSeenString)) {
            console.log('Found failIfSeen string: ', failIfSeenString);
            console.log(getConfig().errorMessage);
            killAll();
            process.exit(2);
        }
    });
};
//# sourceMappingURL=runner.mjs.map