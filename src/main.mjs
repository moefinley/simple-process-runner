import { program } from 'commander';
import * as fs from "fs";
import * as path from 'path';
import { kill, killAll, run, runAlongsideProcesses } from "./runner.mjs";
import { getConfig, setConfig } from "./config.mjs";
import * as debug from "./debug.mjs";
export function start() {
    program.argument('Config', 'JSON file containing the config including the processes you want to run');
    program.option('-w, --wkdir <type>', 'The working directory that all scripts will be run in. If not specified the working directory will be the same as the config file.');
    program.parse(process.argv);
    let { base, dir } = path.parse(program.args[0]);
    const options = program.opts();
    const pathToConfig = path.resolve(process.cwd(), path.resolve(dir, base));
    if (options.wkdir) {
        process.chdir(path.resolve(process.cwd(), options.wkdir));
    }
    else {
        process.chdir(path.resolve(process.cwd(), dir));
    }
    setConfig(JSON.parse(fs.readFileSync(pathToConfig).toString()));
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