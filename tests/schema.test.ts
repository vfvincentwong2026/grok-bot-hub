import { describe, it, expect } from "vitest";
import schema from "../a2a/schema.json";

describe("A2A schema", () => {
  it("declares protocol const A2A-v1", () => {
    expect(schema.properties.protocol.const).toBe("A2A-v1");
  });

  it("has required fields", () => {
    expect(schema.required).toEqual(
      expect.arrayContaining(["protocol", "target_bot", "payload"]),
    );
  });

  it("defines agentCard and a2aResponse", () => {
    expect(schema.$defs.agentCard).toBeDefined();
    expect(schema.$defs.a2aResponse).toBeDefined();
  });
});
