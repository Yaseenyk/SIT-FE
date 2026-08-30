import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * eslint-config-next 16 ships native flat configs (arrays), so they are spread directly.
 *
 * The FlatCompat shim that older Next scaffolds use crashes here with "Converting
 * circular structure to JSON" — it re-validates an already-flat config through the
 * eslintrc validator, which cannot serialise the self-referencing plugin objects.
 */
const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "out/**", "node_modules/**"],
  },
  {
    rules: {
      /*
       * A static export has no image optimiser (`images.unoptimized` in next.config.ts),
       * so next/image buys nothing over <img> for the remote Cloudinary URLs that make up
       * every photo on this site — and Cloudinary already resizes them on delivery.
       */
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
