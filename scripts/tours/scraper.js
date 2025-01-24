const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const { readJsonFile, getAllJsonFiles, writeFileSync } = require('../../helpers/file')

const jsonFiles = getAllJsonFiles('./data/categories')
let categories = jsonFiles.map(file => readJsonFile(file))

categories = categories.map(({ name, data }) => ({
    categoryName: name.toLowerCase().replace(/ /g, '_'),
    tours: data.tourDetails.map(tour => ({
        title: tour.title.title,
        url: tour.link.href,
    }))
}))

async function scrape(tour, categoryName) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    // page.on('console', msg => console.log('Page log:', msg.text()))
    await page.goto(tour.url, { waitUntil: 'networkidle2' })

    const data = await page.evaluate(() => {
        const getProperty = (element) => {

            return {
                title: element?.getAttribute('title') ?? "",
                href: element?.getAttribute('href') ?? "",
                src: element?.getAttribute('src') ? `https://baligoldentour.com/${element.getAttribute('src')}` : "",
                text: element?.innerText ?? "",
                html: element?.outerHTML ?? "",
            }
        }

        try {
            const wells = Array.from(document.querySelectorAll('div.row.row-tour > div.col-lg-9.pad-tour > div.well'))
            const placeLinks = Array.from(wells[1].querySelectorAll('ul li')).map(link => link?.innerText ?? null).filter(item => item)

            const tourDetails = wells[0].querySelectorAll('h1, h2, h3, p')
            const title = getProperty(tourDetails[0].querySelector('a'))
            const tagline = getProperty(tourDetails[1].querySelector('a'))
            const description = getProperty(tourDetails[2])

            let tourDetailsPrice = ""
            let tourDetailsItinerary = ""
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
                        title: tourPrice.querySelector('h3')?.outerHTML,
                        content: tourPrice?.outerHTML,
                    }

                    tourDetailsItinerary = {
                        title: tourItinerary.querySelector('h3')?.outerHTML,
                        content: tourItinerary.querySelector('p')?.outerHTML,
                    }

                    tourDetailsInclusion = inclusion.map(item => item?.outerHTML ?? null).filter(item => item)
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
            console.error('Error during scraping:', error)
            return null
        }
    })

    if (!data) return

    const dataPath = path.join('data/tours', categoryName, `${tour.title.toLowerCase().replace(/[\s]/g, '_').replace(/[|]/g, '-')}.json`)
    writeFileSync(dataPath, JSON.stringify(data, null, 2))

    await browser.close()
    console.info(`Finished scraping ${tour.title}`)
}

(async () => {
    try {
        for (const category of categories) {
            console.log(`Scraping ${category.categoryName}...`)

            for (const tour of category.tours) {
                const dataPath = path.join('data/tours', category.categoryName, `${tour.title.toLowerCase().replace(/[\s]/g, '_').replace(/[|]/g, '-')}.json`)
                const isExist = fs.existsSync(dataPath)

                console.log('==========================================================================================')
                console.log(`Scraping ${tour.title}...`)
                console.log(`URL ${tour.url}`)

                if (isExist) console.info('Data already scraped.')
                else await scrape(tour, category.categoryName)
            }
        }

        console.info('All data scraped successfully!')
    } catch (error) {
        console.error('Error during scraping:', error)
    }
})()
