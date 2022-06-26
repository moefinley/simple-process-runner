import {Argument, program} from 'commander';
import * as fs from "fs";
import {killAll, run} from "./runner.mjs";
import type {Config} from "./config.mjs";

export function start(){
    program.addArgument(new Argument('Config', 'JSON file containing the config including the processes you want to run'));
    program.parse();

    let pathToConfig = program.args[0];

    const config = JSON.parse(fs.readFileSync(pathToConfig).toString()) as Config;

    run(config).then(() => {
        console.log(config.successMessage);
    }).catch(() => {
        console.log(config.errorMessage);
        killAll();
        process.exit(1);
    });
}
