const createError = require("http-errors");
const express = require("express");
const logger = require("morgan");
const pg = require("pg");

const app = express();

app.use(logger(":remote-addr \":method :url HTTP/:http-version\" :status"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const productsRouter = require("./routes/products");
const ordersRouter = require("./routes/orders");
const cartsRouter = require("./routes/carts");
const healthzRouter = require("./routes/healthz");

const config = require(`./config/${app.get("env")}/`);

app.db = new pg.Pool({
  ...config.database,
  password: process.env.DB_PASSWORD,
});

app.use("/v1/products", productsRouter);
app.use("/v1/orders", ordersRouter);
app.use("/v1/carts", cartsRouter);

app.use("/healthz", healthzRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    "code": err.code || err.status || 500,
    "message": err.message,
  }).end();
});

module.exports = app;
