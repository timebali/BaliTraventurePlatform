const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const { readJsonFile, getAllJsonFiles, writeFileSync, appendFileSync } = require('../../helpers/file')
const jsonFiles = getAllJsonFiles('./data/categories')

const categories = jsonFiles.map(file => {
    const { name, data } = readJsonFile(file)

    return {
        categoryName: name.toLowerCase().replace(/ /g, '_'),
        tours: data.tourDetails.map(tour => ({
            title: tour.title.text,
            url: tour.link.href,
        }))
    }
})

async function scrape(tour, categoryName) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    // page.on('console', msg => console.log('Page log:', msg.text()))
    await page.goto(tour.url, { waitUntil: 'networkidle2' })

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
            const placeLinks = Array.from(wells[1].querySelectorAll('ul li')).map(link => link?.innerText ?? null).filter(item => item)

            const tourDetails = wells[0].querySelectorAll('h1, h2, h3, p')
            const title = getProperty(tourDetails[0].querySelector('a'))
            const tagline = getProperty(tourDetails[1].querySelector('a'))
            const description = getProperty(tourDetails[2])

            let tourDetailsPrice = null
            let tourDetailsItinerary = null
            let tourDetailsInclusion = []

            wells.splice(0, 2)
            const placeDetails = wells.map(well => {
                const contents = well.querySelectorAll('span > div > div')
                const detailsElement = well.querySelector(':scope > div.row > div')

                if (contents.length >= 2) {
                    return {
                        link: getProperty(contents[0].querySelector('a')),
                        title: getProperty(contents[1].querySelector('h3 a')),
                        image: getProperty(contents[0].querySelector('a img')),
                        description: getProperty(contents[1].querySelector('p')),
                        button: getProperty(contents[1].querySelector('div a')),
                    }
                }

                else if (detailsElement) {
                    let inclusion = Array.from(detailsElement.children)
                    inclusion.splice(0, 2)

                    const tourPrice = detailsElement.querySelector('span#tour-price') ?? detailsElement.querySelector('span#price')
                    const tourItinerary = detailsElement.querySelector('span#tour-itinerary') ?? detailsElement.querySelector('span#itinerary')

                    tourDetailsPrice = {
                        title: tourPrice.querySelector('h3')?.innerHTML,
                        content: tourPrice?.innerHTML,
                    }

                    tourDetailsItinerary = {
                        title: tourItinerary.querySelector('h3')?.innerHTML,
                        content: tourItinerary.querySelector('p')?.innerHTML
                            ?.split(/<br\s*\/?>/i) // Split on any <br> tag variation
                            ?.map(line => {
                                try {
                                    const data = line.trim().split('–')
                                    return { time: data[0].trim(), event: data[1].trim() }
                                } catch (error) { return null }
                            })
                            ?.filter(line => line) // Remove empty lines,
                    }

                    tourDetailsInclusion = inclusion.map(item => item?.innerHTML ?? null).filter(item => item)
                    return null
                }

                return null
            }).filter(item => item)

            return {
                title,
                tagline,
                description,
                placeLinks,
                placeDetails,
                tourDetails: {
                    price: tourDetailsPrice,
                    itinerary: tourDetailsItinerary,
                    inclusion: tourDetailsInclusion,
                },
            }
        } catch (error) {
            return false
        }
    })

    if (!data) return false

    const dataPath = path.join('data/tours', categoryName, `${tour.title.toLowerCase().replace(/[\s|]/g, '-')}.json`)
    writeFileSync(dataPath, JSON.stringify(data, null, 2))

    await browser.close()
    return true
}

async function run(categories) {
    let retry = 0
    const maxRetry = 5

    while (retry < maxRetry) {
        try {
            for (const category of categories) {
                console.log(`Scraping ${category.categoryName}...`)

                for (const tour of category.tours) {
                    const dataPath = path.join('data/tours', category.categoryName, `${tour.title.toLowerCase().replace(/[\s|]/g, '-')}.json`)
                    const isExist = fs.existsSync(dataPath)

                    console.log('==========================================================================================')
                    console.log(`Scraping ${tour.title}...`)
                    console.log(`URL ${tour.url}`)

                    if (isExist) console.info('Data already scraped.')
                    else {
                        const isSuccess = await scrape(tour, category.categoryName)

                        if (isSuccess) console.info(`Finished scraping ${tour.title}`)
                        else {
                            const date = new Date()

                            appendFileSync(
                                `logs/${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.log`,
                                `[${date.getHours()}:${date.getMinutes()}] Failed scraping ${tour.url}\n`,
                            )

                            console.warn(`Failed scraping ${tour.title}`)
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
                await sleep(3000)
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

run(categories)
