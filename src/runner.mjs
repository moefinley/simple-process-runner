import { execa } from 'execa';
let execaProcesses = [];
const abortController = new AbortController();
export async function run(config) {
    config.processes.forEach(process => {
        let execaProcess = execa(process.command, process.args?.split(' '), { signal: abortController.signal });
        execaProcess.stdout.on('data', data => console.log(data.toString()));
        execaProcesses.push(execaProcess);
    });
    await Promise.all(execaProcesses);
}
export function killAll() {
    abortController.abort();
}
//# sourceMappingURL=runner.mjs.map