import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gmailComposeUrl, initials, mapsHref, telHref } from "./utils.ts";

/**
 * Unit tests for the pure helpers.
 *
 * Only the ones with real logic. `formatDate` is a thin wrapper over
 * `toLocaleDateString`, whose output depends on the ICU data the runtime ships, so
 * asserting an exact string there tests the platform rather than this code.
 */

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    assert.equal(initials("Aditi Sharma"), "AS");
    assert.equal(initials("Rohan Kumar Patil"), "RK");
  });

  it("handles a single name", () => {
    assert.equal(initials("Aditi"), "A");
  });

  it("strips the brackets from seeded placeholder names", () => {
    // The seed data ships "[President Name]"; "[P" as an avatar looks like a bug.
    assert.equal(initials("[President Name]"), "PN");
  });

  it("survives an empty string rather than throwing", () => {
    assert.equal(initials(""), "");
    assert.equal(initials("   "), "");
  });
});

describe("telHref", () => {
  it("strips the spaces a human-readable number contains", () => {
    // "tel:0231 265 8613" does not dial; the spaces have to go.
    assert.equal(telHref("0231 265 8613"), "tel:02312658613");
  });
});

describe("mapsHref", () => {
  it("encodes the address", () => {
    const href = mapsHref("BSIET, Kolhapur");
    assert.ok(href.includes("BSIET%2C%20Kolhapur"));
  });
});

describe("gmailComposeUrl", () => {
  it("encodes the subject and body into the query", () => {
    const url = new URL(gmailComposeUrl("a@b.com", "Re: hello", "line one\nline two"));
    assert.equal(url.searchParams.get("to"), "a@b.com");
    assert.equal(url.searchParams.get("su"), "Re: hello");
    // The newline must survive encoding, or every reply arrives as one long line.
    assert.equal(url.searchParams.get("body"), "line one\nline two");
  });
});
