const fs = require('fs');
const path = require('path');

/**
 * Converts a string into a URL-friendly slug.
 * @param {string} text - The text to slugify.
 * @returns {string} The slugified text.
 */
function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w-]+/g, '')       // Remove all non-word chars (alphanumeric, underscore, hyphen)
        .replace(/--+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

/**
 * Extracts the title from the H1 tag in the first HTML string of place data.
 * This is specific to the observed structure of place JSON files.
 * @param {Array<string>} placeData - The array of HTML strings from place JSON.
 * @returns {string} The extracted title or an empty string.
 */
function extractPlaceTitleFromHtml(placeData) {
    if (placeData && placeData.length > 0) {
        const firstElement = placeData[0];
        if (typeof firstElement === 'string') {
            const match = firstElement.match(/<h1><a[^>]*>(.*?)<\/a><\/h1>/i);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
    }
    return '';
}


/**
 * Generates a list of category links.
 * @param {string} dataDirPath - Absolute path to the main 'data' directory.
 * @returns {Promise<Array<{text: string, href: string}>>} A promise that resolves to an array of category link objects.
 */
async function generateCategoryLinks(dataDirPath) {
    const categoriesDir = path.join(dataDirPath, 'categories');
    const linkObjects = [];

    try {
        const files = await fs.promises.readdir(categoriesDir);
        for (const file of files) {
            if (path.extname(file) === '.json') {
                const filePath = path.join(categoriesDir, file);
                const fileContent = await fs.promises.readFile(filePath, 'utf-8');
                const data = JSON.parse(fileContent);
                // Assuming 'name' field holds the display name for the category
                const text = data.name || 'Unnamed Category';
                const slug = slugify(path.basename(file, '.json'));
                if (slug) {
                    linkObjects.push({
                        text: text,
                        href: `/categories/${slug}/`
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error generating category links:', error);
    }
    return linkObjects;
}

/**
 * Generates a list of all tour links.
 * Tour slugs are based on filenames and should be unique.
 * @param {string} dataDirPath - Absolute path to the main 'data' directory.
 * @returns {Promise<Array<{text: string, href: string}>>} A promise that resolves to an array of tour link objects.
 */
async function generateAllTourLinks(dataDirPath) {
    const toursBaseDir = path.join(dataDirPath, 'tours');
    const linkObjects = [];
    const uniqueTourSlugs = new Set();

    try {
        const categorySubDirs = await fs.promises.readdir(toursBaseDir, { withFileTypes: true });
        for (const categoryDir of categorySubDirs) {
            if (categoryDir.isDirectory()) {
                const toursDir = path.join(toursBaseDir, categoryDir.name);
                const files = await fs.promises.readdir(toursDir);
                for (const file of files) {
                    if (path.extname(file) === '.json') {
                        const filePath = path.join(toursDir, file);
                        const fileContent = await fs.promises.readFile(filePath, 'utf-8');
                        const data = JSON.parse(fileContent);
                        // Assuming 'title.text' field holds the display name for the tour
                        const text = (data.title && data.title.text) ? data.title.text : 'Unnamed Tour';
                        const slug = slugify(path.basename(file, '.json'));

                        if (slug && !uniqueTourSlugs.has(slug)) {
                            linkObjects.push({
                                text: text,
                                href: `/tours/${slug}/`
                            });
                            uniqueTourSlugs.add(slug);
                        } else if (slug && uniqueTourSlugs.has(slug)) {
                            console.warn(`Duplicate tour slug found: ${slug} from category ${categoryDir.name}. Consider making tour filenames globally unique or adjusting slug generation.`);
                            // To handle non-unique slugs, you might prepend category:
                            // const uniqueSlug = slugify(`${categoryDir.name}-${path.basename(file, '.json')}`);
                            // href: `/tours/${uniqueSlug}/`
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error generating tour links:', error);
    }
    return linkObjects;
}

/**
 * Generates a list of place links.
 * @param {string} dataDirPath - Absolute path to the main 'data' directory.
 * @returns {Promise<Array<{text: string, href: string}>>} A promise that resolves to an array of place link objects.
 */
async function generatePlaceLinks(dataDirPath) {
    const placesDir = path.join(dataDirPath, 'places');
    const linkObjects = [];

    try {
        const files = await fs.promises.readdir(placesDir);
        for (const file of files) {
            if (path.extname(file) === '.json') {
                const filePath = path.join(placesDir, file);
                const fileContent = await fs.promises.readFile(filePath, 'utf-8');
                const data = JSON.parse(fileContent);

                // Attempt to extract title from the HTML structure in the JSON data
                // For more robust solution, place JSONs should have a dedicated title field.
                let text = extractPlaceTitleFromHtml(data);
                const slug = slugify(path.basename(file, '.json'));

                if (!text && slug) { // Fallback if title extraction fails
                    text = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Basic de-slugify and title case
                }
                if (!text) text = 'Unnamed Place';


                if (slug) {
                    linkObjects.push({
                        text: text,
                        href: `/places/${slug}/`
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error generating place links:', error);
    }
    return linkObjects;
}

module.exports = {
    slugify,
    generateCategoryLinks,
    generateAllTourLinks,
    generatePlaceLinks,
    extractPlaceTitleFromHtml
};