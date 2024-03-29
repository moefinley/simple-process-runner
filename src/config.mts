export interface Config {
    runAlongsideProcesses?: ProcessConfig[],
    concurrentProcesses?: ProcessConfig[],
    serialProcesses?: ProcessConfig[],
    successMessage?: string,
    errorMessage?: string,
    debug?: boolean,
    logDir?: string
}

export type ProcessConfig = {
    name: string,
    command: string,
    args?: string,
    failIfSeen?: string[],
    numberOfRuns?: number;
}

let _config: Config = {
    concurrentProcesses: [],
    debug: false,
    errorMessage: "",
    runAlongsideProcesses: [],
    serialProcesses: [],
    successMessage: ""
}

export function setConfig(config: Partial<Config>) {
    _config = { ..._config, ...config };

    function setNumberOfRuns(process: ProcessConfig) {
        if(typeof process.numberOfRuns !== 'number') process.numberOfRuns = 1;
    }

    _config.concurrentProcesses.forEach(setNumberOfRuns);
    _config.serialProcesses.forEach(setNumberOfRuns);
}

export function getConfig(): Config {
    return _config;
}
