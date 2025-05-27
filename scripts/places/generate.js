const fs = require('fs');
const path = require('path');
const { writeFileSync, copyFolderRecursive } = require('../../helpers/file'); // Assuming writeFileSync creates dirs
const { slugify, extractPlaceTitleFromHtml } = require('../../helpers/links');

const projectRoot = path.resolve(__dirname, '../..'); // Assuming scripts are in scripts/entity/
const templateHtmlPath = path.join(projectRoot, 'PlaceTwo.html'); // Template in project root
const placesDataDir = path.join(projectRoot, 'data/places');
const outputBaseDir = path.join(projectRoot, 'dist');
const assetsOutputDir = path.join(outputBaseDir, 'assets');
const placesOutputDir = path.join(outputBaseDir, 'places');

// Read template HTML
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
    // Copy style.js
    const styleJsSource = path.join(projectRoot, 'scripts/tailwindcss-v3.4.16.js');
    const styleJsDest = path.join(assetsOutputDir, 'style.js');
    if (fs.existsSync(styleJsSource) && !fs.existsSync(styleJsDest)) {
        fs.copyFileSync(styleJsSource, styleJsDest);
        console.log(`Copied global style.js to ${styleJsDest}`);
    }

    // Copy images folder
    const imagesSource = path.join(projectRoot, 'images/images'); // Source: project_root/images/images
    const imagesDest = path.join(assetsOutputDir, 'images');
    if (fs.existsSync(imagesSource) && !fs.existsSync(imagesDest)) {
        copyFolderRecursive(imagesSource, imagesDest);
        console.log(`Copied global images to ${imagesDest}`);
    }
}

function processPlaceFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            processPlaceFiles(fullPath);
        } else if (path.extname(file.name) === '.json') {
            generatePlacePage(fullPath);
        }
    }
}

function generatePlacePage(jsonPath) {
    try {
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        let htmlContent = template;

        const placeSlug = slugify(path.basename(jsonPath, '.json'));
        const pageTitle = extractPlaceTitleFromHtml(jsonData) || placeSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Populate basic template fields (more would require richer JSON data)
        htmlContent = htmlContent.replace(/\${page\.title}/g, pageTitle);
        htmlContent = htmlContent.replace(/\${meta\.description}/g, `Explore ${pageTitle} with Bali Traventure.`); // Placeholder

        // Hero section placeholders (using static/generic data due to lack of it in place.json)
        // You'll need to provide actual image paths relative to /assets/images/
        htmlContent = htmlContent.replace(/\${hero\.image\.src}/g, '/assets/images/placeholder-hero.jpg'); // Generic placeholder
        htmlContent = htmlContent.replace(/\${hero\.image\.alt}/g, pageTitle);
        htmlContent = htmlContent.replace(/\${hero\.title\.text}/g, pageTitle);
        htmlContent = htmlContent.replace(/\${hero\.title\.tooltip}/g, pageTitle);
        htmlContent = htmlContent.replace(/\${hero\.tagline\.text}/g, 'Discover the wonders of this amazing place.'); // Generic tagline
        htmlContent = htmlContent.replace(/\${hero\.tagline\.tooltip}/g, 'Discover the wonders of this amazing place.');

        htmlContent = htmlContent.replace(/\${sectionTitle}/g, `About ${pageTitle}`); // Placeholder

        // Handle the main content (array of HTML strings)
        const contents = (jsonData || [])
            .map((item) => `${item}`) // Removed the div wrapper for more flexible content
            .join('\n');
        htmlContent = htmlContent.replace(/\${contents}/g, contents);

        // Map placeholders (static for now)
        htmlContent = htmlContent.replace(/\${map\.title}/g, `Location of ${pageTitle}`);
        htmlContent = htmlContent.replace(/\${map\.iframeSrc}/g, 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3944.636661129298!2d115.26070001478369!3d-8.600000093802283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOMKwMzYnMDAuMCJTIDExNcKwMTUnMzguNSJF!5e0!3m2!1sen!2sid!4v1620000000000!5m2!1sen!2sid'); // Generic map

        // URL and brand name replacements
        htmlContent = htmlContent
            .replaceAll('https://www.baligoldentour.com', 'https://balitraventure.com')
            .replaceAll('https://baligoldentour.com', 'https://balitraventure.com')
            .replaceAll('Bali Golden Tour', 'Bali Traventure');

        const placeOutputDirPath = path.join(placesOutputDir, placeSlug);
        if (!fs.existsSync(placeOutputDirPath)) {
            fs.mkdirSync(placeOutputDirPath, { recursive: true });
        }
        const outputPath = path.join(placeOutputDirPath, 'index.html');

        writeFileSync(outputPath, htmlContent);
        console.log(`Generated Place: ${outputPath}`);

    } catch (error) {
        console.error(`Error processing ${jsonPath}:`, error);
    }
}

// Start processing
console.log('Starting Place page generation...');
ensureGlobalAssets(); // Ensure global assets are copied once
if (!fs.existsSync(placesOutputDir)) {
    fs.mkdirSync(placesOutputDir, { recursive: true });
}
processPlaceFiles(placesDataDir);
console.log('Place page generation completed!');