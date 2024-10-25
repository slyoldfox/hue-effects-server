const v3 = require('node-hue-api').v3;
const LightState = v3.lightStates.LightState;
const config = require('./config.json')

class BaseEffect {
    #api
    #lightIds 
    #name
    #initialLightStates = {};
    running

    constructor(name) {
        this.#name = name
        this.running = true
    }

    async api() {
        if( !this.#api ) {
            const x = v3.api.createLocal(config.host)
            this.#api = await x.connect(config.username).catch(e => {
                console.error(e)
            });
        }
        return this.#api
    }

    async validate() {
        return []
    }

    async saveInitialLightStates() {
        const api = await this.api()
        console.log('Saving initial light states...');
        
        for (const lightId of this.#lightIds) {
            if(!this.#initialLightStates[lightId]) {
                const light = await api.lights.getLightState(lightId);
                this.#initialLightStates[lightId] = light;
            }
        }

        console.log('Initial states saved:', this.#initialLightStates);
    }
    
    async restoreInitialLightStates(runningEffects) {
        const api = await this.api()
    
        for (const lightId of this.#lightIds) {
            const hasOtherEffects = Array.from(runningEffects.values()).filter( effect => effect.#lightIds.indexOf(lightId) >= 0 ).length
            if(!hasOtherEffects) {
                const initialState = this.#initialLightStates[lightId];
                if (initialState) {
                    await api.lights.setLightState(lightId, initialState);
                }
            }
        }
    }    

    async start(lights) {
        this.#lightIds = lights

        await this.saveInitialLightStates()

        console.log(`Starting effect ${this.#name} on lights: ${this.#lightIds.join(', ')}`)
        await this.startEffect(lights)
    }

    async stop(runningEffects) {
        console.log(`Stopping effect ${this.#name} on lights: ${this.#lightIds.join(', ')}`)
        this.running = false

        await this.restoreInitialLightStates(runningEffects)
        for (const lightId of this.#lightIds) {
            const dark = new LightState().off(true) // Fade to black     
            await this.#api.lights.setLightState(lightId, dark);           
        }    
    }

    info() {
        return `"${this.#name}" running on lights: ${this.#lightIds.join(' / ')}` 
    }
}

module.exports = BaseEffect