import { Restaurant } from "../types.js";

export const restaurants: Restaurant[] = [
  {
    id: "swg-biryani-house",
    provider: "swiggy",
    name: "Biryani House",
    cuisine: ["Hyderabadi", "Biryani", "Kebab"],
    rating: 4.5,
    etaMinutes: 28,
    deliveryFee: 39,
    address: "Koramangala 5th Block, Bengaluru",
    latitude: 12.9352,
    longitude: 77.6245,
    menu: [
      {
        id: "chicken-biryani",
        name: "Chicken Dum Biryani",
        description: "Aromatic basmati rice, tender chicken, raita",
        price: 289,
        tags: ["biryani", "chicken", "spicy"],
        vegetarian: false
      },
      {
        id: "paneer-biryani",
        name: "Paneer Biryani",
        description: "Paneer cubes, saffron rice, salan",
        price: 249,
        tags: ["biryani", "paneer", "veg"],
        vegetarian: true
      }
    ]
  },
  {
    id: "zmt-pizza-yard",
    provider: "zomato",
    name: "Pizza Yard",
    cuisine: ["Italian", "Pizza"],
    rating: 4.3,
    etaMinutes: 34,
    deliveryFee: 29,
    address: "Indiranagar 100 Feet Road, Bengaluru",
    latitude: 12.9784,
    longitude: 77.6408,
    menu: [
      {
        id: "margherita",
        name: "Margherita Pizza",
        description: "Mozzarella, basil, tomato sauce",
        price: 229,
        tags: ["pizza", "cheese", "veg"],
        vegetarian: true
      },
      {
        id: "pepper-chicken",
        name: "Pepper Chicken Pizza",
        description: "Chicken, peppers, smoked cheese",
        price: 349,
        tags: ["pizza", "chicken"],
        vegetarian: false
      }
    ]
  },
  {
    id: "swg-dosa-corner",
    provider: "swiggy",
    name: "Dosa Corner",
    cuisine: ["South Indian", "Breakfast"],
    rating: 4.6,
    etaMinutes: 22,
    deliveryFee: 25,
    address: "Jayanagar 4th Block, Bengaluru",
    latitude: 12.925,
    longitude: 77.5938,
    menu: [
      {
        id: "masala-dosa",
        name: "Masala Dosa",
        description: "Crisp dosa with potato masala, chutneys, sambar",
        price: 139,
        tags: ["dosa", "breakfast", "veg"],
        vegetarian: true
      },
      {
        id: "idli-vada",
        name: "Idli Vada Combo",
        description: "Steamed idli, medu vada, chutney, sambar",
        price: 119,
        tags: ["idli", "vada", "breakfast", "veg"],
        vegetarian: true
      }
    ]
  },
  {
    id: "zmt-thali-point",
    provider: "zomato",
    name: "Thali Point",
    cuisine: ["North Indian", "Thali"],
    rating: 4.4,
    etaMinutes: 31,
    deliveryFee: 35,
    address: "HSR Layout Sector 2, Bengaluru",
    latitude: 12.9116,
    longitude: 77.6389,
    menu: [
      {
        id: "veg-thali",
        name: "Veg Thali",
        description: "Dal, paneer, sabzi, rice, roti, dessert",
        price: 199,
        tags: ["thali", "north indian", "veg"],
        vegetarian: true
      },
      {
        id: "butter-chicken",
        name: "Butter Chicken Meal",
        description: "Butter chicken, rice, roti, salad",
        price: 299,
        tags: ["chicken", "north indian", "meal"],
        vegetarian: false
      }
    ]
  }
];
