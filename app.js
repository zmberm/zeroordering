const storageKey = "zero-customer-order";

let menu = [];

const currency = new Intl.NumberFormat("en-GB", {
  currency: "GBP",
  style: "currency"
});

function readState() {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
  return saved || {
    cart: {},
    category: "All",
    query: "",
    fulfilment: "Collection",
    promo: ""
  };
}

const state = readState();
const $ = (selector) => document.querySelector(selector);
const menuGrid = $("#menu-grid");
const menuTemplate = $("#menu-card-template");

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function byId(id) {
  return menu.find((item) => item.id === id);
}

function totalQuantity() {
  return Object.values(state.cart).reduce((sum, quantity) => sum + quantity, 0);
}

function subtotal() {
  return Object.entries(state.cart).reduce((sum, [id, quantity]) => {
    const item = byId(id);
    return item ? sum + item.price * quantity : sum;
  }, 0);
}

function deliveryFee() {
  return subtotal() && state.fulfilment === "Delivery" ? 2.5 : 0;
}

function orderingFee() {
  return subtotal() ? 1 : 0;
}

function discountFor(amount) {
  return state.promo === "DIRECT10" && amount >= 18 ? amount * 0.1 : 0;
}

function total() {
  return subtotal() + deliveryFee() + orderingFee() - discountFor(subtotal());
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function renderCategories() {
  const rail = $("#category-filters");
  const categories = ["All", ...new Set(menu.filter((item) => item.active).map((item) => item.category))];
  rail.innerHTML = "";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.className = state.category === category ? "active" : "";
    button.addEventListener("click", () => {
      state.category = category;
      saveState();
      renderCategories();
      renderMenu();
    });
    rail.append(button);
  });
}

function matchesMenu(item) {
  const categoryMatch = state.category === "All" || item.category === state.category;
  const haystack = `${item.name} ${item.description} ${item.category}`.toLowerCase();
  return categoryMatch && haystack.includes(state.query.toLowerCase());
}

function renderMenu() {
  menuGrid.innerHTML = "";
  const items = menu.filter((item) => item.active).filter(matchesMenu);

  items.forEach((item) => {
    const node = menuTemplate.content.cloneNode(true);
    node.querySelector(".dish-visual span").textContent = item.time;
    node.querySelector("small").textContent = item.category;
    node.querySelector("h3").textContent = item.name;
    node.querySelector("p").textContent = item.description;
    node.querySelector("footer b").textContent = currency.format(item.price);
    node.querySelector("footer strong").textContent = "Direct";
    const button = node.querySelector(".add-button");
    button.setAttribute("aria-label", `Add ${item.name}`);
    button.addEventListener("click", () => addToCart(item.id));
    menuGrid.append(node);
  });

  if (!items.length) {
    menuGrid.innerHTML = '<p class="cart-empty">No dishes match that search yet.</p>';
  }
}

function addToCart(id) {
  if (!byId(id) || !byId(id).active) return;
  state.cart[id] = (state.cart[id] || 0) + 1;
  saveState();
  renderCart();
  showToast(`${byId(id).name} added.`);
}

function updateQuantity(id, change) {
  state.cart[id] = (state.cart[id] || 0) + change;
  if (state.cart[id] <= 0) delete state.cart[id];
  saveState();
  renderCart();
}

function cartLine(id, quantity) {
  const item = byId(id);
  const line = document.createElement("div");
  line.className = "cart-line";
  line.innerHTML = `
    <span>
      <strong>${item.name}</strong>
      <small>${currency.format(item.price)} each</small>
    </span>
    <b>${currency.format(item.price * quantity)}</b>
    <div class="quantity-buttons" aria-label="${item.name} quantity">
      <button type="button" data-change="-1" aria-label="Remove one ${item.name}">-</button>
      <span>${quantity}</span>
      <button type="button" data-change="1" aria-label="Add one ${item.name}">+</button>
    </div>
  `;
  line.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => updateQuantity(id, Number(button.dataset.change)));
  });
  return line;
}

function renderCart() {
  const lines = $("#cart-lines");
  lines.innerHTML = "";
  Object.entries(state.cart).forEach(([id, quantity]) => {
    if (byId(id)) {
      lines.append(cartLine(id, quantity));
    } else {
      delete state.cart[id];
    }
  });

  if (!totalQuantity()) {
    lines.innerHTML = '<p class="cart-empty">Your bag is ready for the first bite.</p>';
  }

  const amount = subtotal();
  const discount = discountFor(amount);
  const quantity = totalQuantity();
  $("#cart-count").textContent = `${quantity} item${quantity === 1 ? "" : "s"}`;
  $("#top-count").textContent = quantity;
  $("#mobile-count").textContent = quantity;
  $("#mobile-basket").hidden = quantity === 0;
  $("#subtotal").textContent = currency.format(amount);
  $("#ordering-fee").textContent = currency.format(orderingFee());
  $("#delivery-fee").textContent = currency.format(deliveryFee());
  $("#discount").textContent = `-${currency.format(discount)}`;
  $("#grand-total").textContent = currency.format(total());
  $("#pay-total").textContent = currency.format(total());
  $("#mobile-total").textContent = currency.format(total());
  document.querySelectorAll('input[name="fulfilment"]').forEach((input) => {
    input.checked = input.value === state.fulfilment;
  });
  $(".address-field").hidden = state.fulfilment !== "Delivery";
  $(".address-field input").required = state.fulfilment === "Delivery";
}

function submitOrder(form) {
  if (!totalQuantity()) {
    showToast("Add a dish before placing your order.");
    return;
  }

  const formData = new FormData(form);
  const orderNumber = `ZO-${Math.floor(1200 + Math.random() * 7800)}`;
  $("#confirmation-number").textContent = orderNumber;
  $("#confirmation-copy").textContent = `${formData.get("name")}, your ${state.fulfilment.toLowerCase()} order is queued. We will use ${formData.get("phone")} for updates.`;
  $("#order-confirmation").hidden = false;
  state.cart = {};
  saveState();
  form.reset();
  renderCart();
  showToast("Order sent to Harbour Street Kitchen.");
}

document.querySelectorAll('input[name="fulfilment"]').forEach((input) => {
  input.addEventListener("change", () => {
    state.fulfilment = input.value;
    saveState();
    renderCart();
  });
});

$("#menu-search").addEventListener("input", (event) => {
  state.query = event.currentTarget.value.trim();
  saveState();
  renderMenu();
});

$("#browse-menu").addEventListener("click", () => $("#menu").scrollIntoView({ block: "start" }));
$("#basket-jump").addEventListener("click", () => $("#basket").scrollIntoView({ block: "start" }));
$("#mobile-basket-button").addEventListener("click", () => $("#basket").scrollIntoView({ block: "start" }));
$("#quick-add").addEventListener("click", () => {
  ["burger", "chips", "shake"].filter(byId).forEach(addToCart);
});

$("#clear-cart").addEventListener("click", () => {
  state.cart = {};
  saveState();
  renderCart();
});

$("#apply-promo").addEventListener("click", () => {
  state.promo = $("#promo-code").value.trim().toUpperCase();
  $("#promo-code").value = state.promo;
  $("#promo-note").textContent = state.promo === "DIRECT10" ? "10% unlocks when the bag reaches GBP 18." : "That code is not active.";
  saveState();
  renderCart();
});

$("#checkout-form").addEventListener("submit", (event) => {
  event.preventDefault();
  submitOrder(event.currentTarget);
});

async function bootCustomerApp() {
  menu = await ZeroMenuApi.listMenu();
  $("#promo-code").value = state.promo;
  $("#menu-search").value = state.query;
  renderCategories();
  renderMenu();
  renderCart();
}

bootCustomerApp();
