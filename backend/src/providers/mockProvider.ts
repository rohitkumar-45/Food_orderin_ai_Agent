import { restaurants } from "../data/mockRestaurants.js";
import { FoodProvider } from "./provider.js";
import { ProviderName, Restaurant } from "../types.js";

export class MockFoodProvider implements FoodProvider {
  constructor(private readonly provider: ProviderName) {}

  async search(query: string, _location: string): Promise<Restaurant[]> {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

    return restaurants
      .filter((restaurant) => restaurant.provider === this.provider)
      .filter((restaurant) => {
        if (terms.length === 0) return true;
        const haystack = [
          restaurant.name,
          ...restaurant.cuisine,
          ...restaurant.menu.flatMap((item) => [item.name, ...item.tags])
        ]
          .join(" ")
          .toLowerCase();
        return terms.some((term) => haystack.includes(term));
      })
      .sort((a, b) => b.rating - a.rating || a.etaMinutes - b.etaMinutes);
  }

  async getRestaurant(id: string): Promise<Restaurant | undefined> {
    return restaurants.find((restaurant) => restaurant.provider === this.provider && restaurant.id === id);
  }
}
