import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, IndianRupee, MapPin, Mic, MicOff, Plus, RefreshCw, Send, ShoppingBag, Sparkles, Trash2, Utensils, Wifi } from "lucide-react";
import { checkout, createSession, getHealth, sendCommand } from "./api";
import { CheckoutOrder, OrderSession, Restaurant } from "./types";
import { useVoice } from "./useVoice";

const examples = ["search biryani on Swiggy", "add two masala dosa", "choose Pizza Yard", "checkout"];
type ConnectionState = "checking" | "online" | "offline";

export function App() {
  const [location, setLocation] = useState("Bengaluru");
  const [session, setSession] = useState<OrderSession | null>(null);
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState<string[]>(["Tell me what you want to eat."]);
  const [suggestions, setSuggestions] = useState(examples);
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState<ConnectionState>("checking");
  const [providerMode, setProviderMode] = useState("mock");

  async function bootSession(currentLocation = location) {
    setConnection("checking");
    setError("");
    try {
      const [health, created] = await Promise.all([getHealth(), createSession(currentLocation)]);
      setConnection(health.ok ? "online" : "offline");
      setProviderMode(health.mode);
      setSession(created.session);
      setMessages((items) => [...items, "Agent: Connected to the ordering backend."]);
    } catch (err) {
      setConnection("offline");
      setError(err instanceof Error ? `Backend connection failed: ${err.message}` : "Backend connection failed");
    }
  }

  const submitCommand = async (text: string) => {
    const clean = text.trim();
    if (!clean || loading || connection === "offline") return;
    setLoading(true);
    setError("");
    setOrder(null);
    setMessages((items) => [...items, `You: ${clean}`]);
    try {
      const result = await sendCommand(session?.id, clean, location);
      setSession(result.session);
      setMessages((items) => [...items, `Agent: ${result.message}`]);
      setSuggestions(result.suggestions.length ? result.suggestions : examples);
      if (shouldPlaceOrder(clean) && result.session.cart.length > 0) {
        await placeOrder(result.session.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const voice = useVoice(submitCommand);

  useEffect(() => {
    void bootSession();
  }, []);

  const subtotal = useMemo(() => {
    return session?.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;
  }, [session]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitCommand(command);
    setCommand("");
  }

  async function placeOrder(sessionId = session?.id) {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const result = await checkout(sessionId);
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
          <div className="topbar-actions">
            <span className={`connection-pill ${connection}`}>
              <Wifi size={15} /> {connection === "online" ? `Backend online - ${providerMode}` : connection === "checking" ? "Connecting..." : "Backend offline"}
            </span>
            <label className="location-field">
              <MapPin size={17} />
              <input value={location} onChange={(event) => setLocation(event.target.value)} onBlur={() => void bootSession(location)} aria-label="Delivery location" />
            </label>
          </div>
        </header>

        <div className="voice-console">
          <button className={`mic-button ${voice.listening ? "recording" : ""}`} onClick={voice.listening ? voice.stop : voice.start} disabled={!voice.supported || loading || connection !== "online"}>
            {voice.listening ? <MicOff size={30} /> : <Mic size={30} />}
          </button>
          <div>
            <p className="status">{loading ? "Agent is working..." : voice.supported ? (voice.listening ? "Listening..." : "Tap the mic or type a command") : "Voice unavailable in this browser"}</p>
            <p className="transcript">{voice.interimText || (connection === "online" ? "Try: add two chicken biryani from Swiggy" : "Reconnect to continue ordering")}</p>
          </div>
        </div>

        <form className="command-bar" onSubmit={onSubmit}>
          <input value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Search, add items, choose restaurants, checkout..." disabled={connection !== "online"} />
          <button type="submit" disabled={loading || !command.trim() || connection !== "online"}><Send size={18} /> Send</button>
        </form>

        {error && (
          <div className="error">
            <span>{error}</span>
            <button onClick={() => void bootSession()}><RefreshCw size={15} /> Retry</button>
          </div>
        )}

        <div className="suggestions">
          {suggestions.map((item) => (
            <button key={item} onClick={() => submitCommand(item)} disabled={loading || connection !== "online"}>{item}</button>
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
            <RestaurantCard key={restaurant.id} restaurant={restaurant} selected={session?.selectedRestaurantId === restaurant.id} disabled={loading || connection !== "online"} onCommand={submitCommand} />
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
                <span>{item.provider} - Rs {item.price} each</span>
              </div>
              <button aria-label={`Remove ${item.name}`} onClick={() => submitCommand(`remove ${item.name}`)} disabled={loading || connection !== "online"}><Trash2 size={16} /></button>
            </div>
          ))}
          {session?.cart.length === 0 && <p className="muted">Add items by voice or command.</p>}
        </div>
        <button className="checkout-button" onClick={() => placeOrder()} disabled={loading || !session?.cart.length}>
          <CheckCircle2 size={18} /> Place order
        </button>
        {order && (
          <div className="order-card">
            <strong>Order placed</strong>
            <span>{order.id} - {order.restaurantName}</span>
            <span>ETA {order.etaMinutes} min - Total Rs {order.total}</span>
          </div>
        )}
      </aside>
    </main>
  );
}

function RestaurantCard({ restaurant, selected, disabled, onCommand }: { restaurant: Restaurant; selected: boolean; disabled: boolean; onCommand: (command: string) => void }) {
  return (
    <article className={`restaurant-card ${selected ? "selected" : ""}`}>
      <div className="restaurant-head">
        <div>
          <span className={`provider ${restaurant.provider}`}>{restaurant.provider}</span>
          <h3>{restaurant.name}</h3>
        </div>
        <button onClick={() => onCommand(`choose ${restaurant.name}`)} title={`Choose ${restaurant.name}`} disabled={disabled}><Plus size={17} /></button>
      </div>
      <div className="meta">
        <span>{restaurant.rating} rating</span>
        <span><Clock3 size={14} /> {restaurant.etaMinutes} min</span>
        <span><IndianRupee size={14} /> {restaurant.deliveryFee} fee</span>
      </div>
      <p>{restaurant.cuisine.join(" - ")}</p>
      <div className="menu-list">
        {restaurant.menu.map((item) => (
          <button key={item.id} onClick={() => onCommand(`add ${item.name}`)} disabled={disabled}>
            <span>{item.name}</span>
            <strong>Rs {item.price}</strong>
          </button>
        ))}
      </div>
    </article>
  );
}

function shouldPlaceOrder(command: string) {
  return /\b(place order|confirm order|order now)\b/i.test(command);
}
