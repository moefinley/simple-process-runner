const processName = 'Process one'
console.log(`${processName} running`);
setTimeout(() => {
    console.log(`${processName} Is it over already...`);
    console.log(`${processName} done`);
    process.exit(0);
}, 2000);