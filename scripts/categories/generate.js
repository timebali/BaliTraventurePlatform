// scripts/categories/generate.js
const fs = require('fs');
const path = require('path');
// const cheerio = require('cheerio'); // May not be needed if category JSON is clean
const { writeFileSync } = require('../../helpers/file');
const { slugify } = require('../../helpers/links');
const { bgtSrcReplacement } = require('../../helpers/image'); // For tour images listed on category page


const projectRoot = path.resolve(__dirname, '../..');
const categoryTemplatePath = path.join(projectRoot, 'Category.html');
const categoriesListTemplatePath = path.join(projectRoot, 'Categories.html'); // For /categories/index.html
const categoriesDataDir = path.join(projectRoot, 'data/categories');
const toursDataDirRoot = path.join(projectRoot, 'data/tours'); // To find tours for a category
const outputBaseDir = path.join(projectRoot, 'dist');
const assetsOutputDir = path.join(outputBaseDir, 'assets');
const categoriesOutputDir = path.join(outputBaseDir, 'categories');


let categoryTemplate = '';
let categoriesListTemplate = '';

try {
    categoryTemplate = fs.readFileSync(categoryTemplatePath, 'utf8');
    categoriesListTemplate = fs.readFileSync(categoriesListTemplatePath, 'utf8');
} catch (e) {
    console.error(`Error: Category template file(s) not found. Searched for ${categoryTemplatePath} and ${categoriesListTemplatePath}. Error: ${e.message}`);
    process.exit(1);
}

// ensureGlobalAssets function (same as before)
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
    const { copyFolderRecursive } = require('../../helpers/file');
    const imagesSource = path.join(projectRoot, 'images/images');
    const imagesDest = path.join(assetsOutputDir, 'images');
    if (fs.existsSync(imagesSource) && !fs.existsSync(imagesDest)) {
        copyFolderRecursive(imagesSource, imagesDest);
        console.log(`Copied global images to ${imagesDest}`);
    }
}

async function generateAllCategoriesPage() {
    try {
        const categoryFiles = fs.readdirSync(categoriesDataDir);
        const categoriesData = [];

        for (const file of categoryFiles) {
            if (path.extname(file) === '.json') {
                const filePath = path.join(categoriesDataDir, file);
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const data = JSON.parse(fileContent);
                const categorySlug = slugify(path.basename(file, '.json'));
                categoriesData.push({
                    name: data.name, //
                    slug: categorySlug,
                    href: `/categories/${categorySlug}/`,
                    // Assuming category JSON has a 'data.tagline.text' or similar for a brief description
                    description: data.data?.tagline?.text || 'Explore tours in this category.',
                    // And an image, e.g., from data.tourDetails[0].image.src (first tour's image as category image)
                    imageUrl: data.data?.tourDetails?.[0]?.image?.src ? `/assets/${bgtSrcReplacement(data.data.tourDetails[0].image.src, true)}` : '/assets/images/placeholder-card.jpg'
                });
            }
        }

        let htmlContent = categoriesListTemplate;
        // Assuming Categories.html template has placeholders like:
        // ${page.title}, ${meta.description}
        // and a loop structure for ${categoriesList}
        htmlContent = htmlContent.replace(/\${page\.title}/g, 'All Tour Categories');
        htmlContent = htmlContent.replace(/\${meta\.description}/g, 'Explore all tour categories offered by Bali Traventure.');

        const categoriesHtml = categoriesData.map(cat => `
            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                <a href="${cat.href}">
                    <img src="${cat.imageUrl}" alt="${cat.name}" class="w-full h-48 object-cover">
                </a>
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-2"><a href="${cat.href}" class="hover:text-blue-700">${cat.name}</a></h3>
                    <p class="text-gray-600 text-sm mb-4">${cat.description.substring(0, 100)}...</p>
                    <a href="${cat.href}" class="text-blue-600 hover:underline font-semibold">View Tours</a>
                </div>
            </div>
        `).join('\n');

        htmlContent = htmlContent.replace(/\${categoriesList}/g, `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">${categoriesHtml}</div>`);

        // URL and brand name replacements
        htmlContent = htmlContent
            .replaceAll('https://www.baligoldentour.com', 'https://balitraventure.com')
            .replaceAll('https://baligoldentour.com', 'https://balitraventure.com')
            .replaceAll('Bali Golden Tour', 'Bali Traventure');

        if (!fs.existsSync(categoriesOutputDir)) {
            fs.mkdirSync(categoriesOutputDir, { recursive: true });
        }
        const outputPath = path.join(categoriesOutputDir, 'index.html');
        writeFileSync(outputPath, htmlContent);
        console.log(`Generated All Categories Page: ${outputPath}`);

    } catch (error) {
        console.error('Error generating all categories page:', error);
    }
}


function processCategoryFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (!file.isDirectory() && path.extname(file.name) === '.json') {
            generateCategoryPage(fullPath);
        }
    }
}

function generateCategoryPage(jsonPath) {
    try {
        const categoryJsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        let htmlContent = categoryTemplate; // Use individual Category.html template

        const categorySlug = slugify(path.basename(jsonPath, '.json'));
        const categoryName = categoryJsonData.name; //

        // Populate Category.html placeholders
        htmlContent = htmlContent.replace(/\${category\.name}/g, categoryName);
        htmlContent = htmlContent.replace(/\${page\.title}/g, `${categoryName} - Bali Traventure`);
        htmlContent = htmlContent.replace(/\${meta\.description}/g, categoryJsonData.data?.tagline?.text || `Explore ${categoryName} with Bali Traventure.`);

        // Hero section for category page (example)
        // You might need specific hero image logic for categories. Using first tour image if available.
        const heroImage = categoryJsonData.data?.tourDetails?.[0]?.image?.src ? `/assets/${bgtSrcReplacement(categoryJsonData.data.tourDetails[0].image.src, true)}` : '/assets/images/placeholder-hero.jpg';
        htmlContent = htmlContent.replace(/\${hero\.image\.src}/g, heroImage);
        htmlContent = htmlContent.replace(/\${hero\.image\.alt}/g, categoryName);
        htmlContent = htmlContent.replace(/\${hero\.title}/g, categoryName);
        htmlContent = htmlContent.replace(/\${hero\.tagline}/g, categoryJsonData.data?.tagline?.text || '');


        // List tours for this category
        // The category JSON itself contains 'tourDetails'
        const toursHtml = (categoryJsonData.data?.tourDetails || []).map(tour => {
            const tourSlugFromName = slugify(tour.title.text); // Create slug from title
            const tourLink = `/tours/${tourSlugFromName}/`; // Link to the unique tour page
            const tourImage = tour.image?.src ? `/assets/${bgtSrcReplacement(tour.image.src, true)}` : '/assets/images/placeholder-card.jpg';

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

        // URL and brand name replacements
        htmlContent = htmlContent
            .replaceAll('https://www.baligoldentour.com', 'https://balitraventure.com')
            .replaceAll('https://baligoldentour.com', 'https://balitraventure.com')
            .replaceAll('Bali Golden Tour', 'Bali Traventure');

        const categoryOutputDirPath = path.join(categoriesOutputDir, categorySlug);
        if (!fs.existsSync(categoryOutputDirPath)) {
            fs.mkdirSync(categoryOutputDirPath, { recursive: true });
        }
        const outputPath = path.join(categoryOutputDirPath, 'index.html');

        writeFileSync(outputPath, htmlContent);
        console.log(`Generated Category Page: ${outputPath}`);

    } catch (error) {
        console.error(`Error processing category ${jsonPath}:`, error);
    }
}

console.log('Starting Category page generation...');
ensureGlobalAssets();
if (!fs.existsSync(categoriesOutputDir)) {
    fs.mkdirSync(categoriesOutputDir, { recursive: true });
}
generateAllCategoriesPage(); // Generate /categories/index.html
processCategoryFiles(categoriesDataDir); // Generate /categories/[slug]/index.html
console.log('Category page generation completed!');