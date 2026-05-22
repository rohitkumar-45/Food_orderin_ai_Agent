import { nanoid } from "nanoid";
import { providers } from "../providers/index.js";
import { AgentResponse, CartItem, CheckoutOrder, OrderSession, ProviderName, Restaurant } from "../types.js";
import { parseCommand } from "./commandParser.js";

const sessions = new Map<string, OrderSession>();
const orders = new Map<string, CheckoutOrder>();

export function createSession(location = "Bengaluru"): OrderSession {
  const session: OrderSession = {
    id: nanoid(),
    location,
    providerPreference: "best",
    restaurants: [],
    cart: [],
    lastMessage: "Tell me what you want to eat, or say a restaurant name."
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(sessionId: string): OrderSession | undefined {
  return sessions.get(sessionId);
}

export async function handleCommand(sessionId: string | undefined, command: string, location?: string): Promise<AgentResponse> {
  const session = sessionId ? sessions.get(sessionId) ?? createSession(location) : createSession(location);
  if (location) session.location = location;

  const parsed = parseCommand(command);
  session.providerPreference = parsed.providerPreference;

  if (parsed.intent === "clear") {
    const fresh = createSession(session.location);
    return respond(fresh, "Cart cleared. What should I search for now?", ["veg thali", "chicken biryani", "masala dosa"]);
  }

  if (parsed.intent === "help") {
    return respond(session, "Try: search biryani on Swiggy, add two masala dosa, choose Pizza Yard, or checkout.", [
      "search biryani",
      "add two veg thali",
      "checkout"
    ]);
  }

  if (parsed.intent === "checkout") {
    return respond(session, checkoutSummary(session), ["place order", "add dessert", "clear cart"], session.cart.length > 0);
  }

  if (parsed.intent === "select") {
    const restaurant = findRestaurant(session.restaurants, parsed.query);
    if (!restaurant) {
      return respond(session, "I could not match that restaurant. Search again or choose one from the list.", suggestionsFromRestaurants(session.restaurants));
    }
    session.selectedRestaurantId = restaurant.id;
    return respond(session, `Selected ${restaurant.name} on ${restaurant.provider}. What would you like to add?`, restaurant.menu.map((item) => `add ${item.name}`));
  }

  if (parsed.intent === "remove") {
    const removed = removeFromCart(session, parsed.query);
    return respond(session, removed ? `Removed ${removed.name} from your cart.` : "I could not find that item in your cart.", ["checkout", "search pizza"]);
  }

  if (parsed.intent === "add") {
    const added = addItem(session, parsed.query, parsed.quantity);
    if (added) {
      return respond(session, `Added ${added.quantity} x ${added.name} from ${added.provider}.`, ["checkout", "add another item", "search desserts"], session.cart.length > 0);
    }

    const searched = await searchRestaurants(parsed.query, session.location, parsed.providerPreference);
    session.restaurants = searched;
    const autoAdded = addItem(session, parsed.query, parsed.quantity);
    if (autoAdded) {
      return respond(session, `Found and added ${autoAdded.quantity} x ${autoAdded.name} from ${autoAdded.provider}.`, ["checkout", "add drinks"], true);
    }
    return respond(session, "I found options, but could not identify the exact item to add. Pick a restaurant or item.", suggestionsFromRestaurants(searched));
  }

  const restaurants = await searchRestaurants(parsed.query, session.location, parsed.providerPreference);
  session.restaurants = restaurants;
  session.selectedRestaurantId = restaurants[0]?.id;
  const message = restaurants.length
    ? `Found ${restaurants.length} option${restaurants.length === 1 ? "" : "s"}. Best match is ${restaurants[0].name} on ${restaurants[0].provider}.`
    : "No matches found. Try another dish or cuisine.";

  return respond(session, message, suggestionsFromRestaurants(restaurants), session.cart.length > 0);
}

export function createCheckout(sessionId: string): CheckoutOrder {
  const session = sessions.get(sessionId);
  if (!session || session.cart.length === 0) {
    throw new Error("Cart is empty or session does not exist.");
  }

  const restaurant = session.restaurants.find((item) => item.id === session.cart[0].restaurantId);
  if (!restaurant) throw new Error("Restaurant not found.");

  const subtotal = session.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxes = Math.round(subtotal * 0.05);
  const order: CheckoutOrder = {
    id: `ord_${nanoid(10)}`,
    provider: restaurant.provider,
    restaurantName: restaurant.name,
    items: session.cart,
    subtotal,
    deliveryFee: restaurant.deliveryFee,
    taxes,
    total: subtotal + restaurant.deliveryFee + taxes,
    status: "placed",
    etaMinutes: restaurant.etaMinutes
  };
  orders.set(order.id, order);
  return order;
}

function respond(session: OrderSession, message: string, suggestions: string[], checkoutReady = false): AgentResponse {
  session.lastMessage = message;
  return { session, message, suggestions, checkoutReady };
}

async function searchRestaurants(query: string, location: string, providerPreference: ProviderName | "best"): Promise<Restaurant[]> {
  const activeProviders: ProviderName[] = providerPreference === "best" ? ["swiggy", "zomato"] : [providerPreference];
  const results = await Promise.all(activeProviders.map((provider) => providers[provider].search(query, location)));
  return results.flat().sort((a, b) => b.rating - a.rating || a.deliveryFee - b.deliveryFee);
}

function findRestaurant(restaurants: Restaurant[], query: string): Restaurant | undefined {
  const normalized = query.toLowerCase();
  return restaurants.find((restaurant) => restaurant.name.toLowerCase().includes(normalized) || normalized.includes(restaurant.name.toLowerCase()));
}

function addItem(session: OrderSession, query: string, quantity: number): CartItem | undefined {
  const candidates = session.selectedRestaurantId
    ? session.restaurants.filter((restaurant) => restaurant.id === session.selectedRestaurantId)
    : session.restaurants;

  for (const restaurant of candidates) {
    const item = restaurant.menu.find((menuItem) => {
      const haystack = [menuItem.name, menuItem.description, ...menuItem.tags].join(" ").toLowerCase();
      return query.split(/\s+/).filter(Boolean).some((term) => haystack.includes(term));
    });
    if (!item) continue;

    const existing = session.cart.find((cartItem) => cartItem.restaurantId === restaurant.id && cartItem.itemId === item.id);
    if (existing) {
      existing.quantity += quantity;
      return existing;
    }

    const cartItem: CartItem = {
      restaurantId: restaurant.id,
      provider: restaurant.provider,
      itemId: item.id,
      name: item.name,
      quantity,
      price: item.price
    };
    session.cart.push(cartItem);
    return cartItem;
  }

  return undefined;
}

function removeFromCart(session: OrderSession, query: string): CartItem | undefined {
  const index = session.cart.findIndex((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  if (index === -1) return undefined;
  return session.cart.splice(index, 1)[0];
}

function suggestionsFromRestaurants(restaurants: Restaurant[]): string[] {
  return restaurants.slice(0, 4).map((restaurant) => `choose ${restaurant.name}`);
}

function checkoutSummary(session: OrderSession): string {
  if (!session.cart.length) return "Your cart is empty. Search for a dish first.";
  const subtotal = session.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return `Cart has ${session.cart.length} item type${session.cart.length === 1 ? "" : "s"} with subtotal Rs ${subtotal}. Ready to place the order.`;
}
