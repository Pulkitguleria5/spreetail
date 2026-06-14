const express = require("express");

const router = express.Router();

const multer = require("multer");

const {
    importCsv,
    importExecute
} = require(
    "../controllers/importController"
);

const upload = multer({
    dest: "uploads/"
});

router.post(
    "/csv",
    upload.single("file"),
    importCsv
);

router.post(
    "/execute",
    importExecute
);

module.exports = router;