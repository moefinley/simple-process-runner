import type {Config, ProcessConfig} from "./config.mjs";
import {getConfig} from "./config.mjs";
import {execa, ExecaChildProcess, ExecaReturnValue} from 'execa';
import * as debug from "./debug.mjs";
import * as fs from "fs";
import * as path from "path";

export const runAlongsideProcesses: Array<ExecaChildProcess> = [];
const allProcesses: Array<ExecaChildProcess> = [];
const processesToWaitOn: Array<Promise<ExecaReturnValue | ExecaReturnValue[]>> = [];
const abortController = new AbortController();
let counter = 0;
export function run(config: Config): Promise<Array<ExecaReturnValue | ExecaReturnValue[]>> {
    // Start runAlongSide processes
    config.runAlongsideProcesses?.forEach(process => {
        runAlongsideProcesses.push(runProcess(process, createFilename(process), false));
    });

    // Start serial processes
    processesToWaitOn.push(new Promise<ExecaReturnValue[]>((parentResolve, parentReject) => {
        let generator = serialRunner(config.serialProcesses);
        let serialProcesses: ExecaChildProcess[] = [];

        function runNextProcess() {
            let generatorResult = generator.next();
            let process = generatorResult.value as ExecaChildProcess<string>;
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
                    }
                );
            }
            if (generatorResult.done) {
                Promise.all(serialProcesses).then(execaReturnValues => {
                    parentResolve(execaReturnValues);
                })

            }
        }

        runNextProcess();
    }));

    // Start concurrent processes
    config.concurrentProcesses?.forEach(process => {
        for (let i = 0; i < process.numberOfRuns; i++) {
            let execaProcess = runProcess(process, createFilename(process));
            processesToWaitOn.push(execaProcess as Promise<ExecaReturnValue>);
        }
    });

    return Promise.all(processesToWaitOn);
}

export function kill(process) {
    debug.log(`Killing process ${process.pid}`)
    process.kill('SIGTERM', {
        forceKillAfterTimeout: 2000
    });
}

export const killAll = () => {
    abortController.abort();
    allProcesses.forEach(kill);
}

function createFilename(process: ProcessConfig) {
    let repeatRunNamePart = typeof process.numberOfRuns === "number" ? '-' + process.numberOfRuns : '';
    return `${process.name}${repeatRunNamePart}`.replace(/[<>:"\/\\|?*]/g, '_');
}

function* serialRunner(processes: ProcessConfig[]) {
    let index = 0;

    while (index < processes?.length) {
        let process = processes[index];
        let execaProcess;

        try {
            let outputFilename = createFilename(process);
            execaProcess = runProcess(process, outputFilename);
        } catch (e) {
            yield e;
        }

        yield execaProcess;
        if (process.numberOfRuns-- === 1) {
            index = index + 1;
        }
    }
}

const runProcess = (childProcessConfig: ProcessConfig, processLogFilename: string, shouldCheckForFailureStrings: boolean = true): ExecaChildProcess => {
    const repeatMessage = typeof childProcessConfig.numberOfRuns === 'number' ? `${childProcessConfig.numberOfRuns} run${childProcessConfig.numberOfRuns > 1 ? 's' : ''} remaining` : '';
    console.log('Starting process', `"${childProcessConfig.name}"`, repeatMessage);
    let execaProcess = execa(childProcessConfig.command, childProcessConfig.args?.split(' '), {
        signal: abortController.signal,
        stripFinalNewline: false
    });
    execaProcess.stdout.on('data', data => {
        console.log(`${childProcessConfig.name}::: `, data.toString());
        if (shouldCheckForFailureStrings)
            checkForFailureStrings(childProcessConfig, data);
    });
    let count = counter++;
    let stdOutFilename = `${count}-${processLogFilename}-stdout.txt`;
    let stdErrFilename = `${count}-${processLogFilename}-stderr.txt`;

    let outputDirectory = 'c:/spr-output';
    fs.mkdirSync(outputDirectory,{recursive: true});
    let stdOutStream = fs.createWriteStream(path.join(outputDirectory, stdOutFilename), {flags: 'w+'});
    let stdErrStream = fs.createWriteStream(path.join(outputDirectory, stdErrFilename), {flags: 'w+'});

    execaProcess.stdout.pipe(stdOutStream);
    execaProcess.stderr.pipe(stdErrStream);

    allProcesses.push(execaProcess);
    return execaProcess;
}

const checkForFailureStrings = (childProcessConfig: ProcessConfig, stdOut: string) => {
    childProcessConfig.failIfSeen?.forEach(failIfSeenString => {
        if (stdOut.includes(failIfSeenString)) {
            console.log('Found failIfSeen string: ', failIfSeenString);
            console.log(getConfig().errorMessage);
            killAll();
            process.exit(2);
        }
    });
}
