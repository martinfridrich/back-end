const createError = require("http-errors");
const express = require("express");
const router = express.Router();

const queries = {
  "getAllOrders": "SELECT o.*, oi.amount, oi.sum_price, p.id AS pId, p.name AS pName, p.price as pPrice FROM orders AS o LEFT OUTER JOIN order_items AS oi ON o.id = oi.order_id LEFT OUTER JOIN products AS p ON oi.product_id=p.id ORDER BY o.id",
  "getCartOnly": "SELECT c.* FROM carts AS c  WHERE c.id=$1",
  "getOneOrder": "SELECT o.*, oi.amount, oi.sum_price, p.id AS pId, p.name AS pName, p.price as pPrice FROM orders AS o LEFT OUTER JOIN order_items AS oi ON o.id = oi.order_id LEFT OUTER JOIN products AS p ON oi.product_id=p.id WHERE o.id=$1",
}

router.get("/", async(req, res, next) => {
  const db = req.app.db;

  try {
    const resultSet = await db.query(queries.getAllOrders);

    return res.status(200).json(renderOrders(resultSet.rows)).end;
  } catch (err) {
    console.log(err);
    if (err.code) {
      return res.status(400).json({
        code: err.code,
        message: err.detail
      });
    }

    return next(createError(500));
  }

});

router.post("/carts/:cartId", async(req, res, next) => {
  const db = req.app.db;
  const cartId = req.params.cartId;

  try {
    let resultSet = await db.query(queries.getCartOnly, [cartId]);
    if (resultSet.rowCount === 0) {
      return next(createError(404, "cart not found"));
    }

    await db.query("INSERT INTO orders SELECT * FROM carts WHERE id=$1", [cartId]);
    await db.query("INSERT INTO order_items SELECT * FROM cart_items WHERE cart_id=$1", [cartId]);
    await db.query("DELETE FROM carts WHERE id=$1", [cartId]);

    //cartId === orderId
    resultSet = await db.query(queries.getOneOrder, [cartId]);

    return res.status(200).json(renderOrders(resultSet.rows)[0]).end();
  } catch(err) {
    console.log(err);
    if (err.code) {
      return res.status(400).json({
        code: err.code,
        message: err.detail
      });
    }

    return next(createError(500));
  }
});

function renderOrders(ordersData) {
  const orders = {};

  for (let i = 0, l = ordersData.length; i < l; i++) {
    if (!orders[ordersData[i].id]) {
      orders[ordersData[i].id] = {
        "id": ordersData[i].id,
        "totalPrice": ordersData[i].total_price,
        "products": []
      }
    }

    orders[ordersData[i].id].products.push({
      "id": ordersData[i].pid,
      "amount": ordersData[i].amount,
      "unitPrice": ordersData[i].pprice,
      "sumPrice": ordersData[i].sum_price
    })
  }

  return Object.values(orders);
}

function renderOneOrder(orderData) {
  const products = [];
  orderData.forEach((item) => {
    if (item.pid) {
      products.push({
        "id": item.pid,
        "amount": item.amount,
        "unitPrice": item.pprice,
        "sumPrice": item.sum_price
      });
    }
  });

  return {
    "id": orderData[0].id,
    "totalPrice": orderData[0].total_price,
    "products": products
  }
}

module.exports = router;
