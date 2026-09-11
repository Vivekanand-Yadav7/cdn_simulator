const express = require("express");
const contentController = require("../controllers/contentController");

const router = express.Router();

router.get("/:filename", contentController.getContent);

module.exports = router;
