import { Argument, program } from 'commander';
import * as fs from "fs";
import * as path from 'path';
import { killAll, run } from "./runner.mjs";
export function start() {
    program.addArgument(new Argument('Config', 'JSON file containing the config including the processes you want to run'));
    program.parse();
    let { name, ext, dir } = path.parse(program.args[0]);
    process.chdir(dir);
    const config = JSON.parse(fs.readFileSync(name + ext).toString());
    run(config).then(() => {
        console.log(config.successMessage);
    }).catch(() => {
        console.log(config.errorMessage);
        killAll();
        process.exit(1);
    });
}
//# sourceMappingURL=main.mjs.map