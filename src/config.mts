export interface Config {
    concurrentProcesses: ProcessConfig[],
    serialProcesses: ProcessConfig[],
    successMessage: string,
    errorMessage: string,
    runConcurrently: boolean
}

export type ProcessConfig = {
    name: string,
    command: string,
    args?: string,
    failIfSeen: string[]
}
