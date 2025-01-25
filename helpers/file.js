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

/**
 * Recursively copies a folder and all its contents.
 * @param {string} source - The source folder path.
 * @param {string} destination - The destination folder path.
 */
function copyFolderRecursive(source, destination) {
    // Check if the source exists
    if (!fs.existsSync(source)) {
        throw new Error(`Source folder does not exist: ${source}`);
    }

    // Create the destination folder if it doesn't exist
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    // Read the contents of the source folder
    const items = fs.readdirSync(source);

    for (const item of items) {
        const sourcePath = path.join(source, item);
        const destPath = path.join(destination, item);
        const stat = fs.statSync(sourcePath);

        if (stat.isDirectory()) {
            // If the item is a directory, recursively copy it
            copyFolderRecursive(sourcePath, destPath);
        } else {
            // If the item is a file, copy it
            fs.copyFileSync(sourcePath, destPath);
        }
    }
}

module.exports = { readJsonFile, getAllJsonFiles, writeFileSync, appendFileSync, copyFolderRecursive }