const v3 = require('node-hue-api').v3;
const LightState = v3.lightStates.LightState;
const utils = require('../utils')
const BaseEffect = require('../base-effect')

// Define red and blue colors using hue and saturation values (Philips Hue uses HSL)
const RED_STATE = new LightState().on().hue(0).sat(254).brightness(100).transition(0); // Red (Hue value = 0)
const BLUE_STATE = new LightState().on().hue(46920).sat(254).brightness(100).transition(0); // Blue (Hue value = 46920)

class Effect extends BaseEffect {
    async validate(lights) {
        const api = await this.api()
        const errors = []
        for(let i = 0; i < lights.length; i++){
            const lightId = lights[i]
                // Get the light's details
            const light = await api.lights.getLight(lightId);
            
            // Check if the light has color capabilities
            const hasColorSupport = light.capabilities.control && light.capabilities.control.colorgamut;
            if(!hasColorSupport) {
                errors.push(`Light ${lightId} has no color support!`)
            }
        }
        return errors
    }    

    async startEffect(lights) {
        const api = await this.api()
        let isRed = true; // Start with red on the first set of lights
    
        while (this.running) {
            // Apply the color state (red or blue) to all lights
            const currentState = isRed ? RED_STATE : BLUE_STATE;
    
            await Promise.all(lights.map(lightId => api.lights.setLightState(lightId, currentState)));
    
            // Wait for a short time before switching colors
            await utils.delay(500); // 500ms between color changes
    
            // Toggle the color for the next cycle
            isRed = !isRed;
        }
    }
}

module.exports = Effect