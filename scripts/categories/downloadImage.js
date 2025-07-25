const fs = require('fs')
const path = require('path')

const { downloadImage } = require('../../helpers/image')
const { readJsonFile, getAllJsonFiles } = require('../../helpers/file')

const jsonFilesPath = path.join('data', 'categories')
const jsonFiles = getAllJsonFiles(jsonFilesPath)

const urls = jsonFiles.map(file => {
    const { name, data } = readJsonFile(file)

    return data.tourDetails.map(({ image }) => {
        try {
            return image.src
                .replace('https://baligoldentour.com/https://www.baligoldentour.com', 'https://baligoldentour.com')
                .replace('https://www.baligoldentour.com/https://baligoldentour.com', 'https://baligoldentour.com')
                .replace('https://www.baligoldentour.com/https://www.baligoldentour.com', 'https://baligoldentour.com')
                .replace('https://baligoldentour.com/https://baligoldentour.com', 'https://baligoldentour.com')
                .replace('https://www.baligoldentour.com', 'https://baligoldentour.com')

        } catch (error) {
            console.log("\n\n================================================")
            console.log(`Path: ${file}`)
            console.log(`Category: ${name}`)
            console.log(`Image: ${image.src}\n\n`)
            console.log("================================================\n\n\n")

            throw error
        }
    })
})

urls.flat().filter(url => url).forEach(url => {
    let filepath = url.replace('https://baligoldentour.com/', "")
    filepath = path.join('images', filepath)

    console.info(`===== ${filepath} =====`)

    const isExist = fs.existsSync(filepath)
    if (isExist) return console.info("Image already exist")

    const dir = path.dirname(filepath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    return downloadImage(url, filepath)
})

