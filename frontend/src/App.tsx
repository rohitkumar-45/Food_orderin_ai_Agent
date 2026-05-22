import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, IndianRupee, MapPin, Mic, MicOff, Plus, Send, ShoppingBag, Sparkles, Trash2, Utensils } from "lucide-react";
import { checkout, createSession, sendCommand } from "./api";
import { CheckoutOrder, OrderSession, Restaurant } from "./types";
import { useVoice } from "./useVoice";

const examples = ["search biryani on Swiggy", "add two masala dosa", "choose Pizza Yard", "checkout"];

export function App() {
  const [location, setLocation] = useState("Bengaluru");
  const [session, setSession] = useState<OrderSession | null>(null);
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState<string[]>(["Tell me what you want to eat."]);
  const [suggestions, setSuggestions] = useState(examples);
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitCommand = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setLoading(true);
    setError("");
    setOrder(null);
    setMessages((items) => [...items, `You: ${clean}`]);
    try {
      const result = await sendCommand(session?.id, clean, location);
      setSession(result.session);
      setMessages((items) => [...items, `Agent: ${result.message}`]);
      setSuggestions(result.suggestions.length ? result.suggestions : examples);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const voice = useVoice(submitCommand);

  useEffect(() => {
    createSession(location)
      .then(({ session: nextSession }) => setSession(nextSession))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not start session"));
  }, []);

  const subtotal = useMemo(() => {
    return session?.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;
  }, [session]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitCommand(command);
    setCommand("");
  }

  async function placeOrder() {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const result = await checkout(session.id);
      setOrder(result.order);
      setMessages((items) => [...items, `Agent: Order ${result.order.id} placed on ${result.order.provider}.`]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="agent-panel">
        <header className="topbar">
          <div>
            <div className="eyebrow"><Sparkles size={15} /> Voice food ordering agent</div>
            <h1>Order across Swiggy and Zomato</h1>
          </div>
          <label className="location-field">
            <MapPin size={17} />
            <input value={location} onChange={(event) => setLocation(event.target.value)} aria-label="Delivery location" />
          </label>
        </header>

        <div className="voice-console">
          <button className={`mic-button ${voice.listening ? "recording" : ""}`} onClick={voice.listening ? voice.stop : voice.start} disabled={!voice.supported}>
            {voice.listening ? <MicOff size={30} /> : <Mic size={30} />}
          </button>
          <div>
            <p className="status">{voice.supported ? (voice.listening ? "Listening..." : "Tap the mic or type a command") : "Voice unavailable in this browser"}</p>
            <p className="transcript">{voice.interimText || "Try: add two chicken biryani from Swiggy"}</p>
          </div>
        </div>

        <form className="command-bar" onSubmit={onSubmit}>
          <input value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Search, add items, choose restaurants, checkout..." />
          <button type="submit" disabled={loading || !command.trim()}><Send size={18} /> Send</button>
        </form>

        {error && <div className="error">{error}</div>}

        <div className="suggestions">
          {suggestions.map((item) => (
            <button key={item} onClick={() => submitCommand(item)}>{item}</button>
          ))}
        </div>

        <section className="messages" aria-label="Conversation">
          {messages.slice(-6).map((item, index) => (
            <p key={`${item}-${index}`} className={item.startsWith("You:") ? "user-message" : "agent-message"}>{item}</p>
          ))}
        </section>
      </section>

      <section className="results-grid">
        <div className="section-heading">
          <h2>Restaurants</h2>
          <span>{session?.restaurants.length ?? 0} matches</span>
        </div>
        <div className="restaurants">
          {(session?.restaurants ?? []).map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} selected={session?.selectedRestaurantId === restaurant.id} onCommand={submitCommand} />
          ))}
          {session?.restaurants.length === 0 && (
            <div className="empty-state"><Utensils size={24} /> Search a dish or cuisine to compare provider options.</div>
          )}
        </div>
      </section>

      <aside className="cart-panel">
        <div className="section-heading">
          <h2><ShoppingBag size={20} /> Cart</h2>
          <span>Rs {subtotal}</span>
        </div>
        <div className="cart-items">
          {(session?.cart ?? []).map((item) => (
            <div className="cart-item" key={`${item.restaurantId}-${item.itemId}`}>
              <div>
                <strong>{item.quantity} x {item.name}</strong>
                <span>{item.provider} · Rs {item.price} each</span>
              </div>
              <button aria-label={`Remove ${item.name}`} onClick={() => submitCommand(`remove ${item.name}`)}><Trash2 size={16} /></button>
            </div>
          ))}
          {session?.cart.length === 0 && <p className="muted">Add items by voice or command.</p>}
        </div>
        <button className="checkout-button" onClick={placeOrder} disabled={loading || !session?.cart.length}>
          <CheckCircle2 size={18} /> Place order
        </button>
        {order && (
          <div className="order-card">
            <strong>Order placed</strong>
            <span>{order.id} · {order.restaurantName}</span>
            <span>ETA {order.etaMinutes} min · Total Rs {order.total}</span>
          </div>
        )}
      </aside>
    </main>
  );
}

function RestaurantCard({ restaurant, selected, onCommand }: { restaurant: Restaurant; selected: boolean; onCommand: (command: string) => void }) {
  return (
    <article className={`restaurant-card ${selected ? "selected" : ""}`}>
      <div className="restaurant-head">
        <div>
          <span className={`provider ${restaurant.provider}`}>{restaurant.provider}</span>
          <h3>{restaurant.name}</h3>
        </div>
        <button onClick={() => onCommand(`choose ${restaurant.name}`)} title={`Choose ${restaurant.name}`}><Plus size={17} /></button>
      </div>
      <div className="meta">
        <span>{restaurant.rating} rating</span>
        <span><Clock3 size={14} /> {restaurant.etaMinutes} min</span>
        <span><IndianRupee size={14} /> {restaurant.deliveryFee} fee</span>
      </div>
      <p>{restaurant.cuisine.join(" · ")}</p>
      <div className="menu-list">
        {restaurant.menu.map((item) => (
          <button key={item.id} onClick={() => onCommand(`add ${item.name}`)}>
            <span>{item.name}</span>
            <strong>Rs {item.price}</strong>
          </button>
        ))}
      </div>
    </article>
  );
}
