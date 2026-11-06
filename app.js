const $ = id => document.getElementById(id);
const PHONE = "919972426009";

// Fallback image: prevents broken image icons
const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
  <rect width="900" height="600" fill="#e7efeb"/>
  <path d="M250 300c90-115 250-145 390-45l100-75v240l-100-75c-140 100-300 70-390-45z" fill="#8baeb0"/>
  <path d="M250 300 145 205v190z" fill="#5d858b"/>
  <circle cx="620" cy="275" r="13" fill="#102d3b"/>
  <path d="M330 350c100 45 190 45 280 0" fill="none" stroke="#d9eeee" stroke-width="12" stroke-linecap="round"/>
  <text x="450" y="500" text-anchor="middle" font-family="Arial" font-size="28" fill="#34535b">Fresh seafood</text>
  </svg>`);

// Default fish inventory
const DEFAULT_FISH = [
  {
    id: 1,
    name: "Seer Fish",
    price: 950,
    available: true,
    image: "https://images.unsplash.com/photo-1510130387422-82bed34b37e9?auto=format&fit=crop&w=900&q=85"
  },
  {
    id: 2,
    name: "Red Snapper",
    price: 620,
    available: true,
    image: "https://images.pexels.com/photos/8351892/pexels-photo-8351892.jpeg?auto=compress&cs=tinysrgb&w=900"
  },
  {
    id: 3,
    name: "King Fish",
    price: 850,
    available: false,
    image: "https://nagabazaar.com/cdn/shop/collections/Capture12.png?v=1779555304&width=1200"
  },
  {
    id: 4,
    name: "Sardines",
    price: 240,
    available: true,
    image: "https://images.pexels.com/photos/36122228/pexels-photo-36122228.jpeg?auto=compress&cs=tinysrgb&w=900"
  }
];

// Local storage
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

let fish = read("mandaadi_fish", DEFAULT_FISH);
let orders = read("mandaadi_orders", []);
let bag = [];
let filter = "all";

// Update default photos for existing visitors.
// Preserve their saved prices and availability.
const defaultImages = Object.fromEntries(
  DEFAULT_FISH.map(item => [item.id, item.image])
);

fish = fish.map(item =>
  defaultImages[item.id]
    ? { ...item, image: defaultImages[item.id] }
    : item
);

function save() {
  localStorage.setItem("mandaadi_fish", JSON.stringify(fish));
  localStorage.setItem("mandaadi_orders", JSON.stringify(orders));
}

const money = n =>
  "₹" + Number(n || 0).toLocaleString("en-IN");

// Render fish catalogue
function renderFish() {
  const q = $("search").value.toLowerCase();

  const list = fish.filter(f =>
    (filter === "all" ||
      (filter === "available" ? f.available : !f.available)) &&
    f.name.toLowerCase().includes(q)
  );

  $("fishGrid").innerHTML = list.length
    ? list.map(f => `
      <article class="fish-card">

        <div class="fish-img">

          <img
            src="${f.image || FALLBACK_IMAGE}"
            alt="${f.name}"
            loading="lazy"
            onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'"
          >

          <span class="availability ${f.available ? "available" : "unavailable"}">
            ${f.available ? "AVAILABLE TODAY" : "CURRENTLY UNAVAILABLE"}
          </span>

        </div>

        <div class="fish-info">

          <small>MANDAADI DAILY CATCH</small>

          <h3>${f.name}</h3>

          <div class="fish-bottom">

            <span class="price">
              ${money(f.price)} <span>/ kg</span>
            </span>

            <button
              class="add"
              data-bag="${f.id}"
              ${!f.available ? "disabled" : ""}
            >
              ${f.available ? "＋ Add to bag" : "Not available"}
            </button>

          </div>

        </div>
      </article>
    `).join("")
    : '<div class="empty">No fish match your search.</div>';
}

// Availability filters
$("filters").addEventListener("click", e => {
  const b = e.target.closest("[data-filter]");
  if (!b) return;

  filter = b.dataset.filter;

  document.querySelectorAll("[data-filter]").forEach(x =>
    x.classList.toggle("selected", x === b)
  );

  renderFish();
});

$("search").addEventListener("input", renderFish);

// Notifications
function toast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");

  setTimeout(() =>
    $("toast").classList.remove("show"), 1800
  );
}

// Add fish to shopping bag
$("fishGrid").addEventListener("click", e => {
  const b = e.target.closest("[data-bag]");
  if (!b) return;

  const f = fish.find(x => x.id === Number(b.dataset.bag));
  if (!f?.available) return;

  const old = bag.find(x => x.id === f.id);

  old ? old.qty++ : bag.push({ ...f, qty: 1 });

  renderBag();
  toast("Added to your bag");
});

// Render shopping bag
function renderBag() {
  $("bagCount").textContent =
    bag.reduce((s, x) => s + x.qty, 0);

  $("drawerCount").textContent = $("bagCount").textContent;

  $("bagItems").innerHTML = bag.length
    ? bag.map(x => `
      <div class="bag-line">

        <span>
          <strong>${x.name}</strong><br>
          ${x.qty} kg × ${money(x.price)}
        </span>

        <span>
          ${money(x.price * x.qty)}<br>
          <button data-remove="${x.id}">Remove</button>
        </span>

      </div>
    `).join("")
    : '<div class="empty">Your bag is empty. Add available fish to begin.</div>';
}

// Remove fish from bag
$("bagItems").addEventListener("click", e => {
  const b = e.target.closest("[data-remove]");
  if (!b) return;

  bag = bag.filter(x => x.id !== Number(b.dataset.remove));
  renderBag();
});

// Shopping drawer
function showDrawer(on) {
  $("drawer").classList.toggle("open", on);
  $("shade").classList.toggle("show", on);
}

$("bagOpen").onclick = () => showDrawer(true);
$("bagClose").onclick = () => showDrawer(false);
$("shade").onclick = () => showDrawer(false);

// WhatsApp order enquiry
$("sendOrder").onclick = () => {

  if (!bag.length) {
    toast("Add fish before sending an enquiry");
    return;
  }

  const id = "MD" + Date.now().toString().slice(-6);

  const items = bag.map(x => ({
    fishId: x.id,
    name: x.name,
    qty: x.qty,
    price: x.price
  }));

  const total = items.reduce(
    (s, x) => s + x.qty * x.price, 0
  );

  const order = {
    id,
    items,
    total,
    status: "Pending",
    created: new Date().toISOString()
  };

  orders.unshift(order);
  save();

  const lines = items.map(x =>
    `- ${x.name}: ${x.qty} kg`
  ).join("\n");

  const msg =
    `Hello Mandaadi, I would like to enquire about this fish order.\n` +
    `Order ID: ${id}\n${lines}\n` +
    `Estimated total: ${money(total)}\n` +
    `Please confirm availability, final price and delivery details.`;

  window.open(
    `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`,
    "_blank",
    "noopener"
  );

  bag = [];
  renderBag();
  showDrawer(false);

  toast("Enquiry created — awaiting confirmation");
};

// Admin dashboard
$("adminOpen").onclick = () => {
  renderAdmin();
  $("adminModal").classList.add("open");
};

$("adminClose").onclick = () =>
  $("adminModal").classList.remove("open");

// Admin tabs
document.querySelector(".admin-tabs").addEventListener("click", e => {

  const b = e.target.closest("[data-tab]");
  if (!b) return;

  document.querySelectorAll(".tab").forEach(x =>
    x.classList.toggle("active", x === b)
  );

  document.querySelectorAll(".admin-panel").forEach(x =>
    x.classList.remove("active")
  );

  $(b.dataset.tab + "Panel").classList.add("active");

  renderAdmin();
});

// Add fish from admin dashboard
$("fishForm").addEventListener("submit", e => {
  e.preventDefault();

  fish.unshift({
    id: Date.now(),
    name: $("fishName").value.trim(),
    price: Number($("fishPrice").value),
    available: true,
    image: $("fishImage").value.trim() || FALLBACK_IMAGE
  });

  save();
  e.target.reset();

  renderAdmin();
  renderFish();

  toast("Fish added to catalogue");
});

// Update availability
$("inventoryList").addEventListener("click", e => {

  const b = e.target.closest("[data-stock]");
  if (!b) return;

  const f = fish.find(x => x.id === Number(b.dataset.stock));
  if (!f) return;

  f.available = !f.available;

  save();
  renderAdmin();
  renderFish();

  toast(f.name + " availability updated");
});

// Update order status
$("ordersList").addEventListener("change", e => {

  const s = e.target.closest("[data-status]");
  if (!s) return;

  const o = orders.find(x => x.id === s.dataset.status);

  if (o) {
    o.status = s.value;
    o.updated = new Date().toISOString();

    save();
    renderAdmin();

    toast("Order status updated");
  }
});

// Admin dashboard statistics
function renderAdmin() {

  const today = new Date().toDateString();

  const todays = orders.filter(
    o => new Date(o.created).toDateString() === today
  );

  // Only delivered orders count as revenue
  const delivered = todays.filter(
    o => o.status === "Delivered"
  );

  const revenue = delivered.reduce(
    (s, o) => s + o.total, 0
  );

  $("metricRevenue").textContent = money(revenue);
  $("metricOrders").textContent = todays.length;
  $("metricDelivered").textContent = delivered.length;

  $("metricPending").textContent =
    todays.filter(o => o.status === "Pending").length;

  // Inventory list
  $("inventoryList").innerHTML = fish.length
    ? fish.map(f => `
      <div class="inventory-row">

        <div>
          <strong>${f.name}</strong>

          <small>
            ${money(f.price)} / kg •
            ${f.available ? "Available" : "Unavailable"}
          </small>
        </div>

        <div class="row-actions">

          <button class="mini" data-stock="${f.id}">
            ${f.available ? "Mark unavailable" : "Mark available"}
          </button>

        </div>

      </div>
    `).join("")
    : '<div class="empty">No fish added yet.</div>';

  // Order rows
  const row = o => `
    <div class="order-row">

      <div>
        <strong>${o.id}</strong>

        <small>
          ${new Date(o.created).toLocaleString()} •
          ${o.items.map(i =>
            i.name + " × " + i.qty + "kg"
          ).join(", ")}
        </small>

        <small>
          Estimated order value: ${money(o.total)}
        </small>
      </div>

      <div class="row-actions">

        <span class="status ${statusClass(o.status)}">
          ${o.status}
        </span>

        <select data-status="${o.id}">
          <option ${o.status === "Pending" ? "selected" : ""}>Pending</option>
          <option ${o.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
          <option ${o.status === "Delivered" ? "selected" : ""}>Delivered</option>
          <option ${o.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
        </select>

      </div>

    </div>
  `;

  $("recentOrders").innerHTML = todays.length
    ? todays.slice(0, 5).map(row).join("")
    : '<div class="empty">No order enquiries today.</div>';

  $("ordersList").innerHTML = orders.length
    ? orders.map(row).join("")
    : '<div class="empty">No orders received yet.</div>';
}

// Order status styling
function statusClass(s) {
  return {
    Pending: "s-pending",
    Confirmed: "s-confirmed",
    Delivered: "s-delivered",
    Cancelled: "s-cancelled"
  }[s] || "s-pending";
}

// Initialize application
renderFish();
renderBag();
renderAdmin();