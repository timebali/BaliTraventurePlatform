// scripts/helpers/templating.js
const fs = require('fs');
const path = require('path');
// Assuming linkGenerator.js is in scripts/helpers/links.js now
const { generateCategoryLinks, generateAllTourLinks, slugify } = require('./links');

const projectRoot = path.resolve(__dirname, '../'); // If templating.js is in scripts/helpers/
const headerTemplatePath = path.join(projectRoot, '/templates/partials/header.html'); // Assuming header.html is in project root

let headerTemplateCache = '';

function getHeaderTemplate() {
    if (!headerTemplateCache) {
        try {
            headerTemplateCache = fs.readFileSync(headerTemplatePath, 'utf8');
        } catch (e) {
            console.error(`FATAL ERROR: header.html not found at ${headerTemplatePath}. Please create it. Cannot proceed.`);
            // For a critical component like a header, you might want to exit if it's missing.
            process.exit(1);
        }
    }
    return headerTemplateCache;
}

/**
 * Processes the header template with dynamic data.
 * @param {string} dataDirPath - Absolute path to the main 'data' directory.
 * @param {object} options - Options like { currentPage: 'home', generateDropdowns: true }.
 * @returns {Promise<string>} The processed HTML content of the header.
 */
async function getProcessedHeaderHtml(dataDirPath, options = {}) {
    let headerOutput = getHeaderTemplate();

    const { currentPage = '', generateDropdowns = true } = options;

    let categoriesDropdownHtml = '';
    let toursDropdownHtml = '';

    if (generateDropdowns) {
        try {
            const categoryLinks = await generateCategoryLinks(dataDirPath);
            categoriesDropdownHtml = categoryLinks.map(link =>
                `<a href="${link.href}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors">${link.text}</a>`
            ).join('\n');

            const tourLinks = await generateAllTourLinks(dataDirPath);
            // Example: Show top 5 tours in dropdown, then a link to all tours
            toursDropdownHtml = tourLinks.slice(0, 5).map(link =>
                `<a href="${link.href}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors">${link.text}</a>`
            ).join('\n');
            if (tourLinks.length > 5) {
                toursDropdownHtml += `<a href="/tours/" class="block px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-blue-100 hover:text-blue-700 transition-colors">View All Tours...</a>`;
            }
        } catch (err) {
            console.error("Error generating dynamic links for header dropdowns:", err);
        }
    }

    headerOutput = headerOutput.replace(/\${header\.categoriesDropdownLinks}/g, categoriesDropdownHtml);
    headerOutput = headerOutput.replace(/\${header\.toursDropdownLinks}/g, toursDropdownHtml);

    // Handle active navigation link styling
    const navItems = ['home', 'categories', 'tours', 'about', 'contact'];
    navItems.forEach(item => {
        const activeClass = 'text-blue-200 font-semibold'; // Class for active link
        const placeholder = `\${navLinkClassActive.${item}}`;
        headerOutput = headerOutput.replace(new RegExp(escapeRegExp(placeholder), 'g'), currentPage === item ? activeClass : '');
    });

    return headerOutput;
}

// Helper to escape regex special characters in placeholders
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Inserts the processed header HTML into the main page content.
 * @param {string} mainPageContent - The HTML content of the main page.
 * @param {string} processedHeaderHtml - The HTML content of the processed header.
 * @returns {string} Main page content with header inserted.
 */
function insertHeaderIntoPage(mainPageContent, processedHeaderHtml) {
    const headerPlaceholder = '';
    if (mainPageContent.includes(headerPlaceholder)) {
        return mainPageContent.replace(headerPlaceholder, processedHeaderHtml);
    } else {
        console.warn(`Warning: Main page template does not contain '${headerPlaceholder}'. Header not inserted automatically. Ensure your template includes this placeholder or manually prepend the header.`);
        // Fallback: Prepend if placeholder is missing, assuming body structure
        // This is less ideal than a placeholder.
        // const bodyTagMatch = mainPageContent.match(/<body[^>]*>/i);
        // if (bodyTagMatch) {
        //     return mainPageContent.replace(bodyTagMatch[0], bodyTagMatch[0] + processedHeaderHtml);
        // }
        return mainPageContent;
    }
}

module.exports = {
    getProcessedHeaderHtml,
    insertHeaderIntoPage,
    slugify // Re-export if linkGenerator is not directly used by generate scripts
};