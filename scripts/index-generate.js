const fs = require('fs');
const path = require('path');
const { writeFileSync, copyFolderRecursive } = require('../helpers/file');
const { slugify } = require('../helpers/links');
const { getProcessedHeaderHtml, insertHeaderIntoPage } = require('../helpers/templating');
const { bgtSrcReplacement } = require('../helpers/image');

const projectRoot = path.resolve(__dirname, '..');
const templateHtmlPath = path.join(projectRoot, 'templates/index.html');
const toursDataDir = path.join(projectRoot, 'data/tours');
const outputBaseDir = path.join(projectRoot, 'dist');
const assetsOutputDir = path.join(outputBaseDir, 'assets');

let template = '';
try {
    template = fs.readFileSync(templateHtmlPath, 'utf8');
} catch (e) {
    console.error(`Error: Template file not found at ${templateHtmlPath}`);
    process.exit(1);
}

function ensureGlobalAssets() {
    if (!fs.existsSync(assetsOutputDir)) {
        fs.mkdirSync(assetsOutputDir, { recursive: true });
    }
    const styleJsSource = path.join(projectRoot, 'scripts/tailwindcss-v3.4.16.js');
    const styleJsDest = path.join(assetsOutputDir, 'style.js');
    if (fs.existsSync(styleJsSource) && !fs.existsSync(styleJsDest)) {
        fs.copyFileSync(styleJsSource, styleJsDest);
        console.log(`Copied global style.js to ${styleJsDest}`);
    }

    const imagesSource = path.join(projectRoot, 'images/images');
    const imagesDest = path.join(assetsOutputDir, 'images');
    if (fs.existsSync(imagesSource) && !fs.existsSync(imagesDest)) {
        copyFolderRecursive(imagesSource, imagesDest);
        console.log(`Copied global images to ${imagesDest}`);
    }
}

async function generateIndexPage() {
    const dataDirPath = path.join(projectRoot, 'data');
    try {
        let htmlContent = template;
        const tours = getAllTours(toursDataDir);

        const toursHtml = tours.map(tour => {
            const tourSlug = slugify(tour.title.text);
            const tourLink = `/tours/${tourSlug}/`;
            const tourImage = tour.placeDetails[0]?.image?.src ? `/assets/${bgtSrcReplacement(tour.placeDetails[0].image.src, true)}` : '/assets/images/placeholder-card.jpg';

            return `
                <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                    <a href="${tourLink}">
                        <img src="${tourImage}" alt="${tour.title.text}" class="w-full h-48 object-cover">
                    </a>
                    <div class="p-6">
                        <h3 class="text-xl font-bold mb-2"><a href="${tourLink}" class="hover:text-blue-700">${tour.title.text}</a></h3>
                        <p class="text-gray-600 text-sm mb-4">${(tour.description.text || tour.description.html).substring(0, 100)}...</p>
                        <a href="${tourLink}" class="text-blue-600 hover:underline font-semibold">View Details</a>
                    </div>
                </div>
            `;
        }).join('\n');

        htmlContent = htmlContent.replace(/\${toursList}/g, `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">${toursHtml}</div>`);
        htmlContent = htmlContent.replace(/\${hero\.background_image}/g, '/assets/images/background.jpeg');

        const processedHeaderHtml = await getProcessedHeaderHtml(dataDirPath, { currentPage: 'home', generateDropdowns: true });
        htmlContent = insertHeaderIntoPage(htmlContent, processedHeaderHtml);

        writeFileSync(path.join(outputBaseDir, 'index.html'), htmlContent);
        console.log('Generated index.html');

    } catch (error) {
        console.error('Error generating index page:', error);
    }
}

function getAllTours(dir) {
    let tours = [];
    const categoryDirs = fs.readdirSync(dir, { withFileTypes: true });
    for (const categoryDir of categoryDirs) {
        if (categoryDir.isDirectory()) {
            const categoryPath = path.join(dir, categoryDir.name);
            const files = fs.readdirSync(categoryPath, { withFileTypes: true });
            for (const file of files) {
                const fullPath = path.join(categoryPath, file.name);
                if (!file.isDirectory() && path.extname(file.name) === '.json') {
                    const jsonData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                    tours.push(jsonData);
                }
            }
        }
    }
    return tours;
}

console.log('Starting index page generation...');
ensureGlobalAssets();
generateIndexPage();
console.log('Index page generation completed!');
