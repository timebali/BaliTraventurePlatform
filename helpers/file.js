const fs = require('fs')
const path = require('path')

// Function to read a single JSON file
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data)
    } catch (err) {
        console.error(`Error reading file ${filePath}:`, err)
        return null
    }
}

// Function to get all JSON files in a directory
function getAllJsonFiles(dirPath) {
    try {
        return fs.readdirSync(dirPath)
            .filter(file => path.extname(file) === '.json')
            .map(file => path.join(dirPath, file))
    } catch (err) {
        console.error(`Error reading directory ${dirPath}:`, err)
        return []
    }
}

function writeFileSync(filePath, content) {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filePath, content)
}

module.exports = { readJsonFile, getAllJsonFiles, writeFileSync }