import { getConfig } from "./config.mjs";
import { execa } from 'execa';
import * as debug from "./debug.mjs";
import * as fs from "fs";
import * as path from "path";
import chalk, { backgroundColorNames } from "chalk";
export const runAlongsideProcesses = [];
const allProcesses = [];
const processesToWaitOn = [];
const abortController = new AbortController();
let counter = 0;
export function run(config) {
    // Start runAlongSide processes
    config.runAlongsideProcesses?.forEach(process => {
        runAlongsideProcesses.push(runProcess(process, createFilename(process), false));
    });
    // Start serial processes
    processesToWaitOn.push(new Promise((parentResolve, parentReject) => {
        let generator = serialRunner(config.serialProcesses);
        let serialProcesses = [];
        function runNextProcess() {
            let generatorResult = generator.next();
            let process = generatorResult.value;
            if (process instanceof Error) {
                console.error('Ending serial run because process failed to start');
                parentReject(process);
            }
            if (process != null) {
                serialProcesses.push(process);
                process.then(() => {
                    runNextProcess();
                }).catch(e => {
                    console.error('Error running process: ', e);
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
        for (let i = 0; i < process.numberOfRuns; i++) {
            let execaProcess = runProcess(process, createFilename(process));
            processesToWaitOn.push(execaProcess);
        }
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
function createFilename(process) {
    let repeatRunNamePart = typeof process.numberOfRuns === "number" ? '-' + process.numberOfRuns : '';
    return `${process.name}${repeatRunNamePart}`.replace(/[<>:"\/\\|?*]/g, '_');
}
function* serialRunner(processes) {
    let index = 0;
    while (index < processes?.length) {
        let process = processes[index];
        let execaProcess;
        try {
            let outputFilename = createFilename(process);
            execaProcess = runProcess(process, outputFilename);
        }
        catch (e) {
            yield e;
        }
        yield execaProcess;
        if (process.numberOfRuns-- === 1) {
            index = index + 1;
        }
    }
}
let colourIndex = 1;
const runProcess = (childProcessConfig, processLogFilename, shouldCheckForFailureStrings = true) => {
    if (colourIndex === 15)
        colourIndex = 1;
    const chalkColour = backgroundColorNames[colourIndex++];
    function log(...args) {
        console.log(chalk[chalkColour](args.join(' ')));
    }
    const repeatMessage = typeof childProcessConfig.numberOfRuns === 'number' && !isNaN(childProcessConfig.numberOfRuns) ? `${childProcessConfig.numberOfRuns} run${childProcessConfig.numberOfRuns > 1 ? 's' : ''} remaining` : '';
    let processId = counter++;
    log('Starting process', `"${childProcessConfig.name}"`, repeatMessage);
    let execaProcess = execa(childProcessConfig.command, childProcessConfig.args?.split(' '), {
        signal: abortController.signal,
        stripFinalNewline: false
    });
    execaProcess.stdout.on('data', data => {
        log(`${childProcessConfig.name} (${processId})> \n`, data.toString());
        if (shouldCheckForFailureStrings)
            checkForFailureStrings(childProcessConfig, data);
    });
    let logDir = getConfig().logDir;
    if (typeof logDir === 'string') {
        let stdOutFilename = `${processId}-${processLogFilename}-stdout.txt`;
        let stdErrFilename = `${processId}-${processLogFilename}-stderr.txt`;
        if (!path.isAbsolute(logDir)) {
            logDir = path.join(process.cwd(), logDir);
        }
        log("logging to", logDir);
        fs.mkdirSync(logDir, { recursive: true });
        let stdOutStream = fs.createWriteStream(path.join(logDir, stdOutFilename), { flags: 'w+' });
        let stdErrStream = fs.createWriteStream(path.join(logDir, stdErrFilename), { flags: 'w+' });
        execaProcess.stdout.pipe(stdOutStream);
        execaProcess.stderr.pipe(stdErrStream);
    }
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