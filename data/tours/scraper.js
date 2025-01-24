const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
const { readJsonFile, getAllJsonFiles, writeFileSync } = require('../../helpers/file')

const jsonFiles = getAllJsonFiles('./data/categories')
let categories = jsonFiles.map(file => readJsonFile(file))

categories = categories.map(({ category, data }) => ({
    categoryName: category.toLowerCase().replace(/ /g, '_'),
    tours: data.tourDetails.map(tour => ({
        title: tour.title.title,
        link: tour.link.href,
    }))
}))

async function scrape(tour, categoryName) {
    const browser = await puppeteer.launch({
        dumpio: true,
    })
    const page = await browser.newPage()

    console.log(`Scraping ${tour.title}...`)
    page.on('console', msg => console.log('Page log:', msg.text()))

    await page.goto(tour.link, { waitUntil: 'networkidle2' })

    const data = await page.evaluate(() => {
        const getProperty = (element) => {

            return {
                title: element?.getAttribute('title') ?? "",
                href: element?.getAttribute('href') ?? "",
                src: element?.getAttribute('src') ? `https://baligoldentour.com/${element.getAttribute('src')}` : "",
                text: element?.innerText ?? "",
                html: element?.innerHTML ?? "",
            }
        }

        const wells = Array.from(document.querySelectorAll('div.row.row-tour > div.col-lg-9.pad-tour > div.well'))
        const placeLinks = Array.from(wells[1].querySelectorAll('ul li')).map(link => link?.innerText ?? "")

        const tourDetails = wells[0].querySelectorAll('h1, h2, h3, p')
        const title = getProperty(tourDetails[0].querySelector('a'))
        const tagline = getProperty(tourDetails[1].querySelector('a'))
        const description = getProperty(tourDetails[2])

        wells.splice(0, 2)
        const placeDetails = wells.map(well => {
            const contents = well.querySelectorAll('span > div > div')
            if (contents.length < 2) return null

            return {
                link: getProperty(contents[0].querySelector('a')),
                title: getProperty(contents[1].querySelector('h3 a')),
                image: getProperty(contents[0].querySelector('a img')),
                description: getProperty(contents[1].querySelector('p')),
                button: getProperty(contents[1].querySelector('div a')),
            }
        })

        return {
            title,
            tagline,
            description,
            placeLinks,
            placeDetails,
        }
    })

    const dataPath = path.join('data/tours', categoryName, `${tour.title.toLowerCase().replace(/[\s|]/g, '-')}.json`)
    writeFileSync(dataPath, JSON.stringify(data, null, 2))

    await browser.close()
    console.log(`Finished scraping ${tour.title}`)

    throw new Error("Stop")
}

(async () => {
    try {
        for (const category of categories) {
            console.log(`Scraping ${category.categoryName}...`)

            for (const tour of category.tours) {
                await scrape(tour, category.categoryName)
            }
        }

        console.log('All data scraped successfully!')
    } catch (error) {
        console.error('Error during scraping:', error)
    }
})()
