export interface Config {
    processes: ProcessConfig[],
    successMessage: string,
    errorMessage: string,
    runConcurrently: boolean
}

export type ProcessConfig = {
    name: string,
    command: string,
    args?: string
}