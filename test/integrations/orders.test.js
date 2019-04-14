
const chai = require("chai");
const expect = chai.expect;
const pg = require("pg");
const request = require("supertest");

process.env.NODE_ENV="test";
const app = require("./../../app");
const config = require(`./../../config/${process.env.NODE_ENV}/`);

const db = new pg.Pool({
  ...config.database
});


const insertProducts = `
INSERT INTO "products" ("id", "name", "description", "price") VALUES
(1,'product 1','desc-1',1.00),
(2,'produc 2','desc-2',2.00),
(3,'product 3','desc-3',3.00),
(4,	'product 4','desc-4', 25),
(5,	'product 5','desc-5', 20),
(6,	'product 6','desc-6', 5.20),
(7,	'product 7','desc-7', 20.20),
(8,	'product 8','desc-8', 13.40),
(9,	'product 9','desc-9', 15.20),
(10,	'product 10','desc-10', 18.50);
`;

const insertOrders = `
INSERT INTO "orders" ("id", "total_price") VALUES
(2000, 14.00),
(2001, 3.00)
`;
const insertOrdersItems = `
INSERT INTO "order_items" ("order_id", "product_id", "amount", "sum_price") VALUES
(2000, 1, 2, 2.00),
(2000, 3, 4, 12.00),
(2001, 3, 1, 3.00)
`;


const insertCarts = `
INSERT INTO "carts" ("id", "total_price") VALUES
(3001, 0.00)
`;
const insertCartsItems = `
INSERT INTO "cart_items" ("cart_id", "product_id", "amount", "sum_price") VALUES
(3001, 1, 2, 2.00),
(3001, 3, 4, 12.00)
`;

describe("integration test for /orders route", () => {

  before(async() => {
    await Promise.all([
      db.query("delete from cart_items"),
      db.query("delete from order_items")
    ]);

    await Promise.all([
      db.query("delete from carts"),
      db.query("delete from products"),
      db.query("delete from orders"),
    ]);

    await db.query(insertProducts);
  });

  it("from empty database", async() => {
    await db.query("DELETE FROM order_items");
    await db.query("DELETE FROM orders");

    let res = await request(app)
      .get("/v1/orders")
      .expect("Content-Type", "application/json; charset=utf-8")
      .expect(200);

    const body = res.body;
    expect(body).to.be.an("array");
    expect(body).to.be.lengthOf(0);
  });

  it("retun list of orders", async() => {
    await db.query(insertOrders);
    await db.query(insertOrdersItems);

    let res = await request(app)
      .get("/v1/orders")
      .expect("Content-Type", "application/json; charset=utf-8")
      .expect(200);

    const body = res.body;
    expect(body).to.be.an("array");
    expect(body).to.be.lengthOf(2);

    expect(body[0].id).to.equal(2000);
    expect(body[0].totalPrice).to.equal("$14.00");
    expect(body[0].products).to.be.an("array");
    expect(body[0].products).to.be.lengthOf(2);

    expect(body[1].id).to.equal(2001);
    expect(body[1].totalPrice).to.equal("$3.00");
    expect(body[1].products).to.be.an("array");
    expect(body[1].products).to.be.lengthOf(1);;
  });

  describe("create order", () => {
    it("non existing cart", async() => {
      await db.query("DELETE FROM cart_items WHERE cart_id=3000");
      await db.query("DELETE FROM carts WHERE id=3000");

      await request(app)
        .get("/v1/orders/carts/3000")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(404);
    });

    it("create order", async() => {
      await db.query(insertCarts);
      await db.query(insertCartsItems);

      const res = await request(app)
        .post("/v1/orders/carts/3001")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200)

      const body = res.body;
      expect(body).to.be.an("object");
      expect(body.totalPrice).to.equal("$14.00");
      expect(body.id).to.equal(3001);
      expect(body.products).to.be.an("array");
      expect(body.products).to.be.lengthOf(2);
    });
  });
});
