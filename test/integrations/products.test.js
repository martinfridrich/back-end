
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

describe("integration test for /products route", () => {
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
  });

  after(async() => {
    //NOTE: becuase of triggers and contraints
    await Promise.all([
      db.query("delete from cart_items"),
      db.query("delete from order_items")
    ]);

    await Promise.all([
      db.query("delete from carts"),
      db.query("delete from products"),
      db.query("delete from orders"),
    ]);
  });
  describe("GET /v1/products - list products", () => {
    it("from empty database", async() => {
      //empty product table
      await db.query("DELETE FROM products");

      let res = await request(app)
        .get("/v1/products")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200);

      const body = res.body;
      expect(body).to.be.an("array");
      expect(body).to.be.lengthOf(0);
    });

    it("return array with results", async() => {
      await db.query(insertProducts);

      const res = await request(app)
        .get("/v1/products")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200);

      const body = res.body;
      expect(body).to.be.an("array");
      expect(body).to.be.lengthOf(10);
    });
  });
});
