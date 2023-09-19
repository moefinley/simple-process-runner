let _config = {
    concurrentProcesses: [],
    debug: false,
    errorMessage: "",
    runAlongsideProcesses: [],
    serialProcesses: [],
    successMessage: ""
};
export function setConfig(config) {
    _config = { ..._config, ...config };
    function setNumberOfRuns(process) {
        if (typeof process.numberOfRuns !== 'number')
            process.numberOfRuns = 1;
    }
    _config.concurrentProcesses.forEach(setNumberOfRuns);
    _config.serialProcesses.forEach(setNumberOfRuns);
}
export function getConfig() {
    return _config;
}
//# sourceMappingURL=config.mjs.map