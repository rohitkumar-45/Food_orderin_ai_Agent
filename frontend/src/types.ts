export type ProviderName = "swiggy" | "zomato";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  tags: string[];
  vegetarian: boolean;
};

export type Restaurant = {
  id: string;
  provider: ProviderName;
  name: string;
  cuisine: string[];
  rating: number;
  etaMinutes: number;
  deliveryFee: number;
  menu: MenuItem[];
};

export type CartItem = {
  restaurantId: string;
  provider: ProviderName;
  itemId: string;
  name: string;
  quantity: number;
  price: number;
};

export type OrderSession = {
  id: string;
  location: string;
  providerPreference: ProviderName | "best";
  restaurants: Restaurant[];
  selectedRestaurantId?: string;
  cart: CartItem[];
  lastMessage: string;
};

export type AgentResponse = {
  session: OrderSession;
  message: string;
  suggestions: string[];
  checkoutReady: boolean;
};

export type CheckoutOrder = {
  id: string;
  provider: ProviderName;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;
  status: "draft" | "placed";
  etaMinutes: number;
};
