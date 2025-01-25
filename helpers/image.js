const fs = require('fs')
const https = require('https')
const path = require('path')

async function downloadImage(url, destination) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination)

        https.get(url, response => {
            response.pipe(file)

            file.on('finish', () => {
                file.close()
                resolve()
            })
        }).on('error', error => {
            fs.unlink(destination, () => { }) // Delete the file
            reject(error)
        })
    })
}

function bgtSrcReplacement(src, remove = false) {
    let result = src
        .replace('https://www.baligoldentour.com/https://www.baligoldentour.com', 'https://baligoldentour.com')
        .replace('https://www.baligoldentour.com/https://baligoldentour.com', 'https://baligoldentour.com')
        .replace('https://baligoldentour.com/https://www.baligoldentour.com', 'https://baligoldentour.com')
        .replace('https://baligoldentour.com/https://baligoldentour.com', 'https://baligoldentour.com')
        .replace('https://www.baligoldentour.com', 'https://baligoldentour.com')

    if (remove) result = result.replace('https://baligoldentour.com', "")
    return result
}

module.exports = { downloadImage, bgtSrcReplacement }
