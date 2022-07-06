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
}
export function getConfig() {
    return _config;
}
//# sourceMappingURL=config.mjs.map