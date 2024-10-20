const http = require("http");
const querystring = require('querystring');
const url = require('url')
const v3 = require('node-hue-api').v3;
const LightState = v3.lightStates.LightState;
const config = require('./config.json')

let paused = true
let lights = []

// Helper function to generate a random number between a range
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

// Helper function to simulate a lightning flash
async function simulateLightning(api, lightIds) {
    console.log('Lightning flash');

    // Number of flashes in a series (1 to 4 flashes)
    const flashes = Math.floor(getRandom(1, 4));

    for (let i = 0; i < flashes; i++) {
        for (const lightId of lightIds) {
            // Create a new light state for the flash
            const flashState = new LightState()
                .on()
                .brightness(Math.floor(getRandom(70, 100))) // Random brightness between 70% and 100%
                .ct(Math.floor(getRandom(153, 500))); // Cooler temp at peak, warmer as it fades (Hue API uses 153 to 500)

            // Send the light state to the bridge
            await api.lights.setLightState(lightId, flashState);

            // Duration of flash, quick flashes for brighter peaks
            const flashDuration = getRandom(0.05, 0.2) * (1 - flashState.brightness / 100);
            await delay(flashDuration * 1000);

            // Create a dimming effect to simulate fading lightning
            const afterglow = new LightState()
                .brightness(0) // Fade to black
                .transition(getRandom(0.2, 0.5) * 1000); // Slow transition back to darkness

            await api.lights.setLightState(lightId, afterglow);
            await delay(100); // Small pause between flashes            
        }
    }
}

// Helper function to pause execution for a given duration
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function to run the lightning simulation
async function startLightningSimulation() {
    const api = await v3.api.createLocal(config.host).connect(config.username).catch(e => {
        console.error(e)
    });
    
    console.log('Connected to Philips Hue bridge.');
    
    while (true) {
        // Wait for a random interval between flashes (0.5 to 5 seconds)
        const interval = getRandom(0.5, 5);
        await delay(interval * 1000);

        if(paused) {
            for (const lightId of lights) {
                const dark = new LightState().off(true) // Fade to black     
                await api.lights.setLightState(lightId, dark);           
            }    
            break
        }

        // Simulate a lightning flash
        await simulateLightning(api, lights);
    }
}

var server = http.createServer((request, response) => {
    console.log("API called url: " + request.url)

    response.writeHead(200, { "Content-Type": "text/html" })
    response.write('<!doctype html><html lang=en><head><meta charset=utf-8><title>Hue Lightning server</title></head></body>')

    const parsedUrl = url.parse(request.url)
    let q = parsedUrl?.query ? querystring.parse(parsedUrl.query) : {}

    switch(parsedUrl.pathname) {
        case "/":

            response.write(`<p>/start</p>`)            
            response.write(`<p>/stop</p>`)            
            break;
        case "/start":
            paused = false
            lights = q.lights ? q.lights.split(',').map(e => e.trim()) : []
            if(lights.length > 0) {
                response.write("<p>OK</p>")
                startLightningSimulation().catch(err => {
                    console.error('Failed to simulate lightning:', err);
                });
            } else {
                response.write("<p>Supply a querystring with light ids: /start?lights=2,4,5</p>")
                console.error("Supply ?lights=2,4,5")
            }

            break;
        case "/stop":
            paused = true    
            break;            
    }
    response.end()
})

server.listen(8080, '0.0.0.0');
console.log("API listening on port 8080 for requests")