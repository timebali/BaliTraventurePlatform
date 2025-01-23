const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
const { readJsonFile, getAllJsonFiles } = require('../../helpers/jsonFile')

const jsonFiles = getAllJsonFiles('./data/categories');
const categories = jsonFiles.map(file => readJsonFile(file));

console.log(categories);



async function scrapeCategory(category) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    console.log(`Scraping ${category.name}...`)
    await page.goto(category.url, { waitUntil: 'networkidle2' })

    const data = await page.evaluate(() => {
        const getProperty = (element) => {

            return {
                title: element?.getAttribute('title') ?? "",
                href: element?.getAttribute('href') ?? "",
                src: element?.getAttribute('src') ? `https://baligoldentour.com/${element.getAttribute('src')}` : "",
                html: element?.innerHTML ?? "",
            }
        }

        const parent = document.querySelectorAll('div.row.row-tour > div.col-lg-9.pad-tour')
        const wells = parent[0].querySelectorAll('div.well')

        const categoryDetails = wells[0].querySelectorAll('h1, h2, h3, p')
        const tourLinks = Array.from(wells[1].querySelectorAll('ul li')).map(link => link?.innerText ?? "")

        const tourDetails = []
        parent[0].querySelectorAll('div.row div span div.well').forEach(tour => {
            tourDetails.push({
                link: getProperty(tour.querySelector('a')),
                title: getProperty(tour.querySelector('h3 a')),
                image: getProperty(tour.querySelector('a img')),
                description: getProperty(tour.querySelector('p')),
                button: getProperty(tour.querySelector('div a')),
            })
        })

        const title = categoryDetails[0]?.innerHTML ?? ""
        const tagline = categoryDetails[1]?.innerHTML ?? ""
        const description = categoryDetails[2]?.innerHTML ?? ""

        return {
            title,
            tagline,
            description,
            tourLinks,
            tourDetails,
        }
    })

    const dataPath = path.join('data/tours', `${category.name.toLowerCase().replace(/ /g, '-')}.json`)
    fs.writeFileSync(dataPath, JSON.stringify({
        category: category.name,
        data: data
    }, null, 2))


    await browser.close()
    console.log(`Finished scraping ${category.name}`)
}

// (async () => {
//     try {
//         for (const category of categories) {
//             await scrapeCategory(category)
//         }
//         console.log('All categories scraped successfully!')
//     } catch (error) {
//         console.error('Error during scraping:', error)
//     }
// })()
