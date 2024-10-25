const http = require("http");
const fs = require("fs")
const path = require("path")
const url = require('url')
const normalizedPath = path.join(__dirname, "effects");
const utils = require('./utils')

const runningEffects = new Map()
const apis = new Map()

const req = fs.readdirSync(normalizedPath)
req.forEach( key => {
    const effect = require( "./effects/" + key );
    const effectName = path.parse(key).name

    if(apis[effectName]) {
        console.log("Path already taken by another effect")
    } else {
        apis.set(effectName, effect)
    }
})

function displayRunningEffects(response) {
    if( runningEffects.size > 0 ) {
        runningEffects.forEach( (v, k) => {
            response.write(`<p>${k} <a href="./stop?hash=${k}">stop</a> ${v.info()}</p>`)
        } )
    } else {
        response.write("No effects are running.")
    }
}

const server = http.createServer(async(request, response) => {
    console.log("API called url: " + request.url)

    response.writeHead(200, { "Content-Type": "text/html" })
    response.write('<!doctype html><html lang=en><head><meta charset=utf-8><title>Hue Effects server</title></head></body>')

    const parsedUrl = url.parse(request.url, true)
    const q = parsedUrl?.query

    switch(parsedUrl.pathname) {
        case "/":
            response.write(`<p>/start</p>`)            
            response.write(`<p>/stop</p>`)            

            displayRunningEffects(response)
            response.end()                
            break;            
        case "/start":
            const lights = q.lights ? q.lights.split(',').map(e => e.trim()) : []
            if( lights.length === 0 ) {
                response.write("<p>Supply a querystring with light ids: /start?lights=2,4,5</p>")
                break                
            }
            if( !q.effect ) {
                response.write("<p>Supply an effect querystring with light ids: /start?lights=2,4,5&effect=lightning</p>")
                response.end()   
                break                                
            }
            const effectClass = apis.get(q.effect)
            if( !effectClass ) {
                response.write(`<p>Unknown effect: "${q.effect}", known effects: ${Array.from(apis.keys()).map( e => `"${e}"`).join(' ')}</p>`)
                response.end()   
                break                                
            } else {
                const effect = new effectClass(q.effect)

                effect.validate(lights).then( (errors) => {
                    if(errors && errors.length > 0){
                        response.write("Not starting effect, there are validation errors:")
                        errors.forEach(e => {
                            response.write(`<p>${e}</p>`)
                        })
                    } else {
                        response.write("<p>OK</p>")
                        runningEffects.set(utils.uuid(), effect)
                        effect.start(lights).catch(err => {
                            console.error('Failed to simulate lightning:', err);
                        });
                    }
                    displayRunningEffects(response)
                    response.end()                    
                } )
            }
            break;
        case "/stop":
            const currentEffect = runningEffects.get(q.hash);
            if(currentEffect) {
                runningEffects.delete(q.hash)
                currentEffect.stop(runningEffects)
            }

            displayRunningEffects(response)
            response.end()                
            break;            
    }
})

server.listen(8080, '0.0.0.0');
console.log("API listening on port 8080 for requests")