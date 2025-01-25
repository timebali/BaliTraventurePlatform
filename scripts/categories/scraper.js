const puppeteer = require('puppeteer')
const path = require('path')
const { writeFileSync } = require('../../helpers/file')

const categories = [
    {
        name: 'Full Day Tour',
        url: 'https://baligoldentour.com/bali-full-day-tour.php'
    },
    {
        name: 'Half Day Tour',
        url: 'https://baligoldentour.com/bali-half-day-tour.php'
    },
    {
        name: 'Combination Tour',
        url: 'https://baligoldentour.com/bali-combination-tour.php'
    },
    {
        name: 'Double Activities',
        url: 'https://baligoldentour.com/bali-double-activities-tour.php'
    },
    // {
    //     name: 'Bali Tour Package',
    //     url: 'https://baligoldentour.com/bali-tour-packages.php'
    // },
    // {
    //     name: 'Activities Tour',
    //     url: 'https://baligoldentour.com/bali-activities-tour.php'
    // },
    // {
    //     name: 'Nusa Penida',
    //     url: 'https://baligoldentour.com/bali-nusa-penida-tour.php'
    // },
    // {
    //     name: 'Charter',
    //     url: 'https://baligoldentour.com/bali-car-charter.php'
    // }
]

async function scrapeCategory({ name, url }) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    console.log('==========================================================================================')
    console.log(`Scraping ${name}`)
    console.log(`URL: ${url}`)

    await page.goto(url, { waitUntil: 'networkidle2' })

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

        const parent = document.querySelectorAll('div.row.row-tour > div.col-lg-9.pad-tour')
        const wells = parent[0].querySelectorAll('div.well')

        const categoryDetails = wells[0].querySelectorAll('h1, h2, h3, p')
        const tourLinks = Array.from(wells[1].querySelectorAll('ul li')).map(link => link?.innerText ?? null)

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

        const title = getProperty(categoryDetails[0].querySelector('a'))
        const tagline = getProperty(categoryDetails[1].querySelector('a'))
        const description = getProperty(categoryDetails[2].querySelector('a'))

        return {
            title,
            tagline,
            description,
            tourLinks,
            tourDetails,
        }
    })

    const dataPath = path.join('data/categories', `${name.toLowerCase().replace(/ /g, '-')}.json`)
    writeFileSync(dataPath, JSON.stringify({ name, data }, null, 2))

    await browser.close()
    console.log(`Finished scraping ${name}`)
}

(async () => {
    try {
        for (const category of categories) {
            await scrapeCategory(category)
        }
        console.log('All categories scraped successfully!')
    } catch (error) {
        console.error('Error during scraping:', error)
    }
})()
