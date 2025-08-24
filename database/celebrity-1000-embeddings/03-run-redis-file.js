const fs = require('fs');
const { createClient } = require('redis');

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const OUTPUT_DIR = "output";
const INPUT_FILE = path.join(__dirname, OUTPUT_DIR, "celebs.redis");
const ERROR_LOG_FILE = 'error.log';

// Statistics tracking
let totalCommands = 0;
let successfulCommands = 0;
let failedCommands = 0;
let startTime = Date.now();

/**
 * Parse command line by removing problematic characters and splitting
 * @param {string} command - The raw Redis command string
 * @returns {Array} - Array of command parts
 */
function parseCommand(command) {
    let cleanCommand = command;

    // Simple split by space, but handle quoted strings
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = null;

    for (let i = 0; i < cleanCommand.length; i++) {
        const char = cleanCommand[i];

        // Handle quote start/end
        if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
            continue;
        }

        if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = null;
            continue;
        }

        // Space outside quotes
        if (char === ' ' && !inQuotes) {
            if (current) {
                parts.push(current);
                current = '';
            }
        } else {
            current += char;
        }
    }

    if (current) {
        parts.push(current);
    }

    return parts;
}

/**
 * Execute a Redis command using the client
 * @param {Object} redisClient - Redis client instance
 * @param {string} command - The raw Redis command string
 * @returns {Promise<boolean>} - Success status
 */
async function executeRedisCommand(redisClient, command) {
    try {
        // Parse the command properly
        const commandParts = parseCommand(command);

        // Use the parsed command parts
        await redisClient.sendCommand(commandParts);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Log error to file
 * @param {string} line - The original command line
 * @param {string} error - Error message
 */
function logError(line, error) {
    const timestamp = new Date().toISOString();
    const errorEntry = `[${timestamp}] FAILED: ${line.trim()}\nError: ${error}\n\n`;
    fs.appendFileSync(ERROR_LOG_FILE, errorEntry);
}

/**
 * Main execution function
 */
async function main() {
    console.log('Starting Redis command execution...');
    console.log(`Input file: ${INPUT_FILE}`);
    console.log(`Error log: ${ERROR_LOG_FILE}`);
    console.log(`Redis URL: ${REDIS_URL}`);
    console.log('---');

    // Create Redis client
    const redisClient = createClient({
        url: REDIS_URL
    });

    try {
        // Connect to Redis
        await redisClient.connect();
        console.log('Connected to Redis successfully');

        // Read file line by line
        const fileStream = fs.createReadStream(INPUT_FILE, { encoding: 'utf8' });
        const rl = require('readline').createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let lineNumber = 0;

        for await (const line of rl) {
            lineNumber++;
            totalCommands++;

            // Skip empty lines
            if (!line.trim()) {
                continue;
            }

            // Execute the command
            try {
                const success = await executeRedisCommand(redisClient, line.trim());

                if (success) {
                    successfulCommands++;
                    if (lineNumber % 100 === 0) {
                        console.log(`Processed ${lineNumber} commands... (${successfulCommands} successful, ${failedCommands} failed)`);
                    }
                } else {
                    failedCommands++;
                    logError(line, 'Command execution failed');
                    console.log(`Line ${lineNumber}: Command failed`);
                }
            } catch (error) {
                failedCommands++;
                logError(line, error.message);
                console.log(`Line ${lineNumber}: Error - ${error.message}`);
            }
        }

        // Final statistics
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        console.log('\n--- Execution Complete ---');
        console.log(`Total commands processed: ${totalCommands}`);
        console.log(`Successful commands: ${successfulCommands}`);
        console.log(`Failed commands: ${failedCommands}`);
        console.log(`Success rate: ${((successfulCommands / totalCommands) * 100).toFixed(2)}%`);
        console.log(`Duration: ${duration.toFixed(2)} seconds`);
        console.log(`Average speed: ${(totalCommands / duration).toFixed(2)} commands/second`);

        if (failedCommands > 0) {
            console.log(`\nFailed commands have been logged to: ${ERROR_LOG_FILE}`);
        }

    } catch (error) {
        console.error('Fatal error:', error.message);
        process.exit(1);
    } finally {
        // Close Redis connection
        await redisClient.quit();
        console.log('Redis connection closed');
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Run the main function
if (require.main === module) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = {
    executeRedisCommand,
    logError,
    parseCommand
};
