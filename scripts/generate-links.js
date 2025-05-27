const fs = require("fs");
const path = require("path");
const { generateCategoryLinks, generateAllTourLinks, generatePlaceLinks } = require("../helpers/links");

async function main() {
    const projectRoot = __dirname; // Or process.cwd() if script is in root
    // If generate.js is in 'scripts' folder, dataDir would be path.join(projectRoot, '..', 'data')
    // For this example, let's assume 'data' is sibling to the script or its parent.
    // Adjust this path according to your actual project structure.
    const dataDir = path.join(projectRoot, 'data'); // Adjust if your script is not in the project root

    console.log('Generating Category Links...');
    const categoryLinks = await generateCategoryLinks(dataDir);
    console.log(categoryLinks);

    console.log('\nGenerating Tour Links...');
    const tourLinks = await generateAllTourLinks(dataDir);
    console.log(tourLinks);

    console.log('\nGenerating Place Links...');
    const placeLinks = await generatePlaceLinks(dataDir);
    console.log(placeLinks);

    // In your actual generate.js files, you would use these arrays
    // to pass to your HTML templating function.
    // For example, if using a simple template literal function:
    // const categoryNavHtml = categoryLinks.map(link => `<li><a href="${link.href}">${link.text}</a></li>`).join('');
}

// If running this script directly:
if (require.main === module) {
    // Before running main, ensure the 'data' directory path is correctly set.
    // For demonstration, we will assume a 'data' folder exists in the current script's directory or one level up.
    // You SHOULD replace this with the actual path to your data directory.
    let exampleDataDir = path.join(__dirname, 'data'); // Assumes data is in the same folder as this script
    if (!fs.existsSync(exampleDataDir)) {
        console.error(`ERROR: The 'data' directory was not found at ${path.join(__dirname, 'data')} or ${exampleDataDir}. Please adjust the path in the script.`);
        process.exit(1);
    }
    console.log(`Using data directory: ${exampleDataDir}`);
    main(exampleDataDir).catch(console.error);
}