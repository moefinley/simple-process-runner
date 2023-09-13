# Simple Process Runner

Run multiple processes and

* correctly return exit codes through the parent process
* write out specific text on any failure (good for reporting to CI tools like TeamCity or Jenkins)
* run concurrently or one after the other

## How to run

To run create a config file and run `npx simple-process-runner my-config.json`

## How to create a config file

### Config properties

| Config Property         |                                                                              Description                                                                              |
|-------------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
| `successMessage`        |                                                    The message to write when all processes complete without error                                                     |
| `errorMessage`          |                                                          The message to write out when any processes errors                                                           |
| `concurrentProcesses`   |                                      An array of process configurations (see table below) that you want to run at the same time                                       |
| `serialProcesses`       |                                     An array of process configurations (see table below) that you want to run one after the other                                     |
| `runAlongsideProcesses` | Processes to start first and kill when the `concurrent` and `serial` processes end. Useful for running a server or performance monitor alongside the other processes. |

### Process Config Properties

| Process Config Property | Description                                                                   |
|-------------------------|-------------------------------------------------------------------------------|
| `name`                  | The name of the process. This will be prefixed on all stdout.                 |
| `command`               | The command to start the process                                              |
| `args`                  | Arguments to pass to the command                                              |     
| `failIfSeen`            | Array of stings that if seen in the stdout of the process will fail the build |
| `numberOfRuns`          | Run the process multiple times. Useful for stress testing.                    |

### Example

```json
{
  "successMessage": "All processes completed successfully",
  "errorMessage": "##teamcity[buildProblem description='Processes failed to run']",
  "serialProcesses": [
    {
      "name": "List files",
      "command": "powershell",
      "args": "Invoke-WebRequest -URI https://www.example.com",
      "failIfSeen": [
        "timeout"
      ]
    },
    {
      "name": "Process One",
      "command": "node",
      "args": "my-node-script-one.js"
    },
    {
      "name": "Process Two",
      "command": "node",
      "args": "my-node-script-two.js"
    }
  ]
}
```

## Requirements

Requires Node 15 or greater
