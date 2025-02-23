const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const { writeFileSync } = require('../../helpers/file')

const templatePath = 'Tour.html'
const toursDir = 'data/tours'
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

function processFile(jsonPath) {
    try {
        // Read and parse JSON
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

        // Create HTML content from template
        let htmlContent = template

        // Manipulate Itinerary Title
        const $ = cheerio.load(jsonData.tourDetails.itinerary.title)
        jsonData.tourDetails.itinerary.title = $('strong').html()

        // Replace basic fields
        htmlContent = htmlContent.replaceAll(/\${title\.text}/g, jsonData.title.text)
        htmlContent = htmlContent.replaceAll(/\${title\.html}/g, jsonData.title.html)
        htmlContent = htmlContent.replaceAll(/\${title\.title}/g, jsonData.title.title)
        htmlContent = htmlContent.replaceAll(/\${tagline\.html}/g, jsonData.tagline.html)
        htmlContent = htmlContent.replaceAll(/\${tagline\.title}/g, jsonData.tagline.title)
        htmlContent = htmlContent.replaceAll(/\${description\.html}/g, jsonData.description.html)
        htmlContent = htmlContent.replaceAll(/\${tourDetails\.price\.title}/g, jsonData.tourDetails.price.title)
        htmlContent = htmlContent.replaceAll(/\${tourDetails\.price\.content}/g, jsonData.tourDetails.price.content)
        htmlContent = htmlContent.replaceAll(/\${tourDetails\.itinerary\.title}/g, jsonData.tourDetails.itinerary.title)
        htmlContent = htmlContent.replaceAll(/\${image.src}/g, jsonData.placeDetails[0].image.src.replace('balitraventure', 'baligoldentour')) // TODO: Store image
        htmlContent = htmlContent.replaceAll(/\${image.title}/g, jsonData.placeDetails[0].image.title)

        // Handle inclusions list with null check
        const inclusionList = (jsonData.tourDetails.inclusion || [])
            .map(inclusion => inclusion)
            .join('\n')

        htmlContent = htmlContent.replace(/\${tourDetails\.inclusion}/g, inclusionList)

        // Handle dynamic highlights list with null check and camelCase fallback
        const highlightsList = (jsonData.placelinks || jsonData.placeLinks || [])
            .map(link => `<li>${link}</li>`)
            .join('\n')

        htmlContent = htmlContent.replace(/\${placelinks}/g, highlightsList)

        // Handle dynamic itinerary items with null check and camelCase fallback 
        // TODO: Store image
        const placeDetails = (jsonData.placedetails || jsonData.placeDetails || [])
            .map((item, index) => `
            <div class="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row gap-4 justify-between">
                <div>
                    <img src="${item.image.src.replace('balitraventure', 'baligoldentour')}" alt="${item.image.title}" class="w-full h-full md:min-w-[280px] object-cover">
                </div>
                <div>
                    <h4 class="text-xl font-bold mb-2">${item.title.text}</h4>
                    <p class="text-gray-700">${item.description.html}</p>
                </div>
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
        const outputPath = path.join(outputDir, `${baseName}.html`)

        // Write generated HTML
        writeFileSync(outputPath, htmlContent)
        console.log(`Generated: ${outputPath}`)

        const stylePath = path.join(path.dirname(outputPath), 'style.js')
        if (!fs.existsSync(stylePath)) {
            fs.copyFileSync('scripts/tailwindcss-v3.4.16.js', stylePath)
        }

    } catch (error) {
        throw error
        console.error(`Error processing ${jsonPath}:`, error.message)
    }
}

// Start processing
processTours(toursDir)
console.log('Tour generation completed!')
