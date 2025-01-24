<?php

require_once 'DatabaseConnection.php';
require_once 'Logger.php';

class DataImporter {
    private $db;
    private $logger;

    public function __construct() {
        $this->logger = new Logger();
        $this->db = new DatabaseConnection($this->logger);
    }

    public function importTour($jsonFilePath) {
        try {
            $jsonData = file_get_contents($jsonFilePath);
            $tourData = json_decode($jsonData, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Invalid JSON format");
            }

            // Begin transaction
            $conn = $this->db->getConnection();
            $conn->begin_transaction();

            // Insert tour
            $tourId = $this->insertTour($tourData);
            
            // Insert places
            $this->insertPlaces($tourId, $tourData['placeDetails']);
            
            // Insert prices
            $this->insertPrices($tourId, $tourData['tourDetails']['price']);
            
            // Insert itinerary
            $this->insertItinerary($tourId, $tourData['tourDetails']['itinerary']);
            
            // Insert inclusions
            $this->insertInclusions($tourId, $tourData['tourDetails']['inclusion']);

            $conn->commit();
            $this->logger->info("Tour imported successfully");
            return true;
        } catch (Exception $e) {
            $conn->rollback();
            $this->logger->error("Import failed: " . $e->getMessage());
            return false;
        }
    }

    private function insertTour($tourData) {
        $conn = $this->db->getConnection();
        $stmt = $conn->prepare("INSERT INTO tours (title, tagline, description) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", 
            $tourData['title']['text'],
            $tourData['tagline']['text'],
            $tourData['description']['text']
        );
        $stmt->execute();
        return $stmt->insert_id;
    }

    private function insertPlaces($tourId, $places) {
        $conn = $this->db->getConnection();
        $stmt = $conn->prepare("INSERT INTO places (tour_id, name, description, image_url, link) VALUES (?, ?, ?, ?, ?)");
        
        foreach ($places as $place) {
            $stmt->bind_param("issss", 
                $tourId,
                $place['title']['text'],
                $place['description']['text'],
                $place['image']['src'],
                $place['link']['href']
            );
            $stmt->execute();
        }
    }

    private function insertPrices($tourId, $priceData) {
        $conn = $this->db->getConnection();
        $stmt = $conn->prepare("INSERT INTO prices (tour_id, type, description, amount) VALUES (?, ?, ?, ?)");
        
        // Extract prices from HTML content
        $prices = $this->extractPricesFromHtml($priceData['content']);
        
        foreach ($prices as $type => $price) {
            $stmt->bind_param("issd", 
                $tourId,
                $type,
                $price['description'],
                $price['amount']
            );
            $stmt->execute();
        }
    }

    private function extractPricesFromHtml($html) {
        // Parse HTML to extract price information
        // This is a simplified example, you may need to implement proper HTML parsing
        $prices = [];
        
        // Regular price
        if (preg_match('/Regular Tours Price.*?IDR ([\d,]+)/s', $html, $matches)) {
            $prices['regular'] = [
                'description' => 'Regular Tour Price',
                'amount' => (float)str_replace(',', '', $matches[1])
            ];
        }
        
        // Inclusive price
        if (preg_match('/Inclusive Tours Price.*?IDR ([\d,]+)/s', $html, $matches)) {
            $prices['inclusive'] = [
                'description' => 'Inclusive Tour Price',
                'amount' => (float)str_replace(',', '', $matches[1])
            ];
        }
        
        return $prices;
    }

    private function insertItinerary($tourId, $itineraryData) {
        $conn = $this->db->getConnection();
        $stmt = $conn->prepare("INSERT INTO itinerary (tour_id, time, activity) VALUES (?, ?, ?)");
        
        // Extract itinerary items from HTML
        $items = $this->extractItineraryItems($itineraryData['content']);
        
        foreach ($items as $item) {
            $stmt->bind_param("iss", 
                $tourId,
                $item['time'],
                $item['activity']
            );
            $stmt->execute();
        }
    }

    private function extractItineraryItems($html) {
        // Parse HTML to extract itinerary items
        $items = [];
        
        if (preg_match_all('/(\d{2}\.\d{2})\s*–\s*(.*?)<br>/', $html, $matches)) {
            foreach ($matches[1] as $index => $time) {
                $items[] = [
                    'time' => $time,
                    'activity' => $matches[2][$index]
                ];
            }
        }
        
        return $items;
    }

    private function insertInclusions($tourId, $inclusions) {
        $conn = $this->db->getConnection();
        $stmt = $conn->prepare("INSERT INTO inclusions (tour_id, type, content) VALUES (?, ?, ?)");
        
        foreach ($inclusions as $inclusion) {
            $type = $this->determineInclusionType($inclusion);
            $stmt->bind_param("iss", 
                $tourId,
                $type,
                $inclusion
            );
            $stmt->execute();
        }
    }

    private function determineInclusionType($content) {
        if (strpos($content, '<strong>') !== false) {
            return 'header';
        }
        if (strpos($content, '<ul>') !== false) {
            return 'list';
        }
        return 'text';
    }
}
