// scripts/tours/generate.js
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { bgtSrcReplacement } = require('../../helpers/image'); // Assuming this is from scripts/helpers/image.js
const { writeFileSync } = require('../../helpers/file');
const { slugify } = require('../../helpers/links');
const { getProcessedHeaderHtml, insertHeaderIntoPage } = require('../../helpers/templating');

const projectRoot = path.resolve(__dirname, '../..');
const templateHtmlPath = path.join(projectRoot, 'templates/Tour.html');
const toursDataDir = path.join(projectRoot, 'data/tours');
const outputBaseDir = path.join(projectRoot, 'dist');
const assetsOutputDir = path.join(outputBaseDir, 'assets'); // For ensureGlobalAssets
const toursOutputDir = path.join(outputBaseDir, 'tours');

let template = '';
try {
    template = fs.readFileSync(templateHtmlPath, 'utf8');
} catch (e) {
    console.error(`Error: Template file not found at ${templateHtmlPath}`);
    process.exit(1);
}

// ensureGlobalAssets function (same as in places/generate.js)
// Ideally, this is called once by a master build script.
// For now, each generator can call it to ensure assets exist.
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
    // Assuming copyFolderRecursive is available via helpers/file.js
    const { copyFolderRecursive } = require('../../helpers/file');
    if (fs.existsSync(imagesSource) && !fs.existsSync(imagesDest)) {
        copyFolderRecursive(imagesSource, imagesDest);
        console.log(`Copied global images to ${imagesDest}`);
    }
}


function processTourCategoryDirs(dir) {
    const categoryDirs = fs.readdirSync(dir, { withFileTypes: true });
    for (const categoryDir of categoryDirs) {
        if (categoryDir.isDirectory()) {
            const categoryPath = path.join(dir, categoryDir.name);
            const files = fs.readdirSync(categoryPath, { withFileTypes: true });
            for (const file of files) {
                const fullPath = path.join(categoryPath, file.name);
                if (!file.isDirectory() && path.extname(file.name) === '.json') {
                    generateTourPage(fullPath);
                }
            }
        }
    }
}

async function generateTourPage(jsonPath) {
    const dataDirPath = path.join(projectRoot, 'data');
    try {
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        let htmlContent = template;

        const tourSlug = slugify(path.basename(jsonPath, '.json'));

        // Manipulate Itinerary Title with Cheerio
        const $ = cheerio.load(jsonData.tourDetails.itinerary.title || '');
        const itineraryTitleText = $('strong').html() || jsonData.tourDetails.itinerary.title || 'Itinerary';


        // Replace basic fields
        htmlContent = htmlContent.replaceAll(/\${page\.title}/g, jsonData.title.text || 'Tour Page'); // For <title> tag
        htmlContent = htmlContent.replaceAll(/\${meta\.description}/g, jsonData.tagline.text || `Details about ${jsonData.title.text}`);


        htmlContent = htmlContent.replaceAll(/\${title\.text}/g, jsonData.title.text);
        htmlContent = htmlContent.replaceAll(/\${title\.html}/g, jsonData.title.html);
        htmlContent = htmlContent.replaceAll(/\${title\.title}/g, jsonData.title.title); // used for tooltips
        htmlContent = htmlContent.replaceAll(/\${tagline\.html}/g, jsonData.tagline.html);
        htmlContent = htmlContent.replaceAll(/\${tagline\.title}/g, jsonData.tagline.title); // used for tooltips
        htmlContent = htmlContent.replaceAll(/\${description\.html}/g, jsonData.description.html);
        htmlContent = htmlContent.replaceAll(/\${tourDetails\.price\.title}/g, jsonData.tourDetails.price.title);
        htmlContent = htmlContent.replaceAll(/\${tourDetails\.price\.content}/g, jsonData.tourDetails.price.content);
        htmlContent = htmlContent.replaceAll(/\${tourDetails\.itinerary\.title}/g, itineraryTitleText);

        // Image handling: make sure bgtSrcReplacement output is a valid path from root
        // e.g. /assets/images/tour-image.jpg
        let mainImageSrc = "/assets/images/placeholder-hero.jpg"; // Default
        if (jsonData.placeDetails && jsonData.placeDetails.length > 0 && jsonData.placeDetails[0].image && jsonData.placeDetails[0].image.src) {
            // bgtSrcReplacement returns a path like 'images/path/to/image.jpg'
            // We need '/assets/images/path/to/image.jpg'
            mainImageSrc = `/assets/${bgtSrcReplacement(jsonData.placeDetails[0].image.src, true)}`;
        }
        htmlContent = htmlContent.replaceAll(/\${image.src}/g, mainImageSrc);
        htmlContent = htmlContent.replaceAll(/\${image.title}/g, (jsonData.placeDetails && jsonData.placeDetails[0].image && jsonData.placeDetails[0].image.title) || jsonData.title.text);


        const inclusionList = (jsonData.tourDetails.inclusion || [])
            .map(inclusion => `${inclusion}`) // Assuming inclusions are already HTML or plain text lines
            .join('\n');
        htmlContent = htmlContent.replace(/\${tourDetails\.inclusion}/g, inclusionList);

        const highlightsList = (jsonData.placelinks || jsonData.placeLinks || [])
            .map(linkText => {
                // Future: could generate actual links to /places/[place-slug] if data is available
                return `<li>${linkText}</li>`;
            })
            .join('\n');
        htmlContent = htmlContent.replace(/\${placelinks}/g, highlightsList);

        const placeDetailsHtml = (jsonData.placedetails || jsonData.placeDetails || [])
            .map(item => {
                const placeImageSrc = item.image && item.image.src ? `/assets/${bgtSrcReplacement(item.image.src, true)}` : '/assets/images/placeholder-card.jpg';
                const placeImageAlt = (item.image && item.image.title) || item.title.text;
                // Link to place page - generate slug from item.title.text
                const placeSlug = slugify(item.title.text);
                const placeLink = `/places/${placeSlug}/`; // Link to canonical place page

                // Removed the direct link from title to keep it clean, link should be a "learn more" or on image
                return `
                <div class="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row gap-6 items-start">
                    <div class="md:w-1/3 w-full">
                        <a href="${placeLink}"><img src="${placeImageSrc}" alt="${placeImageAlt}" class="w-full h-auto object-cover rounded-md"></a>
                    </div>
                    <div class="md:w-2/3 w-full">
                        <h4 class="text-xl font-bold mb-2"><a href="${placeLink}" class="hover:text-blue-700">${item.title.text}</a></h4>
                        <div class="text-gray-700 prose prose-sm max-w-none">${item.description.html}</div>
                    </div>
                </div>`;
            })
            .join('\n');
        htmlContent = htmlContent.replace(/\${placeDetails}/g, placeDetailsHtml);

        const itineraryContentHtml = (jsonData.tourDetails.itinerary.content || [])
            .map(({ time, event }) => `
                <div class="bg-white p-4 rounded-lg shadow">
                    <h5 class="text-md font-semibold text-blue-700 mb-1">${time?.trim()}</h5>
                    <div class="text-gray-700 prose prose-sm max-w-none">${event?.trim()}</div>
                </div>`)
            .join('\n');
        htmlContent = htmlContent.replace(/\${tourDetails\.itinerary\.content}/g, itineraryContentHtml);

        htmlContent = htmlContent
            .replaceAll('https://www.baligoldentour.com', 'https://balitraventure.com')
            .replaceAll('https://baligoldentour.com', 'https://balitraventure.com')
            .replaceAll('Bali Golden Tour', 'Bali Traventure');

        const tourOutputDirPath = path.join(toursOutputDir, tourSlug);
        if (!fs.existsSync(tourOutputDirPath)) {
            fs.mkdirSync(tourOutputDirPath, { recursive: true });
        }
        const outputPath = path.join(tourOutputDirPath, 'index.html');

        const processedHeaderHtml = await getProcessedHeaderHtml(dataDirPath, { currentPage: 'tours', generateDropdowns: true });
        htmlContent = insertHeaderIntoPage(htmlContent, processedHeaderHtml);

        writeFileSync(outputPath, htmlContent);
        console.log(`Generated Tour: ${outputPath}`);

    } catch (error) {
        console.error(`Error processing ${jsonPath}:`, error);
    }
}

console.log('Starting Tour page generation...');
ensureGlobalAssets();
if (!fs.existsSync(toursOutputDir)) {
    fs.mkdirSync(toursOutputDir, { recursive: true });
}
processTourCategoryDirs(toursDataDir);
console.log('Tour page generation completed!');