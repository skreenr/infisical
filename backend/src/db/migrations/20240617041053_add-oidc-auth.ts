import { Knex } from "knex";

import { TableName } from "../schemas";

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(TableName.OidcConfig))) {
    await knex.schema.createTable(TableName.OidcConfig, (tb) => {
      tb.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      tb.string("issuer").notNullable();
      tb.string("authorizationEndpoint").notNullable();
      tb.string("jwksUri").notNullable();
      tb.string("tokenEndpoint").notNullable();
      tb.string("userinfoEndpoint").notNullable();
      tb.text("encryptedClientId").notNullable();
      tb.string("clientIdIV").notNullable();
      tb.string("clientIdTag").notNullable();
      tb.text("encryptedClientSecret").notNullable();
      tb.string("clientSecretIV").notNullable();
      tb.string("clientSecretTag").notNullable();
      tb.boolean("isActive").notNullable();
      tb.timestamps(true, true, true);
      tb.uuid("orgId").notNullable().unique();
      tb.foreign("orgId").references("id").inTable(TableName.Organization);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TableName.OidcConfig);
}