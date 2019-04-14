const createError = require("http-errors");
const express = require("express");
const router = express.Router();

router.get("/", async(req, res, next) => {
  const db = req.app.db;

  try {
    const resultSet = await db.query("SELECT * FROM products");

    return res.status(200).json(resultSet.rows);
  } catch (err)  {
    console.error(err);

    return next(createError(500));
  }
});

module.exports = router;
