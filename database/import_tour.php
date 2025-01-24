<?php

require_once 'DataImporter.php';

// Path to JSON file
$jsonFilePath = __DIR__ . '/../data/tours/full_day_tour/bali_bedugul_and_tanah_lot_tour_-_bali_full_day_tours.json';

try {
    $importer = new DataImporter();
    $result = $importer->importTour($jsonFilePath);
    
    if ($result) {
        echo "Tour imported successfully!\n";
    } else {
        echo "Tour import failed. Check logs for details.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
