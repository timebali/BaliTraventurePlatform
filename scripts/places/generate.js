const fs = require('fs')
const path = require('path')
const { writeFileSync, copyFolderRecursive } = require('../../helpers/file')

const templatePath = 'PlaceTwo.html'
const toursDir = 'data/places'
const outputDir = 'dist'

// Read template HTML
const template = fs.readFileSync(templatePath, 'utf8')

// Create output directory if not exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
}

fs.copyFileSync('scripts/tailwindcss-v3.4.16.js', `${outputDir}/style.js`)

// Process all JSON files in tours directory
function processTours(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true })

    for (const file of files) {
        const fullPath = path.join(dir, file.name)

        if (file.isDirectory()) {
            processTours(fullPath)
        } else if (path.extname(file.name) === '.json') {
            processFile(fullPath, dir)
        }
    }
}

function processFile(jsonPath, dir) {
    try {
        // Read and parse JSON
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

        // Create HTML content from template
        let htmlContent = template

        // Handle dynamic highlights list with null check and camelCase fallback
        const contents = (jsonData || [])
            .map((item, index) => `<div class="container-[${index + 1}] bg-red">${item}</div>`)
            .join('\n')

        htmlContent = htmlContent.replace(/\${contents}/g, contents)

        // Create output filename
        const baseName = path.basename(jsonPath, '.json')
        const outputPath = path.join(outputDir, dir, `${baseName}.html`)

        htmlContent = htmlContent
            .replaceAll('https://www.baligoldentour.com', 'https://nanobalitour.com')
            .replaceAll('https://baligoldentour.com', 'https://nanobalitour.com')
            .replaceAll('Bali Golden Tour', 'Nano Bali Tour')


        // Write generated HTML
        writeFileSync(outputPath, htmlContent)
        console.log(`Generated: ${outputPath}`)

        const stylePath = path.join(path.dirname(outputPath), 'style.js')
        if (!fs.existsSync(stylePath)) {
            fs.copyFileSync('scripts/tailwindcss-v3.4.16.js', stylePath)
        }

        const imagePath = path.join(path.dirname(outputPath), 'images')
        if (!fs.existsSync(imagePath)) {
            copyFolderRecursive("images/images", imagePath)
        }

    } catch (error) {
        console.error(`Error processing ${jsonPath}:`, error.message)
    }
}

// Start processing
processTours(toursDir)
console.log('Tour generation completed!')
