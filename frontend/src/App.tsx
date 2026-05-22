import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, IndianRupee, LocateFixed, LogIn, MapPin, Mic, MicOff, Plus, RefreshCw, Send, ShoppingBag, Sparkles, Trash2, UserPlus, Utensils, Wifi } from "lucide-react";
import { checkout, createSession, getHealth, sendCommand, signin, signup } from "./api";
import { CheckoutOrder, OrderSession, Restaurant, User } from "./types";
import { useVoice } from "./useVoice";

const examples = ["search biryani on Swiggy", "add two masala dosa", "choose Pizza Yard", "checkout"];
type ConnectionState = "checking" | "online" | "offline";

export function App() {
  const [location, setLocation] = useState("Bengaluru");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [session, setSession] = useState<OrderSession | null>(null);
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState<string[]>(["Tell me what you want to eat."]);
  const [suggestions, setSuggestions] = useState(examples);
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState<ConnectionState>("checking");
  const [providerMode, setProviderMode] = useState("mock");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("food-agent-user");
    return saved ? (JSON.parse(saved) as User) : null;
  });
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });

  async function bootSession(currentLocation = location, nextLatitude = latitude, nextLongitude = longitude, nextUser = user) {
    setConnection("checking");
    setError("");
    try {
      const [health, created] = await Promise.all([getHealth(), createSession(currentLocation, nextLatitude, nextLongitude, nextUser?.id)]);
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
      const result = await sendCommand(session?.id, clean, location, latitude, longitude, user?.id);
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

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result =
        authMode === "signup"
          ? await signup(authForm.name, authForm.email, authForm.password)
          : await signin(authForm.email, authForm.password);
      setUser(result.user);
      localStorage.setItem("food-agent-user", JSON.stringify(result.user));
      setMessages((items) => [...items, `Agent: Signed in as ${result.user.name}.`]);
      await bootSession(location, latitude, longitude, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    localStorage.removeItem("food-agent-user");
    setUser(null);
    setMessages((items) => [...items, "Agent: Signed out."]);
    void bootSession(location, latitude, longitude, null);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Your browser does not support location access.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = position.coords.latitude;
        const nextLongitude = position.coords.longitude;
        setLatitude(nextLatitude);
        setLongitude(nextLongitude);
        setLocation("Current location");
        setMessages((items) => [...items, "Agent: Location detected. Restaurants are now sorted by distance."]);
        void bootSession("Current location", nextLatitude, nextLongitude);
        setLoading(false);
      },
      () => {
        setError("Location permission denied. Enter your area manually or allow location access.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

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
            <button className="location-button" onClick={useCurrentLocation} disabled={loading}>
              <LocateFixed size={16} /> Use live location
            </button>
          </div>
        </header>

        <section className="auth-panel">
          {user ? (
            <div className="signed-in">
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <button onClick={signOut}>Sign out</button>
            </div>
          ) : (
            <form onSubmit={submitAuth}>
              <div className="auth-tabs">
                <button type="button" className={authMode === "signin" ? "active" : ""} onClick={() => setAuthMode("signin")}><LogIn size={15} /> Sign in</button>
                <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}><UserPlus size={15} /> Sign up</button>
              </div>
              {authMode === "signup" && (
                <input value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} placeholder="Name" />
              )}
              <input value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="Email" type="email" />
              <input value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="Password" type="password" />
              <button type="submit" disabled={loading}>{authMode === "signup" ? "Create account" : "Sign in"}</button>
            </form>
          )}
        </section>

        <div className="voice-console">
          <button className={`mic-button ${voice.listening ? "recording" : ""}`} onClick={voice.listening ? voice.stop : voice.start} disabled={!voice.supported || loading || connection !== "online"}>
            {voice.listening ? <MicOff size={30} /> : <Mic size={30} />}
          </button>
          <div>
            <p className="status">{loading ? "Agent is working..." : voice.supported ? (voice.listening ? "Listening..." : "Tap the mic or type a command") : "Voice unavailable in this browser"}</p>
            <p className="transcript">{voice.interimText || (connection === "online" ? "Try: search nearest biryani, add one, then say place order" : "Reconnect to continue ordering")}</p>
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
        {typeof restaurant.distanceKm === "number" && <span>{restaurant.distanceKm.toFixed(1)} km away</span>}
        <span><Clock3 size={14} /> {restaurant.etaMinutes} min</span>
        <span><IndianRupee size={14} /> {restaurant.deliveryFee} fee</span>
      </div>
      <p className="address">{restaurant.address}</p>
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
