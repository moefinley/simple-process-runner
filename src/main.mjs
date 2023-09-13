import { Argument, program } from 'commander';
import * as fs from "fs";
import * as path from 'path';
import { kill, killAll, run, runAlongsideProcesses } from "./runner.mjs";
import { getConfig, setConfig } from "./config.mjs";
import * as debug from "./debug.mjs";
export function start() {
    program.addArgument(new Argument('Config', 'JSON file containing the config including the processes you want to run'));
    program.parse();
    let { name, ext, dir } = path.parse(program.args[0]);
    if (dir)
        process.chdir(dir);
    setConfig(JSON.parse(fs.readFileSync(name + ext).toString()));
    run(getConfig()).then(returnValues => {
        function logCompletedProcess(value) {
            debug.log(`${value.command} `, value.failed ? "failed" : "succeeded");
        }
        returnValues.forEach(value => {
            if (Array.isArray(value)) {
                value.forEach(logCompletedProcess);
            }
            else {
                logCompletedProcess(value);
            }
        });
        runAlongsideProcesses.forEach(kill);
        if (typeof getConfig().successMessage === 'string')
            console.log(getConfig().successMessage);
        process.exit(0);
    }).catch(() => {
        if (typeof getConfig().errorMessage === 'string')
            console.log(getConfig().errorMessage);
        killAll();
        process.exit(1);
    });
}
//# sourceMappingURL=main.mjs.map