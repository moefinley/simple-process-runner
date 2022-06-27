import type {Config, ProcessConfig} from "./config.mjs";
import {execa, ExecaChildProcess, ExecaReturnValue} from 'execa';

let execaProcesses: ExecaChildProcess[] = [];
const abortController = new AbortController();

export function run(config: Config): Promise<ExecaReturnValue[]> {
    if (config.runConcurrently) {
        config.processes.forEach(process => {
            let execaProcess = runProcess(process);
            execaProcesses.push(execaProcess);
        });

        return Promise.all(execaProcesses);
    } else {
        return new Promise<ExecaReturnValue[]>((parentResolve, parentReject) => {
            let generator = serialRunner(config.processes);
            let startedProcesses = [];

            function runNextProcess() {
                let generatorResult = generator.next();
                let process = generatorResult.value as ExecaChildProcess<string>;
                if (process instanceof Error) {
                    console.log('Ending serial run because process failed to start');
                    parentReject(process);
                }
                if (process != null) {
                    process.then(() => {
                        startedProcesses.push(process);
                        runNextProcess();
                    }).catch(e => {
                            console.log('Error running process: ', e);
                            parentReject('process failed');
                        }
                    );
                }
                if (generatorResult.done) {
                    parentResolve(startedProcesses);
                }
            }

            runNextProcess();
        })
    }
}

export function killAll() {
    abortController.abort();
}

function* serialRunner(processes: ProcessConfig[]) {
    let index = 0;

    while (index < processes.length) {
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

function runProcess(childProcessConfig: ProcessConfig): ExecaChildProcess {
    console.log('Starting process: ', childProcessConfig.name);
    let execaProcess = execa(childProcessConfig.command, childProcessConfig.args?.split(' '), {signal: abortController.signal});
    execaProcess.stdout.on('data', data => {
        console.log(`${childProcessConfig.name}::: `, data.toString());
        checkForFailureStrings(childProcessConfig, data);
    });
    return execaProcess;
}

function checkForFailureStrings(childProcessConfig: ProcessConfig, stdOut: string) {
    childProcessConfig.failIfSeen?.forEach(failIfSeenString => {
        if (stdOut.includes(failIfSeenString)) {
            console.log('Found failIfSeen string: ', failIfSeenString);
            killAll();
            process.exit(2);
        }
    });
}
