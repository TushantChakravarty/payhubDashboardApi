const redis = require('redis');
const { promisify } = require('util');

// Create and configure the Redis client
const redisClient = redis.createClient({
    host: 'localhost', // Replace with your Redis server host
    port: 6379,        // Replace with your Redis port if different
    password: '12345678987654321', // Replace with your Redis password if required
});

// Connect to Redis
function connectRedis() {
    // Promisify Redis methods for async/await
    redisClient.getAsync = promisify(redisClient.get).bind(redisClient);
    redisClient.setAsync = promisify(redisClient.set).bind(redisClient);
    
    // Log connection status
    redisClient.on('connect', () => {
        console.log('Connected to Redis server');
    });
    
    redisClient.on('error', (err) => {
        console.error('Redis connection error:', err);
    });
}

// Function to get cached user details
async function getCachedUserDetails(query, dao) {
    try {
        const redisKey = `userData:${query.emailId}`;
    
        // Step 1: Try to fetch user data from Redis
        const cachedData = await redisClient.getAsync(redisKey);
    
        if (cachedData) {
            // Step 2: If data is found in cache, return it
            //console.log("Cache hit", cachedData);
            
            return JSON.parse(cachedData);
        } else {
            // Step 3: If data is not in cache, query the database
            console.log("Cache miss");
            const userData = await dao.getUserDetails(query);
    
            // Step 4: Cache the user data in Redis with an expiration time
            const CACHE_EXPIRY = 60; // Expire after 1 min
            await redisClient.setAsync(redisKey, JSON.stringify(userData), 'EX', CACHE_EXPIRY);
    
            return userData;
        }
    } catch (error) {
        console.error("Error accessing Redis or database:", error);
        // Fall back to querying the database in case of Redis failure
        return await dao.getUserDetails(query);
    }
}

// Export functions
module.exports = {
    getCachedUserDetails,
    connectRedis,
};
