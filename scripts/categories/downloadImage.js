const fs = require('fs')
const path = require('path')

const { downloadImage } = require('../../helpers/image')
const { readJsonFile, getAllJsonFiles } = require('../../helpers/file')

const jsonFiles = getAllJsonFiles('data/categories')
const allData = jsonFiles.map(file => readJsonFile(file))

const urls = allData.map(({ data }) => data.tourDetails.map(({ image }) => {
    return image.src
        .replace('https://baligoldentour.com/https://www.baligoldentour.com', 'https://baligoldentour.com')
        .replace('https://www.baligoldentour.com/https://baligoldentour.com', 'https://baligoldentour.com')
        .replace('https://www.baligoldentour.com/https://www.baligoldentour.com', 'https://baligoldentour.com')
        .replace('https://baligoldentour.com/https://baligoldentour.com', 'https://baligoldentour.com')
        .replace('https://www.baligoldentour.com', 'https://baligoldentour.com')
}))

urls.flat().filter(url => url).forEach(url => {
    let filepath = url.replace('https://baligoldentour.com/', "")
    filepath = `images/categories/${filepath}`

    const dir = path.dirname(filepath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    return downloadImage(url, filepath)
})

