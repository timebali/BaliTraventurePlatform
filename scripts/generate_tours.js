const fs = require('fs')
const path = require('path')
const { writeFileSync } = require('../helpers/file')

const templatePath = 'Tour.html'
const toursDir = 'data/tours'
const outputDir = 'dist'

// Read template HTML
const template = fs.readFileSync(templatePath, 'utf8')

// Create output directory if not exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
}

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

        // Replace basic fields
        htmlContent = htmlContent.replace(/\${title\.title}/g, jsonData.title.title)
        htmlContent = htmlContent.replace(/\${title\.html}/g, jsonData.title.html)
        htmlContent = htmlContent.replace(/\${tagline\.title}/g, jsonData.tagline.title)
        htmlContent = htmlContent.replace(/\${tagline\.html}/g, jsonData.tagline.html)
        htmlContent = htmlContent.replace(/\${description\.html}/g, jsonData.description.html)
        htmlContent = htmlContent.replace(/\${tourDetails\.price\.title}/g, jsonData.tourDetails.price.title)
        htmlContent = htmlContent.replace(/\${tourDetails\.price\.content}/g, jsonData.tourDetails.price.content)
        htmlContent = htmlContent.replace(/\${tourDetails\.itinerary\.title}/g, jsonData.tourDetails.itinerary.title)
        htmlContent = htmlContent.replace(/\${image.src}/g, jsonData.placeDetails[0].image.src.replace('nanobalitour', 'baligoldentour')) // TODO: Store image
        htmlContent = htmlContent.replace(/\${image.title}/g, jsonData.placeDetails[0].image.title)

        // Handle inclusions list with null check
        const inclusionList = (jsonData.tourDetails.inclusion || [])
            .map(incl => `<li>${incl}</li>`)
            .join('\n')
        htmlContent = htmlContent.replace(/\${tourDetails\.inclusion}/g, inclusionList)

        // Handle dynamic highlights list with null check and camelCase fallback
        const highlightsList = (jsonData.placelinks || jsonData.placeLinks || [])
            .map(link => `<li>${link}</li>`)
            .join('\n')
        htmlContent = htmlContent.replace(/\${placelinks}/g, highlightsList)

        // Handle dynamic itinerary items with null check and camelCase fallback 
        const placeDetails = (jsonData.placedetails || jsonData.placeDetails || [])
            .map((item, index) => `
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h4 class="text-xl font-bold mb-2">${item.title.text}</h4>
          <p class="text-gray-700">${item.description.html}</p>
        </div>`
            ).join('\n')
        htmlContent = htmlContent.replace(/\${placeDetails}/g, placeDetails)

        const itinerary = (jsonData.tourDetails.itinerary.content || [])
            .map((item, index) => {
                const items = item.split('–')
                return `
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h4 class="text-xl font-bold mb-2">${items[0]?.trim()}</h4>
          <p class="text-gray-700">${items[1]?.trim()}</p>
        </div>`
            }).join('\n')
        htmlContent = htmlContent.replace(/\${tourDetails\.itinerary\.content}/g, itinerary)

        // Create output filename
        const baseName = path.basename(jsonPath, '.json')
        const outputPath = path.join(outputDir, dir, `${baseName}.html`)

        // Write generated HTML
        writeFileSync(outputPath, htmlContent)
        console.log(`Generated: ${outputPath}`)

    } catch (error) {
        console.error(`Error processing ${jsonPath}:`, error.message)
    }
}

// Start processing
processTours(toursDir)
console.log('Tour generation completed!')
