const crypto = require('crypto')

module.exports = {
    getRandom(min, max) {
        return Math.random() * (max - min) + min;
    },
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    uuid() {
        return crypto.randomUUID()
    }        
}