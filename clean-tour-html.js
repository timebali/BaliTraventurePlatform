const fs = require('fs')
const path = require('path')

async function processTourFiles(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
            await processTourFiles(fullPath)
        } else if (entry.isFile() && path.extname(entry.name) === '.json') {
            const content = fs.readFileSync(fullPath, 'utf8')
            const tourData = JSON.parse(content)

            // Convert itinerary content from string to array
            if (tourData.tourDetails?.itinerary?.content && typeof tourData.tourDetails.itinerary.content === 'string') {
                tourData.tourDetails.itinerary.content = tourData.tourDetails.itinerary.content
                    .split(/<br\s*\/?>/i) // Split on any <br> tag variation
                    .map(line => line.trim()) // Clean whitespace
                    .filter(line => line.length > 0) // Remove empty lines
            }

            if (Array.isArray(tourData.tourDetails.itinerary.content) && tourData.tourDetails.itinerary.content.length > 0) {
                // Remove <p> from first item
                tourData.tourDetails.itinerary.content[0] = tourData.tourDetails.itinerary.content[0].replace(/^<p>/i, '').trim()
                // Remove </p> from last item
                tourData.tourDetails.itinerary.content[tourData.tourDetails.itinerary.content.length - 1] =
                    tourData.tourDetails.itinerary.content[tourData.tourDetails.itinerary.content.length - 1].replace(/<\/p>$/i, '')

                fs.writeFileSync(fullPath, JSON.stringify(tourData, null, 2))
            }
        }
    }
}

// Start processing from data/tours directory
processTourFiles(path.join(__dirname, 'data/tours'))
    .then(() => console.log('HTML tag cleanup complete'))
    .catch(console.error)
