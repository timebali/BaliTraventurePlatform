const fs = require('fs')
const path = require('path')

const { downloadImage } = require('../../helpers/image')
const { readJsonFile, getAllJsonFiles } = require('../../helpers/file')

const category = process.argv[2]
const jsonFilesPath = path.join('data', 'tours', category)

const jsonFiles = getAllJsonFiles(jsonFilesPath)
const allData = jsonFiles.map(file => readJsonFile(file))

const urls = allData.map(data => data.placeDetails.map(({ image }) => {
    try {
        const a = image.src
            .replace('https://baligoldentour.com/https://www.baligoldentour.com', 'https://baligoldentour.com')
            .replace('https://www.baligoldentour.com/https://baligoldentour.com', 'https://baligoldentour.com')
            .replace('https://www.baligoldentour.com/https://www.baligoldentour.com', 'https://baligoldentour.com')
            .replace('https://baligoldentour.com/https://baligoldentour.com', 'https://baligoldentour.com')
            .replace('https://www.baligoldentour.com', 'https://baligoldentour.com')

        return a
    } catch (error) {
        console.log(jsonFiles)
        console.log(data.title)
        console.log(image)
        throw error

    }
}))

urls.flat().filter(url => url).forEach(url => {
    let filepath = url.replace('https://baligoldentour.com/', "")
    filepath = path.join('images', 'tours', category, filepath)

    console.info(`===== ${filepath} =====`)

    const isExist = fs.existsSync(filepath)
    if (isExist) return console.info("Image already exist")

    const dir = path.dirname(filepath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    return downloadImage(url, filepath)
})

