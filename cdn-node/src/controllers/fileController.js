const cacheService = require('../services/cacheService');
const originService = require('../services/originService');

exports.postFile = async (req, res) => {
    try {
        const { name } = req.params;
        const filename = `${name}.txt`;
        const content = req.body;
        
        await originService.postToOrigin(filename, content);
        res.status(200).send("File posted to origin successfully.");
    } catch (error) {
        res.status(500).send("Error posting file: " + error.message);
    }
};

exports.getFile = async (req, res) => {
    try {
        const { name } = req.params;
        const filename = `${name}.txt`;
        
        // Check cache
        const cachedContent = await cacheService.getCachedContent(filename);
        if (cachedContent !== null) {
            console.log(`Cache HIT: ${filename}`);
            res.setHeader("X-Cache", "HIT");
            return res.status(200).send(cachedContent);
        }
        
        // Cache MISS: Fetch from origin
        console.log(`Cache MISS: ${filename}`);
        const originContent = await originService.fetchFromOriginHttp(filename);
        if (originContent === null) {
            return res.status(404).send("File not found");
        }
        
        // Store retrieved content in local cache
        await cacheService.setCachedContent(filename, originContent);
        
        res.setHeader("X-Cache", "MISS");
        return res.status(200).send(originContent);
    } catch (error) {
        console.error(`Error handling file request for "${req.params.name}":`, error);
        return res.status(500).send("Internal Server Error");
    }
};
