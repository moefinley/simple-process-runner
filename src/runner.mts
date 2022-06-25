import {Config} from "./main.mjs";
import {execa, ExecaChildProcess} from 'execa';

let execaProcesses: ExecaChildProcess[] = [];
const abortController = new AbortController();

export async function run(config: Config) {
    config.processes.forEach(process => {
        let execaProcess = execa(process.command, process.args?.split(' '), {signal: abortController.signal});
        execaProcess.stdout.on('data', data => console.log(data.toString()));
        execaProcesses.push(execaProcess);
    });

    await Promise.all(execaProcesses);
}

export function killAll() {
    abortController.abort();
}