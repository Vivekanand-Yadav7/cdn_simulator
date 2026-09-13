const fileService = require('../services/fileService');

exports.uploadFile = async (req, res) => {
    try {
        const { name } = req.params;
        const content = req.body;
        await fileService.saveFile(`${name}.txt`, content);
        res.status(200).send("File saved to origin successfully.");
    } catch (error) {
        res.status(500).send("Error saving file: " + error.message);
    }
};

exports.downloadFile = async (req, res) => {
    try {
        const { name } = req.params;
        const content = await fileService.getFile(`${name}.txt`);
        if (content === null) {
            return res.status(404).send("File not found on origin.");
        }
        res.status(200).send(content);
    } catch (error) {
        res.status(500).send("Error retrieving file: " + error.message);
    }
};
