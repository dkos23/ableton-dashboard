require('dotenv').config();
const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');  // Add CORS middleware
const fs = require('fs/promises');
const path = require('path');
const zlib = require('zlib');
const { gunzip } = require('zlib');
const { promisify } = require('util');
const xml2js = require('xml2js');
const { Parser } = require('json2csv');

const app = express();
// const PORT = 3001;
const config = require('../config');

const inflate = promisify(zlib.inflate); // Promisify zlib's inflate function

// Enable CORS for all origins
// app.use(cors());
app.use(cors({
    origin: config.CORS_ORIGIN,
}));

// Middleware to parse JSON requests
app.use(express.json());

/**
 * Function to extract the file's modified date
 */
async function getFileDate(filePath) {
    try {
        const stats = await fs.stat(filePath); // Get file stats (including modified date)
        return stats.mtime; // Return the modified time (last modified date)
    } catch (error) {
        console.error(`Error fetching date for ${filePath}: ${error.message}`);
        return 'N/A';
    }
}

/**
 * Function to extract tempo from the GZIP-compressed XML of an Ableton .als file
 */
async function extractTempoFromAls(filePath) {
    try {
        const fileBuffer = await fs.readFile(filePath);

        // Detect gzip compression by looking at the file header
        if (fileBuffer.slice(0, 2).toString('hex') === '1f8b') {
            // File is GZIP compressed, so decompress it
            const uncompressedData = await promisify(gunzip)(fileBuffer);
            const xmlString = uncompressedData.toString('utf8');
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(xmlString);

            // Log the parsed XML structure
            // console.log('Parsed XML structure for file:', filePath);

            // Extract the tempo by looking inside the Tempo tag for the Manual value
            const tempo = findManualTempoInStructure(result);

            // Log extracted tempo
            // console.log(`Extracted tempo for file ${filePath}: ${tempo}`);
            return tempo;
        } else {
            throw new Error('File is not GZIP compressed or not in the expected format.');
        }
    } catch (error) {
        console.error(`Error extracting tempo from ${filePath}: ${error.message}`);
        return null;
    }
}

/**
 * Function to search for Ableton .als files in a directory recursively
 * Skips further recursion into subdirectories once an .als file is found.
 * Also skips directories named "Backup" and "Samples".
 * @param {string} dir - The directory to search in
 * @param {string} ext - The file extension to search for (e.g., .als)
 * @returns {Array} - Array of found project files with their paths, tempo, and dates.
 */
async function searchFiles(dir, ext) {
    let results = [];
    const list = await fs.readdir(dir, { withFileTypes: true });

    let alsFileFound = false; // Flag to track if .als file is found in the current directory

    for (const file of list) {
        const filePath = path.join(dir, file.name);

        // Skip "Backup" and "Samples" directories
        if (file.isDirectory() && (file.name === 'Backup' || file.name === 'Samples')) {
            continue;
        }

        if (file.isDirectory()) {
            // If we haven't found an .als file, keep searching in subdirectories
            if (!alsFileFound) {
                results = results.concat(await searchFiles(filePath, ext));
            }
        } else if (file.name.endsWith(ext)) {
            // Extract tempo from .als file
            const tempo = await extractTempoFromAls(filePath);
            const date = await getFileDate(filePath); // Get the file's last modified date
            results.push({ path: filePath, tempo, date });

            // Once an .als file is found, mark alsFileFound as true to skip further recursion in this directory
            alsFileFound = true;
        }
    }
    return results;
}

/**
 * API endpoint to search for Ableton .als files and their tempo
 */
app.get('/search', async (req, res) => {
    // Get the startPath from the request's query parameters
    const { startPath } = req.query;
    if (!startPath) {
        return res.status(400).json({ error: 'Start path is required' });
    }

    try {
        const files = await searchFiles(startPath, config.FILE_EXTENSION);
        const fileCount = files.length;

        // Log the total number of found files
        console.log(`Search completed. Found ${fileCount} .als files.`);

        res.json({ files, fileCount });  // Return the files and the count of found entries
    } catch (error) {
        res.status(500).json({ error: `Failed to search files: ${error.message}` });
    }
});

/**
 * Function to find the Manual tempo value in the XML structure
 */
function findManualTempoInStructure(xmlStructure) {
    // Recursively search for the "Tempo" tag in the structure
    if (!xmlStructure || typeof xmlStructure !== 'object') {
        return null;
    }

    if (xmlStructure.Tempo) {
        for (const tempoElement of xmlStructure.Tempo) {
            if (tempoElement.Manual && tempoElement.Manual[0] && tempoElement.Manual[0].$.Value) {
                return tempoElement.Manual[0].$.Value;  // Return the manual tempo value if found
            }
        }
    }

    // Recursively search all child elements
    for (const key in xmlStructure) {
        if (xmlStructure.hasOwnProperty(key) && typeof xmlStructure[key] === 'object') {
            const foundTempo = findManualTempoInStructure(xmlStructure[key]);
            if (foundTempo) {
                return foundTempo;
            }
        }
    }

    return null;
}

/**
 * API endpoint to export the fetched project files to CSV.
 */
app.get('/export-csv', async (req, res) => {
    // Get the startPath from the request's query parameters
    const { startPath } = req.query;
    if (!startPath) {
        return res.status(400).json({ error: 'Start path is required' });
    }

    try {
        // First, fetch the project files
        const files = await searchFiles(startPath, config.FILE_EXTENSION);

        // Structure the data for CSV
        const csvData = files.map((file) => ({
            projectName: file.path.split(/[/\\]/).pop().replace('.als', ''),
            tempo: file.tempo || 'N/A',
            date: file.date || 'N/A',
            path: file.path,
        }));

        // Define CSV fields
        const fields = ['projectName', 'tempo', 'date', 'path'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(csvData);

        // Set headers and send the CSV file as attachment
        res.header('Content-Type', 'text/csv');
        res.attachment('ableton_projects.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).send('Error exporting CSV');
    }
});


/**
 * API to open the Windows File Explorer at the specified file's location.
 */
app.post('/open-explorer', (req, res) => {
    const { filePath } = req.body;
  
    if (!filePath) {
      return res.status(400).json({ error: 'No file path provided' });
    }
  
    // Use path.dirname to get the directory of the file
    const directoryPath = path.dirname(filePath);
  
    // Command to open Windows Explorer at the directory path
    exec(`explorer.exe /select,"${filePath}"`, (err) => {
      if (err) {
        console.error('Error opening File Explorer:', err);
        return res.status(500).json({ error: 'Failed to open File Explorer' });
      }
  
      res.json({ message: 'File Explorer opened successfully' });
    });
  });

// Start the server
app.listen(config.PORT, () => {
    console.log(`Server is running on ${config.SERVER_URL}`);
});
