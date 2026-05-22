import { Restaurant } from "../types.js";

export interface FoodProvider {
  search(query: string, location: string): Promise<Restaurant[]>;
  getRestaurant(id: string): Promise<Restaurant | undefined>;
}
