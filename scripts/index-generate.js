// At the top of your generate.js file
const fs = require('fs');
const path = require('path');
const { writeFileSync } = require('../helpers/file'); // Your existing file helper
const { getProcessedHeaderHtml, insertHeaderIntoPage } = require('../helpers/templating'); // Path to your new helper
const { slugify } = require('../helpers/links'); // If needed for other parts of the page

// ... (other requires and setup like projectRoot, dataDirPath) ...
const projectRoot = path.resolve(__dirname, '..'); // If generate.js is in scripts/
const dataDirPath = path.join(projectRoot, 'data');


async function generatePage() { // Renamed from generateHomepage for generality
    const mainTemplatePath = path.join(projectRoot, 'templates/index.html'); // Specific template for this page
    let mainPageHtml = fs.readFileSync(mainTemplatePath, 'utf8');

    // 1. Get processed header
    const headerOptions = {
        dataDirPath: dataDirPath, // Pass dataDirPath for link generation
        currentPage: 'home', // 'home', 'categories', 'tours', 'about', 'contact'
        generateDropdowns: true // Whether to populate dropdowns dynamically
    };
    const processedHeader = await getProcessedHeaderHtml(dataDirPath, headerOptions);

    // 2. Insert header into the main page template
    mainPageHtml = insertHeaderIntoPage(mainPageHtml, processedHeader);

    // 3. Prepare data for the rest of the page's placeholders (as before)
    const pageData = {
        meta: { description: "Welcome to Bali Traventure - Your ultimate guide to Bali tours and adventures." },
        page: { title: "Bali Traventure - Home" },
        hero: { /* ... hero data ... */ },
        // ... other homepage specific data ...
    };

    // 4. Replace placeholders in mainPageHtml with pageData
    // (Your existing logic for replacing ${hero.title}, ${page.title}, etc.)
    // Example:
    mainPageHtml = mainPageHtml.replace(/\${page\.title}/g, pageData.page.title);
    mainPageHtml = mainPageHtml.replace(/\${meta\.description}/g, pageData.meta.description);
    // ... and so on for all other placeholders specific to index.html ...

    // Perform global replacements like domain name, company name
    mainPageHtml = mainPageHtml
        .replaceAll('https://www.baligoldentour.com', 'https://balitraventure.com')
        .replaceAll('https://baligoldentour.com', 'https://balitraventure.com')
        .replaceAll('Bali Golden Tour', 'Bali Traventure');

    const googleAnalyticsHtml = fs.readFileSync(path.join(projectRoot, 'templates/partials/google-analytics.html'), 'utf8');
    const googleTagManagerHeadHtml = fs.readFileSync(path.join(projectRoot, 'templates/partials/google-tag-manager-head.html'), 'utf8');
    const googleTagManagerBodyHtml = fs.readFileSync(path.join(projectRoot, 'templates/partials/google-tag-manager-body.html'), 'utf8');

    mainPageHtml = mainPageHtml.replace('<!-- GOOGLE_ANALYTICS_PLACEHOLDER -->', googleAnalyticsHtml);
    mainPageHtml = mainPageHtml.replace('<!-- GOOGLE_TAG_MANAGER_HEAD_PLACEHOLDER -->', googleTagManagerHeadHtml);
    mainPageHtml = mainPageHtml.replace('<!-- GOOGLE_TAG_MANAGER_BODY_PLACEHOLDER -->', googleTagManagerBodyHtml);


    // 5. Write the final HTML file
    const outputDir = path.join(projectRoot, 'dist');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    // For index.html, output path is directly in dist
    // For other pages, it will be dist/categories/slug/index.html etc.
    const outputPath = path.join(outputDir, 'index.html');
    writeFileSync(outputPath, mainPageHtml);
    console.log(`Generated: ${outputPath}`);
}

// Call the function
generatePage().catch(console.error);