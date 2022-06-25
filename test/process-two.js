const processName = 'Process one'
console.log(`${processName} running`);
setTimeout(() => {
    console.log(`${processName} hello world...`);
    console.log(`${processName} I'm ok`);
    process.exit(0);
}, 2000);