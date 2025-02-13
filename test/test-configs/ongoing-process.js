let count = 5;
let interval = setInterval(() => {
    if(count <= 0) clearInterval(interval);
    console.log(`${count}: I'm doing things...`);
    count--;
}, 2000);
