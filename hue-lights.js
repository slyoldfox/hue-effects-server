const v3 = require('node-hue-api').v3;
const config = require('./config.json')

async function lights() {
    const api = await v3.api.createLocal(config.host).connect(config.username);

    api.lights.getAll().then(lights => {
        lights.forEach(light => {
            console.log(light.toStringDetailed())            
        })
    })
}

lights()