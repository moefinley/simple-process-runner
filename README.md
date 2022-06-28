# Simple Process Runner
Run multiple processes and 
* correctly return exit codes through the parent process
* write out specific text on any failure (good for reporting to CI tools like TeamCity or Jenkins)
* run concurrently or one after the other

## How to run
Create a config file

### Config properties
| Config Property |                          Description                           |
|-----------------|:--------------------------------------------------------------:|
| successMessage  | The message to write when all processes complete without error |
| errorMessage    |       The message to write out when any processes errors       |
| runConcurrently | Boolean to specify if processes should run in parallel or not  |
| processes       |               An array of process configurations               |

### Process Config Properties
| Process Config Property |                                                                               |
|-------------------------|-------------------------------------------------------------------------------|
| name                    | The name of the process. This will be prefixed on all stdout.                 |
| command                 | The command to start the process                                              |
| args                    | Arguments to pass to the command                                              |     
| failIfSeen              | Array of stings that if seen in the stdout of the process will fail the build |

### Example
```json
{
  "successMessage": "All processes completed successfully",
  "errorMessage": "##teamcity[buildProblem description='Processes failed to run']",
  "runConcurrently": true,
  "processes": [
    {
      "name": "List files",
      "command": "powershell",
      "args": "Invoke-WebRequest -URI https://www.example.com",
      "failIfSeen": "timeout"
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
