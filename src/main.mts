import {Argument, program} from 'commander';
import * as fs from "fs";
import * as path from 'path';
import {killAll, run} from "./runner.mjs";
import type {Config} from "./config.mjs";
import {ExecaReturnValue} from "execa";
import {getConfig, setConfig} from "./config.mjs";
import * as debug from "./debug.mjs";

export function start(){
    program.addArgument(new Argument('Config', 'JSON file containing the config including the processes you want to run'));
    program.parse();

    let { name, ext, dir } = path.parse(program.args[0]);

    if(dir)
        process.chdir(dir);
    setConfig(JSON.parse(fs.readFileSync(name + ext).toString()) as Config);

    run(getConfig()).then(returnValues => {
        function logCompletedProcess(value: ExecaReturnValue<string>) {
            debug.log(`${value.command} `, value.failed ? "failed": "succeeded")
        }

        returnValues.forEach(value => {
            if(Array.isArray(value)){
                value.forEach(logCompletedProcess)
            } else {
                logCompletedProcess(value);
            }
        });


        console.log(getConfig().successMessage);
        process.exit(0);
    }).catch(() => {
        console.log(getConfig().errorMessage);
        killAll();
        process.exit(1);
    });
}
