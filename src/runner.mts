import type {Config, ProcessConfig} from "./config.mjs";
import {execa, ExecaChildProcess, ExecaReturnValue} from 'execa';
import * as debug from "./debug.mjs";

const allProcesses: Array<ExecaChildProcess> = [];
const processesToWaitOn: Array<Promise<ExecaReturnValue | ExecaReturnValue[]>> = [];
const abortController = new AbortController();

export function run(config: Config): Promise<Array<ExecaReturnValue | ExecaReturnValue[]>> {
    // Start runAlongSide processes
    config.runAlongsideProcesses?.forEach(process => {
        runProcess(process, false);
    });

    // Start serial processes
    processesToWaitOn.push(new Promise<ExecaReturnValue[]>((parentResolve, parentReject) => {
        let generator = serialRunner(config.serialProcesses);
        let serialProcesses: ExecaChildProcess[] = [];

        function runNextProcess() {
            let generatorResult = generator.next();
            let process = generatorResult.value as ExecaChildProcess<string>;
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
        let execaProcess = runProcess(process);
        processesToWaitOn.push(execaProcess as Promise<ExecaReturnValue>);
    });

    return Promise.all(processesToWaitOn);
}

export const killAll = () => {
    abortController.abort();
    allProcesses.forEach(process => {
        debug.log(`Killing process ${process.pid}`)
        process.kill('SIGTERM', {
            forceKillAfterTimeout: 2000
        });
    });
}

function* serialRunner(processes: ProcessConfig[]) {
    let index = 0;

    while (index < processes?.length) {
        let process = processes[index];
        let execaProcess;

        try {
            execaProcess = runProcess(process);
        } catch (e) {
            yield e;
        }

        yield execaProcess;
        index = index + 1;
    }
}

const runProcess = (childProcessConfig: ProcessConfig, shouldCheckForFailureStrings: boolean = true): ExecaChildProcess => {
    console.log('Starting process: ', childProcessConfig.name);
    let execaProcess = execa(childProcessConfig.command, childProcessConfig.args?.split(' '), {signal: abortController.signal, stripFinalNewline: false});
    execaProcess.stdout.on('data', data => {
        console.log(`${childProcessConfig.name}::: `, data.toString());
        if (shouldCheckForFailureStrings)
            checkForFailureStrings(childProcessConfig, data);
    });
    allProcesses.push(execaProcess);
    return execaProcess;
}

const checkForFailureStrings = (childProcessConfig: ProcessConfig, stdOut: string) => {
    childProcessConfig.failIfSeen?.forEach(failIfSeenString => {
        if (stdOut.includes(failIfSeenString)) {
            console.log('Found failIfSeen string: ', failIfSeenString);
            killAll();
            process.exit(2);
        }
    });
}
