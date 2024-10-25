const v3 = require('node-hue-api').v3;
const LightState = v3.lightStates.LightState;
const utils = require('../utils')
const BaseEffect = require('../base-effect')

class Effect extends BaseEffect {
    // Function to simulate the strobe light effect
    async startEffect(lights, flashDuration = 50, interval = 50) {
        const api = await this.api()

        const onState = new LightState().on().brightness(100).transition(0); // Light on
        const offState = new LightState().off().transition(0); // Light off

        while(this.running) {
            // Turn lights on
            await Promise.all(lights.map(lightId => api.lights.setLightState(lightId, onState)));
            await utils.delay(flashDuration); // Flash duration

            // Turn lights off
            await Promise.all(lights.map(lightId => api.lights.setLightState(lightId, offState)));
            await utils.delay(interval); // Interval between flashes
        }
    }
}

module.exports = Effect