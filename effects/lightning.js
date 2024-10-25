const v3 = require('node-hue-api').v3;
const LightState = v3.lightStates.LightState;
const utils = require('../utils')
const BaseEffect = require('../base-effect')

class Effect extends BaseEffect {
    // Main function to run the lightning simulation
    async startEffect(lights) {
        const api = await this.api()
        
        while (this.running) {
            // Wait for a random interval between flashes (0.5 to 5 seconds)
            const interval = utils.getRandom(0.5, 5);
            await utils.delay(interval * 1000);

            // Simulate a lightning flash
            await simulateLightning(api, lights);
        }
    }
}

// Helper function to simulate a lightning flash
async function simulateLightning(api, lightIds) {
    // Number of flashes in a series (1 to 4 flashes)
    const flashes = Math.floor(utils.getRandom(1, 4));

    for (let i = 0; i < flashes; i++) {
        for (const lightId of lightIds) {
            // Create a new light state for the flash
            const flashState = new LightState()
                .on()
                .brightness(Math.floor(utils.getRandom(70, 100))) // Random brightness between 70% and 100%
                .ct(Math.floor(utils.getRandom(153, 500))); // Cooler temp at peak, warmer as it fades (Hue API uses 153 to 500)

            // Send the light state to the bridge
            await api.lights.setLightState(lightId, flashState);

            // Duration of flash, quick flashes for brighter peaks
            const flashDuration = utils.getRandom(0.05, 0.2) * (1 - flashState.brightness / 100);
            await utils.delay(flashDuration * 1000);

            // Create a dimming effect to simulate fading lightning
            const afterglow = new LightState()
                .brightness(0) // Fade to black
                .transition(utils.getRandom(0.2, 0.5) * 1000); // Slow transition back to darkness

            await api.lights.setLightState(lightId, afterglow);
            await utils.delay(100); // Small pause between flashes            
        }
    }
}

module.exports = Effect