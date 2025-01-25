const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const { readJsonFile, getAllJsonFiles, writeFileSync, appendFileSync } = require('../../helpers/file')

const category = process.argv[2]
const jsonFilesPath = path.join('data', 'tours', category)
const jsonFiles = getAllJsonFiles(jsonFilesPath)

let count = 0

const files = jsonFiles
    .map(file => {
        const { title, placeDetails } = readJsonFile(file)

        return {
            tourName: title.text.toLowerCase().replace(/ /g, '_'),
            places: placeDetails.map(place => ({
                title: place.title.text.split('|')[0],
                url: place.link.href,
            }))
        }
    })

async function scrape(place, tourName) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    // page.on('console', msg => console.log('Page log:', msg.text()))
    await page.goto(place.url, { waitUntil: 'networkidle2' })

    const data = await page.evaluate(() => {
        const getProperty = (element) => {

            return {
                title: element?.getAttribute('title') ?? null,
                href: element?.getAttribute('href') ?? null,
                src: element?.getAttribute('src') ? `https://baligoldentour.com/${element.getAttribute('src')}` : null,
                text: element?.innerText ?? null,
                html: element?.innerHTML ?? null,
            }
        }

        try {
            const wells = Array.from(document.querySelectorAll('div.row.row-tour > div.col-lg-9.pad-tour > div.well'))
            // wells[wells.length - 1] = wells[wells.length - 1].querySelector(':scope > div.row > div')

            return wells.map(item => item.innerHTML)


            // const $ = cheerio.load(jsonData.tourDetails.itinerary.title)
            // jsonData.tourDetails.itinerary.title = $('strong').html()

        } catch (error) {
            return false
        }
    })

    if (!data) return false

    const dataPath = path.join('data/places', tourName, `${place.title.toLowerCase().replace(/[\s|]/g, '-')}.json`)
    writeFileSync(dataPath, JSON.stringify(data, null, 2))

    await browser.close()
    return true
}

(async () => {
    try {
        for (const file of files) {
            console.log(`Scraping ${file.tourName}...`)

            for (const place of file.places) {
                const dataPath = path.join('data/places', file.tourName, `${place.title.toLowerCase().replace(/[\s|]/g, '-')}.json`)
                const isExist = fs.existsSync(dataPath)

                console.log('==========================================================================================')
                console.log(`Scraping ${place.title}...`)
                console.log(`URL ${place.url}`)

                if (isExist) console.info('Data already scraped.')
                else {
                    const isSuccess = await scrape(place, file.tourName)

                    if (isSuccess) console.info(`Finished scraping ${place.title}`)
                    else {
                        const date = new Date()

                        appendFileSync(
                            `logs/${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.log`,
                            `[${date.getHours()}:${date.getMinutes()}}] Failed scraping ${place.url}\n`,
                        )

                        console.warn(`Failed scraping ${place.title}`)
                    }
                }

                count++
                if (count == 5) {
                    throw new Error("Stop");
                }
            }
        }

        console.info('All data scraped successfully!')
    } catch (error) {
        console.error('Error during scraping:', error)
    }
})()
