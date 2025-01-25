const fs = require('fs')
const path = require('path')

const { downloadImage } = require('../../helpers/image')
const { readJsonFile, getAllJsonFiles } = require('../../helpers/file')

const jsonFilesPath = path.join('data', 'places')
const jsonFiles = getAllJsonFiles(jsonFilesPath)

const urls = jsonFiles.map(file => {
    const data = readJsonFile(file)

    return data.map(text => {
        try {
            return text
                .replaceAll('https://baligoldentour.com/https://www.baligoldentour.com', 'https://baligoldentour.com')
                .replaceAll('https://www.baligoldentour.com/https://baligoldentour.com', 'https://baligoldentour.com')
                .replaceAll('https://www.baligoldentour.com/https://www.baligoldentour.com', 'https://baligoldentour.com')
                .replaceAll('https://baligoldentour.com/https://baligoldentour.com', 'https://baligoldentour.com')
                .replaceAll('https://www.baligoldentour.com', 'https://baligoldentour.com')

        } catch (error) {
            throw error
        }
    })
})

urls.flat().filter(url => url).forEach(text => {
    const matches = [...text.matchAll(/src="(images[^"]+\.jpg)"/g)]
    const paths = matches.map(match => match[1])

    paths.forEach(async url => {
        if (!url.startsWith('https://baligoldentour.com/')) {
            url = 'https://baligoldentour.com/' + url
        }

        let filepath = url.replace('https://baligoldentour.com/', "")
        filepath = path.join('images', filepath)

        console.info(`===== ${filepath} =====`)

        const isExist = fs.existsSync(filepath)
        if (isExist) return console.info("Image already exist")

        const dir = path.dirname(filepath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }

        try {
            await downloadImage(url, filepath)
            console.log("Image downloaded.");

        } catch (error) {
            console.error("Failed download image", error)
        }
    })
})

