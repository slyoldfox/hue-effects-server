const v3 = require('node-hue-api').v3;
const LightState = v3.lightStates.LightState;
const utils = require('../utils')
const BaseEffect = require('../base-effect')

let lastHue = {};

class Effect extends BaseEffect {
    // Function to simulate the party mode effect
    async startEffect(lights, interval = 1000) {
        const api = await this.api()

        while (this.running) {
            // Set random color for each light
            await Promise.all(lights.map(lightId => {
                const randomColorState = getRandomColorState();
                return api.lights.setLightState(lightId, randomColorState);
            }));

            // Wait for the specified interval before changing colors again
            await utils.delay(interval);
        }
    }
}

// Function to generate a random color hue (0 - 65535 for Philips Hue)
// Function to generate a random hue that differs significantly from the current hue
function getRandomHue(lightId, minDifference = 10000) {
    let newHue;
    const previousHue = lastHue[lightId] || 0;  // Get the last hue or default to 0
    
    do {
        newHue = Math.floor(Math.random() * 65535);
    } while (Math.abs(newHue - previousHue) < minDifference);
    
    // Save the new hue as the last hue for this light
    lastHue[lightId] = newHue;

    return newHue;
}

// Function to create a new LightState with a random color
function getRandomColorState() {
    return new LightState()
        .on()
        .hue(getRandomHue())      // Random hue (color)
        .sat(254)                 // Full saturation
        .brightness(100)          // Full brightness
        .transition(0);           // Instant transition
}

module.exports = Effect