<?php

class Logger {
    private $logFile;
    private $dbConnection;

    public function __construct($dbConnection = null, $logFile = 'import.log') {
        $this->logFile = __DIR__ . '/../logs/' . $logFile;
        $this->dbConnection = $dbConnection;
        $this->ensureLogDirectory();
    }

    private function ensureLogDirectory() {
        $logDir = dirname($this->logFile);
        if (!file_exists($logDir)) {
            mkdir($logDir, 0755, true);
        }
    }

    public function log($level, $message, $context = []) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] [$level] $message";
        
        if (!empty($context)) {
            $logEntry .= " " . json_encode($context);
        }
        
        // Always write to file
        file_put_contents($this->logFile, $logEntry . PHP_EOL, FILE_APPEND);
        
        // Write to database only if connection exists
        if ($this->dbConnection) {
            $this->logToDatabase($level, $message, $context);
        }
    }

    private function logToDatabase($level, $message, $context) {
        try {
            $query = "INSERT INTO logs (level, message, context) VALUES (?, ?, ?)";
            $stmt = $this->dbConnection->prepare($query);
            $contextJson = json_encode($context);
            $stmt->bind_param('sss', $level, $message, $contextJson);
            $stmt->execute();
        } catch (Exception $e) {
            // Log database errors to file
            $this->log('ERROR', 'Failed to write to database: ' . $e->getMessage());
        }
    }

    public function info($message, $context = []) {
        $this->log('INFO', $message, $context);
    }

    public function warning($message, $context = []) {
        $this->log('WARNING', $message, $context);
    }

    public function error($message, $context = []) {
        $this->log('ERROR', $message, $context);
    }
}
