import { defineHandler } from "nitro/h3";
import { useDocs } from "../docs.ts";

export default defineHandler(async () => {
  const docs = await useDocs();
  return {
    title: "Nitro",
    toc: docs.tree,
  };
});
