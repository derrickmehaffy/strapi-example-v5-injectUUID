"use strict";

const { randomUUID } = require("crypto");

const contentTypes = ["api::blah.blah"];
const uuidFieldName = "uuid";

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }) {
    for (let i = 0; i < contentTypes.length; i++) {
      strapi.contentTypes[contentTypes[i]].attributes[uuidFieldName] = {
        type: "string",
      };
    }
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    for (let i = 0; i < contentTypes.length; i++) {
      const view = await strapi.db.query("strapi::core-store").findOne({
        where: {
          key: `plugin_content_manager_configuration_content_types::${contentTypes[i]}`,
        },
      });

      let value = JSON.parse(view.value);
      console.log(value?.metadatas);

      if (value?.metadatas[uuidFieldName]) {
        value.metadatas[uuidFieldName].edit = {
          label: "UUID",
          description: "Automatically generated UUID",
          placeholder: "",
          visible: true,
          editable: false,
        };
      }

      await strapi.db.query("strapi::core-store").update({
        where: { id: view.id },
        data: {
          value: JSON.stringify(value) || value.toString(),
        },
      });

      strapi.documents.use(async (ctx, next) => {
        if (
          contentTypes.includes(ctx?.contentType?.uid) &&
          ctx?.action === "create"
        ) {
          console.log(ctx.args[0]);
          if (!ctx.args[0].data[uuidFieldName]) {
            ctx.args[0].data[uuidFieldName] = randomUUID();
          }
        }

        return next();
      });
    }
  },
};
