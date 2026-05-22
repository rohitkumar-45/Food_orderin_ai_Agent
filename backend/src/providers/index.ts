import { MockFoodProvider } from "./mockProvider.js";

export const providers = {
  swiggy: new MockFoodProvider("swiggy"),
  zomato: new MockFoodProvider("zomato")
};
