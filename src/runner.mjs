import { execa } from 'execa';
let execaProcesses = [];
const abortController = new AbortController();
export function run(config) {
    if (config.runConcurrently) {
        config.processes.forEach(process => {
            let execaProcess = execa(process.command, process.args?.split(' '), { signal: abortController.signal });
            execaProcess.stdout.on('data', data => console.log(`${process.name}::: `, data.toString()));
            execaProcesses.push(execaProcess);
        });
        return Promise.all(execaProcesses);
    }
    else {
        return new Promise((parentResolve, parentReject) => {
            let generator = serialRunner(config.processes);
            let runProcesses = [];
            function runNextProcess() {
                let generatorResult = generator.next();
                let process = generatorResult.value;
                if (process instanceof Error) {
                    console.log('Rejecting because process was null');
                    parentReject(process);
                }
                if (process != null) {
                    process.then(() => {
                        runProcesses.push(process);
                        runNextProcess();
                    }).catch(e => {
                        console.log('Error running process: ', e);
                        parentReject('process failed');
                    });
                }
                if (generatorResult.done) {
                    parentResolve(runProcesses);
                }
            }
            runNextProcess();
        });
    }
}
export function killAll() {
    abortController.abort();
}
function* serialRunner(processes) {
    let index = 0;
    while (index < processes.length) {
        let process = processes[index];
        let execaProcess;
        try {
            console.log('Starting process: ', process.name);
            execaProcess = execa(process.command, process.args?.split(' '), { signal: abortController.signal });
            execaProcess.stdout.on('data', data => console.log(`${process.name}::: `, data.toString()));
        }
        catch (e) {
            yield e;
        }
        yield execaProcess;
        index = index + 1;
    }
}
//# sourceMappingURL=runner.mjs.map