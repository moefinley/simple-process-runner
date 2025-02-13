const processName = 'Output strings flagged to fail'
console.log(`${processName} running`);
setTimeout(() => {
    console.log(`${processName} hello world...`);
    console.log(`${processName} build should fail when ###error### is seen in stdout`);
    process.exit(0);
}, 2000);
