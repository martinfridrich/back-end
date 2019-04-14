const createError = require("http-errors");
const express = require("express");
const router = express.Router();
const Ajv = require("ajv");
const ajv = new Ajv();

const schemas = {
  "newCart": require("./../jsonSchemas/newCart.json")
};

const validators = {
  "newCart": ajv.compile(schemas.newCart)
};

const queries = {
  "getCart": "SELECT c.*, ci.amount, ci.sum_price, p.id AS pId, p.name AS pName, p.price as pPrice FROM carts AS c LEFT OUTER JOIN cart_items AS ci ON c.id = ci.cart_id LEFT OUTER JOIN products AS p ON ci.product_id=p.id WHERE c.id=$1",
  "insertCart": "INSERT INTO carts (total_price) VALUES (0) RETURNING id",
  "insertCartProducts": "INSERT INTO cart_items (cart_id, product_id, amount, sum_price) VALUES ",
  "deleteAllCartProducts": "DELETE FROM cart_items WHERE cart_id=$1",
}

router.get("/:cartId", async(req, res, next) => {
  const db = req.app.db;
  const cartId = req.params.cartId;

  try {
    const resultSet = await db.query(queries.getCart, [cartId]);

    if (resultSet.rowCount === 0) {
      return next(createError(404));
    }

    res.status(200).json(renderCart(resultSet.rows)).end();
  } catch (err) {
    console.error(err);
    return next(createError(500));
  }
});

//create new cart
router.post("/", async(req, res, next) => {
  const db = req.app.db;
  const items = req.body;

  const valid = validators.newCart(items);
  if (!valid) {
    return res.status(400).json({
      code: "400",
      errors: validators.newCart.errors,
      message: "validation error"
    });
  }

  try {
    let resultSet = await db.query(queries.insertCart);
    const cartId = resultSet.rows[0].id;

    const [q, params] = getInsertCartProductQuery(cartId, req.body);
    await db.query(q, params);

    resultSet = await db.query(queries.getCart, [cartId]);

    return res.status(200).json(renderCart(resultSet.rows));
  } catch (err) {
    console.error(err);
    if (err.code) {
      return res.status(400).json({
        code: err.code,
        message: err.detail
      });
    }

    return next(createError(500));
  }
});

//update existing cart
router.put("/:cartId", async(req, res, next) => {
  const db = req.app.db;
  const cartId = req.params.cartId;
  const items = req.body;

  try {
    let resultSet = await db.query(queries.getCart, [cartId]);
    if (resultSet.rowCount === 0) {
      return next(createError(404, "cart not found"));
    }

    const valid = validators.newCart(items);
    if (!valid) {
      return res.status(400).json({
        code: "400",
        errors: validators.newCart.errors,
        message: "validation error"
      });
    }

    await db.query(queries.deleteAllCartProducts, [cartId]);
    const [q, params] = getInsertCartProductQuery(cartId, items);
    await db.query(q, params);

    resultSet = await db.query(queries.getCart, [cartId]);

    return res.status(200).json(renderCart(resultSet.rows));
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      code: err.code,
      message: err.detail
    });

    return next(createError(500));
  }
});

function getInsertCartProductQuery(cartId, items) {
  let values = "";
  const params = [];
  for (let i = 0, j=0, l = items.length; i < l; i++, j += 4) {
    values += `${(j!=0) ? ", ": ""}($${j+1}, $${j+2}, $${j+3}, $${j+4})`;

    params.push(cartId, items[i].id, items[i].amount, items[i].sumPrice);
  }

  const q = queries.insertCartProducts + values;

  return [q, params];
}

function renderCart(cartData) {
  const products = [];
  cartData.forEach((item) => {
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
    "id": cartData[0].id,
    "totalPrice": cartData[0].total_price,
    "products": products
  }
}


module.exports = router;
