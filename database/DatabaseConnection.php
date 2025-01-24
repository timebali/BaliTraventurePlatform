<?php
require_once 'database/Logger.php';

class DatabaseConnection
{
    private $connection;
    private $logger;

    public function __construct($logger = null)
    {
        $this->logger = $logger ?? new Logger();
        $this->connect();
    }

    private function connect()
    {
        try {
            $this->connection = new mysqli(
                'localhost',
                'root',
                'root',
                'tourtravel',
                null,
                '/Applications/MAMP/tmp/mysql/mysql.sock'
            );

            if ($this->connection->connect_error) {
                throw new Exception("Connection failed: " . $this->connection->connect_error);
            }

            $this->logger->info("Database connection established");
        } catch (Exception $e) {
            $this->logger->error("Database connection error: " . $e->getMessage());
            throw $e;
        }
    }

    public function getConnection()
    {
        return $this->connection;
    }

    public function close()
    {
        if ($this->connection) {
            $this->connection->close();
            $this->logger->info("Database connection closed");
        }
    }
}
