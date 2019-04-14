DROP TABLE IF EXISTS "products";
DROP SEQUENCE IF EXISTS products_id_seq;
CREATE SEQUENCE products_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;

CREATE TABLE "public"."products" (
    "id" integer DEFAULT nextval('products_id_seq') PRIMARY KEY,
    "name" character(255) NOT NULL,
    "description" text NOT NULL,
    "price" money NOT NULL
) WITH (oids = false);


DROP TABLE IF EXISTS "carts";
DROP SEQUENCE IF EXISTS carts_id_seq;
CREATE SEQUENCE carts_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;

CREATE TABLE "public"."carts" (
    "id" integer DEFAULT nextval('carts_id_seq') PRIMARY KEY,
    "total_price" money DEFAULT '$0.00' NOT NULL
) WITH (oids = false);

DROP TABLE IF EXISTS "cart_items";
CREATE TABLE "public"."cart_items" (
    "cart_id" integer REFERENCES carts(id)  ON DELETE CASCADE NOT DEFERRABLE NOT NULL,
    "product_id" integer REFERENCES products(id) NOT NULL,
    "amount" integer NOT NULL,
    "sum_price" money NOT NULL,
    CONSTRAINT "cart_items_cart_id_product_id" UNIQUE ("cart_id", "product_id")
) WITH (oids = false);

DROP TABLE IF EXISTS "orders";
DROP SEQUENCE IF EXISTS orders_id_seq;
CREATE SEQUENCE orders_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1;

CREATE TABLE "public"."orders" (
    "id" integer DEFAULT nextval('orders_id_seq') PRIMARY KEY,
    "total_price" money DEFAULT '$0.00' NOT NULL
) WITH (oids = false);

DROP TABLE IF EXISTS "order_items";
CREATE TABLE "public"."order_items" (
    "order_id" integer REFERENCES orders(id) NOT NULL,
    "product_id" integer REFERENCES products(id) NOT NULL,
    "amount" integer NOT NULL,
    "sum_price" money NOT NULL,
    CONSTRAINT "order_items_cart_id_product_id" UNIQUE ("order_id", "product_id")
) WITH (oids = false);


CREATE OR REPLACE FUNCTION update_cart_price_new_item()
  RETURNS trigger AS
$BODY$
BEGIN

 UPDATE carts
 SET total_price = total_price + NEW.sum_price
 WHERE id = NEW.cart_id;
 
 RETURN NEW;
END;
$BODY$

LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_cart_price_delete_item()
  RETURNS trigger AS
$BODY$
BEGIN

 UPDATE carts
 SET total_price = total_price - OLD.sum_price
 WHERE id = OLD.cart_id;
 
 RETURN NEW;
END;
$BODY$

LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_cart_price_update_item()
  RETURNS trigger AS
$BODY$
BEGIN

 UPDATE carts
 SET total_price = total_price + (NEW.sum_price - OLD.sum_price)
 WHERE id = OLD.cart_id;
 
 RETURN NEW;
END;
$BODY$

LANGUAGE plpgsql;

DELIMITER ;;
DROP TRIGGER IF EXISTS update_cart_price_new_item ON cart_items;;
CREATE TRIGGER update_cart_price_new_item
    BEFORE INSERT ON cart_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_cart_price_new_item();;

DROP TRIGGER IF EXISTS update_cart_price_update_item ON cart_items;;
CREATE TRIGGER update_cart_price_update_item
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_cart_price_update_item();;

DROP TRIGGER IF EXISTS update_cart_price_delete_item ON cart_items;;
CREATE TRIGGER update_cart_price_delete_item
    AFTER DELETE ON cart_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_cart_price_delete_item();;
DELIMITER ;
