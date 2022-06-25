const processName = 'Process three'
console.log(`${processName} running`);
setTimeout(() => {
    console.log(`${processName} Is it over already...`);
    console.error(`${processName} done`);
    process.exit(0);
}, 6000);