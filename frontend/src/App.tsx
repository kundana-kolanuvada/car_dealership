import { FormEvent, useEffect, useMemo, useState } from "react";
import { request, User, Vehicle } from "./api";

type Session = { token: string; user: User };
type Modal = "purchase" | "restock" | "delete" | "vehicle" | null;
type VehicleInput = Omit<Vehicle, "id">;
type Purchase = { id: string; quantity: number; totalPrice: number; createdAt: string; vehicle: Vehicle };

const emptyVehicle: VehicleInput = { make: "", model: "", category: "Sedan", price: 0, quantity: 1 };
const categories = ["All", "Sedan", "SUV", "Sports", "Truck", "Luxury", "Electric"];
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const readSession = (): Session | null => {
  try { return JSON.parse(localStorage.getItem("autoelite-session") || "null") as Session | null; }
  catch { return null; }
};

export default function App() {
  const [session, setSession] = useState<Session | null>(readSession);
  const [screen, setScreen] = useState<"login" | "register">("login");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState("");
  const [login, setLogin] = useState({ email: "", password: "" });
  const [registration, setRegistration] = useState({ name: "", email: "", password: "" });
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [vehicleForm, setVehicleForm] = useState<VehicleInput>(emptyVehicle);
  const [editingId, setEditingId] = useState<string | null>(null);

  const isAdmin = session?.user.role === "ADMIN";
  const loadVehicles = async () => {
    try {
      const suffix = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      setVehicles((await request<{ vehicles: Vehicle[] }>(`/vehicles${suffix}`)).vehicles);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load inventory."); }
  };

  useEffect(() => { const timer = window.setTimeout(() => void loadVehicles(), 220); return () => window.clearTimeout(timer); }, [search]);

  useEffect(() => {
    if (!session) return;
    const verifySession = async () => {
      try {
        const data = await request<{ user: User }>("/auth/me", {}, session.token);
        const next = { ...session, user: data.user };
        localStorage.setItem("autoelite-session", JSON.stringify(next));
        setSession(next);
        setPurchases((await request<{ purchases: Purchase[] }>("/purchases/mine", {}, session.token)).purchases);
      } catch {
        localStorage.removeItem("autoelite-session");
        setSession(null);
        setMessage("Your session has expired. Please sign in again.");
      }
    };
    void verifySession();
  }, []);

  const list = useMemo(() => category === "All" ? vehicles : vehicles.filter((vehicle) => vehicle.category.toLowerCase() === category.toLowerCase()), [category, vehicles]);
  const stock = vehicles.reduce((sum, vehicle) => sum + vehicle.quantity, 0);
  const value = vehicles.reduce((sum, vehicle) => sum + vehicle.price * vehicle.quantity, 0);
  const categoryCount = new Set(vehicles.map((vehicle) => vehicle.category)).size;
  const close = () => { setModal(null); setSelected(null); setQuantity(1); setVehicleForm(emptyVehicle); setEditingId(null); };
  const persistSession = (value: Session) => { localStorage.setItem("autoelite-session", JSON.stringify(value)); setSession(value); };

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    try { persistSession(await request<Session>("/auth/login", { method: "POST", body: JSON.stringify(login) })); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Sign in failed."); }
  };

  const submitRegistration = async (event: FormEvent) => {
    event.preventDefault();
    try {
      persistSession(await request<Session>("/auth/register", { method: "POST", body: JSON.stringify(registration) }));
      setMessage("Account created. Welcome to AutoElite.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Registration failed."); }
  };

  const callApi = async (path: string, method: string, body?: unknown) => {
    if (!session) return;
    try { await request(path, { method, body: body ? JSON.stringify(body) : undefined }, session.token); close(); await loadVehicles(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Request failed."); }
  };

  if (!session) return <AuthScreen screen={screen} setScreen={setScreen} vehicles={vehicles} categoryCount={categoryCount} value={value} message={message} clear={() => setMessage("")} login={login} setLogin={setLogin} registration={registration} setRegistration={setRegistration} submitLogin={submitLogin} submitRegistration={submitRegistration} />;

  return <main className="app">
    <nav><a href="#inventory"><i>▱</i><strong>AutoElite</strong><small>PREMIUM DEALERSHIP</small></a><span>Inventory {isAdmin && " · Admin"}</span><div>{session.user.name}<button onClick={() => { localStorage.removeItem("autoelite-session"); setSession(null); }}>↪</button></div></nav>
    <section id="inventory"><div className="metrics"><Metric value={vehicles.length} label="Total Vehicles"/><Metric value={stock} label="In Stock"/><Metric value={categoryCount} label="Categories"/><Metric value={currency.format(value)} label="Total Value"/></div>
      <div className="tools"><label>⌕<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by make, model, category..." /></label>{isAdmin && <button className="gold" onClick={() => setModal("vehicle")}>＋ Add Vehicle</button>}</div>
      <div className="filters">{categories.map((item) => <button key={item} className={category === item ? "on" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div>
      {message && <Alert message={message} close={() => setMessage("")} />}
      <p className="count">{list.length} vehicles found</p><div className="grid">{list.map((vehicle, index) => <VehicleCard key={vehicle.id} vehicle={vehicle} tone={index % 5} admin={isAdmin} buy={() => { setSelected(vehicle); setModal("purchase"); }} stock={() => { setSelected(vehicle); setModal("restock"); }} edit={() => { setSelected(vehicle); setEditingId(vehicle.id); setVehicleForm({ ...vehicle }); setModal("vehicle"); }} remove={() => { setSelected(vehicle); setModal("delete"); }} />)}</div>
      {!isAdmin && <section className="purchase-history"><h2>My purchases</h2>{purchases.length === 0 ? <p>You have not purchased a vehicle yet.</p> : <div>{purchases.map((purchase) => <article key={purchase.id}><span>{purchase.vehicle.make} {purchase.vehicle.model} × {purchase.quantity}</span><b>{currency.format(purchase.totalPrice)}</b></article>)}</div>}</section>}
    </section>
    {modal && <div className="shade"><section className="dialog"><button className="x" onClick={close}>×</button>
      {modal === "purchase" && selected && <><Tag text={selected.category}/><h2>{selected.make} {selected.model}</h2><Row label="Availability" value={`${selected.quantity} remaining`}/><Row label="Price" value={currency.format(selected.price * quantity)}/><Quantity quantity={quantity} setQuantity={setQuantity} max={selected.quantity}/><Actions cancel={close} action={() => void callApi("/purchases", "POST", { vehicleId: selected.id, quantity })} label="Confirm Purchase"/></>}
      {modal === "restock" && selected && <><Tag text="Restock Vehicle"/><h2>{selected.make} {selected.model}</h2><Quantity quantity={quantity} setQuantity={setQuantity}/><Actions cancel={close} action={() => void callApi(`/vehicles/${selected.id}/restock`, "PATCH", { quantity })} label="Restock"/></>}
      {modal === "delete" && selected && <><Tag text="Delete Vehicle"/><h2>Remove vehicle?</h2><p>Are you sure you want to permanently remove {selected.make} {selected.model}?</p><Actions cancel={close} action={() => void callApi(`/vehicles/${selected.id}`, "DELETE")} label="Delete" danger/></>}
      {modal === "vehicle" && <form onSubmit={(event) => { event.preventDefault(); void callApi(editingId ? `/vehicles/${editingId}` : "/vehicles", editingId ? "PATCH" : "POST", vehicleForm); }}><Tag text={editingId ? "Edit Vehicle" : "Add New Vehicle"}/><h2>{editingId ? "Update details" : "Add to inventory"}</h2><div className="form"><Field label="Make" value={vehicleForm.make} change={(value) => setVehicleForm({ ...vehicleForm, make: value })}/><Field label="Model" value={vehicleForm.model} change={(value) => setVehicleForm({ ...vehicleForm, model: value })}/><label>Category<select value={vehicleForm.category} onChange={(event) => setVehicleForm({ ...vehicleForm, category: event.target.value })}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><Field label="Quantity" value={vehicleForm.quantity} type="number" change={(value) => setVehicleForm({ ...vehicleForm, quantity: Number(value) })}/><Field label="Price (USD)" value={vehicleForm.price} type="number" change={(value) => setVehicleForm({ ...vehicleForm, price: Number(value) })}/></div><Actions cancel={close} label={editingId ? "Save Changes" : "Add Vehicle"} submit/></form>}
    </section></div>}
  </main>;
}

function AuthScreen(props: { screen: "login" | "register"; setScreen: (value: "login" | "register") => void; vehicles: Vehicle[]; categoryCount: number; value: number; message: string; clear: () => void; login: { email: string; password: string }; setLogin: (value: { email: string; password: string }) => void; registration: { name: string; email: string; password: string }; setRegistration: (value: { name: string; email: string; password: string }) => void; submitLogin: (event: FormEvent) => void; submitRegistration: (event: FormEvent) => void }) {
  const register = props.screen === "register";
  return <main className="login"><section className="intro"><i>▱</i><h1>AutoElite<br/>Dealership</h1><p>Premium inventory management for discerning automotive professionals.</p><div className="facts"><Metric value={props.vehicles.length} label="Vehicles"/><Metric value={props.categoryCount} label="Categories"/><Metric value={currency.format(props.value)} label="Total value"/><Metric value="24/7" label="Access"/></div></section><section className="signin"><h2>{register ? "Create account" : "Welcome back"}</h2><p>{register ? "Join the AutoElite platform" : "Sign in to your dealership account"}</p>{props.message && <Alert message={props.message} close={props.clear}/>}<form onSubmit={register ? props.submitRegistration : props.submitLogin}>{register && <label>Full name<input required placeholder="Alexandra Chen" value={props.registration.name} onChange={(event) => props.setRegistration({ ...props.registration, name: event.target.value })}/></label>}<label>Email address<input type="email" required placeholder="you@example.com" value={register ? props.registration.email : props.login.email} onChange={(event) => register ? props.setRegistration({ ...props.registration, email: event.target.value }) : props.setLogin({ ...props.login, email: event.target.value })}/></label><label>Password<input type="password" minLength={8} required placeholder="••••••••" value={register ? props.registration.password : props.login.password} onChange={(event) => register ? props.setRegistration({ ...props.registration, password: event.target.value }) : props.setLogin({ ...props.login, password: event.target.value })}/></label><button className="gold">→ &nbsp; {register ? "Create Account" : "Sign In"}</button></form><small>{register ? "Already have an account? " : "Don’t have an account? "}<button className="link-button" onClick={() => props.setScreen(register ? "login" : "register")}>{register ? "Sign In" : "Register"}</button></small></section></main>;
}

function Metric({ value, label }: { value: string | number; label: string }) { return <div><b>{value}</b><small>{label}</small></div>; }
function Alert({ message, close }: { message: string; close: () => void }) { return <p className="alert">{message}<button onClick={close}>×</button></p>; }
function Tag({ text }: { text: string }) { return <p className="tag">{text}</p>; }
function Row({ label, value }: { label: string; value: string }) { return <p className="row"><span>{label}</span><b>{value}</b></p>; }
function Quantity({ quantity, setQuantity, max }: { quantity: number; setQuantity: (value: number) => void; max?: number }) { return <label className="quantity">Quantity<input type="number" min="1" max={max} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/></label>; }
function Field({ label, value, change, type = "text" }: { label: string; value: string | number; change: (value: string) => void; type?: string }) { return <label>{label}<input required min={type === "number" ? 0 : undefined} type={type} value={value} onChange={(event) => change(event.target.value)}/></label>; }
function Actions({ cancel, action, label, danger, submit }: { cancel: () => void; action?: () => void; label: string; danger?: boolean; submit?: boolean }) { return <div className="buttons"><button type="button" onClick={cancel}>Cancel</button><button className={danger ? "delete" : "gold"} type={submit ? "submit" : "button"} onClick={submit ? undefined : action}>{label}</button></div>; }
function VehicleCard({ vehicle, tone, admin, buy, stock, edit, remove }: { vehicle: Vehicle; tone: number; admin: boolean; buy: () => void; stock: () => void; edit: () => void; remove: () => void }) { return <article><header className={`tone t${tone}`}><b>{vehicle.category}</b><small>{vehicle.quantity} available</small><em>▱</em></header><div className="body"><h3>{vehicle.make} <span>{vehicle.model}</span></h3><p>Premium {vehicle.category.toLowerCase()} · ready for its next journey.</p><strong>{currency.format(vehicle.price)}</strong><footer><button className="gold" disabled={!vehicle.quantity} onClick={buy}>→ Purchase</button>{admin && <><button onClick={stock}>↗</button><button onClick={edit}>✎</button><button className="red" onClick={remove}>⌫</button></>}</footer></div></article>; }
