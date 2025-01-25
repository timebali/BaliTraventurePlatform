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
        let result = []
        const files = fs.readdirSync(dirPath, { withFileTypes: true })

        for (const file of files) {
            const fullPath = path.join(dirPath, file.name)

            if (file.isDirectory()) {
                result = result.concat(getAllJsonFiles(fullPath))
            } else if (path.extname(file.name) === '.json') {
                result.push(fullPath)
            }
        }

        return result.filter(file => path.extname(file) === '.json')
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

function appendFileSync(filePath, content) {
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    fs.appendFileSync(filePath, content)
}

module.exports = { readJsonFile, getAllJsonFiles, writeFileSync, appendFileSync }