const { downloadImage } = require('./helpers/image')
const { readJsonFile, getAllJsonFiles } = require('./helpers/file')

const jsonFiles = getAllJsonFiles('./data/categories')
const allData = jsonFiles.map(file => readJsonFile(file))

const urls = allData.map(({ data }) => data.tourDetails.map(({ image }) => image.src))
urls.flat().forEach(url => {
    let filename = url.split("/")
    filename = filename[filename.length - 1]

    return downloadImage(url, `./images/categories/${filename}`)
})

