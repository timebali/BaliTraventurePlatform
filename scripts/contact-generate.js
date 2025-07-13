// scripts/contact-generate.js
const fs = require('fs');
const path = require('path');
const { writeFileSync, copyFolderRecursive } = require('../helpers/file');
const { getProcessedHeaderHtml, insertHeaderIntoPage } = require('../helpers/templating');

const projectRoot = path.resolve(__dirname, '..');
const templateHtmlPath = path.join(projectRoot, 'templates/contact.html');
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

async function generateContactPage() {
    const dataDirPath = path.join(projectRoot, 'data');
    try {
        let htmlContent = template;

        const processedHeaderHtml = await getProcessedHeaderHtml(dataDirPath, { currentPage: 'contact', generateDropdowns: true });
        htmlContent = insertHeaderIntoPage(htmlContent, processedHeaderHtml);

        writeFileSync(path.join(outputBaseDir, 'contact.html'), htmlContent);
        console.log('Generated contact.html');

    } catch (error) {
        console.error('Error generating contact page:', error);
    }
}

console.log('Starting contact page generation...');
ensureGlobalAssets();
generateContactPage();
console.log('Contact page generation completed!');

