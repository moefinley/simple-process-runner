const processName = 'Fail after 2secs'
console.log(`${processName} running`);
setTimeout(() => {
    console.log(`${processName} I don't feel to good...`);
    console.error(`${processName} errored`);
    process.exit(500);
}, 2000);
