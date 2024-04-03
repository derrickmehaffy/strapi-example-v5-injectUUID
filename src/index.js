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

  async bootstrap({ strapi }) {
    // Search through the content-type views and change the uuid attribute to be readonly
    for (let i = 0; i < contentTypes.length; i++) {
      const view = await strapi.db.query("strapi::core-store").findOne({
        where: {
          key: `plugin_content_manager_configuration_content_types::${contentTypes[i]}`,
        },
      });

      let value = JSON.parse(view.value);
      console.log(value?.metadatas);

      // Set editable to false within the content manager view (could also just remove it from the view)
      if (value?.metadatas[uuidFieldName]) {
        value.metadatas[uuidFieldName].edit = {
          label: "UUID",
          description: "Automatically generated UUID",
          placeholder: "",
          visible: true,
          editable: false,
        };
      }

      // Update the view configuration
      await strapi.db.query("strapi::core-store").update({
        where: { id: view.id },
        data: {
          value: JSON.stringify(value) || value.toString(),
        },
      });

      // Inject documentService Middleware filtering by the specific content-types and action
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
