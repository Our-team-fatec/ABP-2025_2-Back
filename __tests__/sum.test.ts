import { sum } from "../src/utils/sum";

describe("sum", () => {
  it("soma dois números", () => {
    expect(sum(2, 3)).toBe(5);
  });
});
