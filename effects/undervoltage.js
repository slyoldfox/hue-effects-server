const v3 = require('node-hue-api').v3;
const LightState = v3.lightStates.LightState;
const utils = require('../utils')
const BaseEffect = require('../base-effect')

class Effect extends BaseEffect {
    async startEffect(lights) {
        const api = await this.api()
        
        while (this.running) {
            // Wait for a random interval between undervoltage events (2 to 10 seconds)
            const interval = utils.getRandom(2, 10);
            await utils.delay(interval * 1000);

            // Simulate a lightning flash
            await simulateUndervoltage(api, lights);
        }
    }
}

// Helper function to simulate occasional flickering due to undervoltage
async function simulateUndervoltage(api, lightIds) {
    // Number of dimming or flickering events (between 1 and 3 flickers)
    const flickers = Math.floor(utils.getRandom(1, 3));

    for (let i = 0; i < flickers; i++) {
        //for (const lightId of lightIds) {
            // Simulate a sudden drop in brightness to mimic undervoltage
            const flickerState = new LightState()
                .on()
                .brightness(Math.floor(utils.getRandom(10, 50))) // Simulate dimming to 10% to 50% brightness
                .transition(utils.getRandom(0.05, 0.3) * 1000); // Quick transition to dim

            // Apply the flicker state to all lights simultaneously
            await Promise.all(lightIds.map(lightId => api.lights.setLightState(lightId, flickerState)));


            // Duration of the undervoltage effect (dimmed period)
            const flickerDuration = utils.getRandom(0.1, 0.5); // Stay dim for 100ms to 500ms
            await utils.delay(flickerDuration * 1000);

            // Restore to normal brightness (full power restored)
            const normalState = new LightState()
                .on()
                .brightness(Math.floor(utils.getRandom(70, 100))) // Random brightness between 70% and 100%
                .transition(utils.getRandom(0.1, 0.2) * 1000); // Smooth transition back to normal

            // Apply the normal state to all lights simultaneously
            await Promise.all(lightIds.map(lightId => api.lights.setLightState(lightId, normalState)));

       // }

        // Add a small random delay between flickers
        await utils.delay(utils.getRandom(0.5, 2) * 1000); // Pause for 500ms to 2 seconds between flickers
    }
}

module.exports = Effect