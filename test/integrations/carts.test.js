
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


describe("integration test for /carts route (shooping cart)", () => {
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
  describe("GET /v1/carts/:cartId - list products", () => {
    it("non-exiting cart", async() => {
      //empty product table
      await db.query("DELETE FROM cart_items WHERE cart_id=56");
      await db.query("DELETE FROM carts WHERE id=56");

      await request(app)
        .get("/v1/carts/56")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(404);
    });

    it("retun empty cart", async() => {
      await db.query("INSERT INTO carts VALUES (1001)");

      const res = await request(app)
        .get("/v1/carts/1001")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200);

      const body = res.body;
      expect(body).to.be.an("object");
      expect(body.id).to.equal(1001);
      expect(body.totalPrice).to.equal("$0.00");
      expect(body.products).to.be.an("array");
      expect(body.products).to.be.lengthOf(0);
    });

    it("retun cart with items", async() => {
      await db.query("INSERT INTO carts VALUES (1002)");
      await db.query("INSERT INTO cart_items VALUES (1002, 1, 1, 1.00)");
      await db.query("INSERT INTO cart_items VALUES (1002, 2, 2, 4.00)");

      const res = await request(app)
        .get("/v1/carts/1002")
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200);

      const body = res.body;
      expect(body).to.be.an("object");
      expect(body.id).to.equal(1002);
      expect(body.totalPrice).to.equal("$5.00");
      expect(body.products).to.be.an("array");
      expect(body.products).to.be.lengthOf(2);
    });

    it("update cart", async() => {
      await db.query("INSERT INTO carts VALUES (1003)");
      await db.query("INSERT INTO cart_items VALUES (1003, 1, 1, 1.00)");
      await db.query("INSERT INTO cart_items VALUES (1003, 2, 2, 4.00)");

      const res = await request(app)
        .put("/v1/carts/1003")
        .send([
          {
            id: 1,
            amount: 2,
            sumPrice: 2.00
          }
        ])
        .set('Accept', 'application/json')
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200);

      const body = res.body;
      expect(body).to.be.an("object");
      expect(body.id).to.equal(1003);
      expect(body.totalPrice).to.equal("$2.00");
      expect(body.products).to.be.an("array");
      expect(body.products).to.be.lengthOf(1);
    });

    it("create new cart", async() => {
      const res = await request(app)
        .post("/v1/carts/")
        .send([
          {
            id: 1,
            amount: 2,
            sumPrice: 2.00
          },
          {
            id: 3,
            amount: 1,
            sumPrice: 3.00
          },
        ])
        .set('Accept', 'application/json')
        .expect("Content-Type", "application/json; charset=utf-8")
        .expect(200);

      const body = res.body;
      expect(body).to.be.an("object");
      expect(body).to.have.property("id");
      expect(body.totalPrice).to.equal("$5.00");
      expect(body.products).to.be.an("array");
      expect(body.products).to.be.lengthOf(2);
    });
  });
});
