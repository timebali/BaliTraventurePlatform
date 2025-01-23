const fs = require('fs');
const path = require('path');
const downloadImage = require('./helpers/downloadImage');
const { readJsonFile, getAllJsonFiles } = require('./helpers/jsonFile');

const jsonFiles = getAllJsonFiles('./data/categories');
const allData = jsonFiles.map(file => readJsonFile(file));

const urls = allData.map(({ data }) => data.tourDetails.map(({ image }) => image.src))
urls.flat().forEach(url => {
    let filename = url.split("/")
    filename = filename[filename.length - 1]

    return downloadImage(url, `./images/categories/${filename}`);
})

