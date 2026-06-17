# Migrations

Payload database migrations are written here.

Common commands:

```bash
npm run migrate:create -- initial-schema
npm run migrate
npm run migrate:status
```

Create migrations after changing collections, globals, fields, or blocks. Review
generated SQL before applying it to production.
