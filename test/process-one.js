const processName = 'Process one'
console.log(`${processName} running`);
setTimeout(() => {
    console.log(`${processName} I don't feel to good...`);
    console.error(`${processName} errored`);
    process.exit(500);
}, 5000);