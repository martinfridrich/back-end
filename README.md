# Back-end 

## !!!WARN: All developmet should be done inside docker container

## Development

### Database requirements

* `docker-compose run api-dev`
* Development database: `dcent-dev`, user: `postgres`, password: `pwd1234`
* Test database: `dcent-test`, user: `postgres`, password: `pwd1234`
* run `sql/crateTables.sql` for both databases. For development run `sql/insertProducts.sql`

### Service development

* `docker-compose build api-dev`
* `docker-compose run db-dev`
* `docker-compose run api-dev`
* `npm i`
* `npm start` - run service for development
* `mocha /test/integrations` 

For manual testing use collection from `postman/collection.json`
