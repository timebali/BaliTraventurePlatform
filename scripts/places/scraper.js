const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const { readJsonFile, getAllJsonFiles, writeFileSync, appendFileSync } = require('../../helpers/file')

const jsonFilesPath = path.join('data', 'tours')
const jsonFiles = getAllJsonFiles(jsonFilesPath)

const files = jsonFiles
    .map(file => {
        const { title, placeDetails } = readJsonFile(file)

        return {
            filepath: file,
            tourName: title.text,
            places: placeDetails.map(place => ({
                title: place.title.text,
                url: place.link.href,
            }))
        }
    })

async function scrape(place) {
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
            if (wells.length > 1) wells.pop()

            return wells.map(item => item?.innerHTML?.trim())


            // const $ = cheerio.load(jsonData.tourDetails.itinerary.title)
            // jsonData.tourDetails.itinerary.title = $('strong').html()

        } catch (error) {
            return false
        }
    })

    if (!data) return false

    const dataPath = path.join('data/places', `${place.title.toLowerCase().replace(/[\s|]/g, '-').replace(/-+/g, "")}.json`)
    writeFileSync(dataPath, JSON.stringify(data, null, 2))

    await browser.close()
    return true
}

async function run(files) {
    let retry = 0
    const maxRetry = 5

    while (retry < maxRetry) {
        try {
            for (const file of files) {
                for (const place of file.places) {
                    console.log('==========================================================================================')
                    console.log(`Scraping ${place.title}...`)
                    console.log('---------------------------------')
                    console.log(`- URL: ${place.url}`)
                    console.log(`- Tour: ${file.tourName}...`)
                    console.log(`- File: ${file.filepath}...\n`)

                    const dataPath = path.join('data/places', `${place.title.toLowerCase().replace(/[\s|]/g, '-').replace(/-+/g, "")}.json`)
                    const isExist = fs.existsSync(dataPath)

                    if (isExist) console.info('Data already scraped.')
                    else {
                        const isSuccess = await scrape(place)

                        if (isSuccess) console.info(`Finished scraping ${place.title}`)
                        else {
                            const date = new Date()

                            appendFileSync(
                                `logs/${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.log`,
                                `[${date.getHours()}:${date.getMinutes()}] Failed scraping ${place.url}\n`,
                            )

                            console.warn(`Failed scraping ${place.title}`)
                        }
                    }
                }
            }

            console.info('All data scraped successfully!')
            retry = maxRetry
        } catch (error) {
            retry++
            console.warn(`Attempt ${retry} failed.`, error)

            if (retry < maxRetry) {
                console.info("Retrying in 3 seconds...")
                await sleep(5000)
            } else {
                console.error('Error during scraping:', error)
                throw error;
            }
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

run(files)