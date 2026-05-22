const storageKey = "zero-customer-order";

let menu = [];
let takeaway = null;
let pendingOptionItem = null;

const currency = new Intl.NumberFormat("en-GB", {
  currency: "GBP",
  style: "currency"
});

function readState() {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
  const next = saved || {
    cart: {},
    category: "All",
    query: "",
    fulfilment: "Collection",
    promo: ""
  };
  next.cart = Object.fromEntries(Object.entries(next.cart || {}).map(([key, value]) => {
    return [key, typeof value === "number" ? { itemId: key, quantity: value, selections: [], unitPrice: null } : value];
  }));
  return next;
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
  return Object.values(state.cart).reduce((sum, entry) => sum + entry.quantity, 0);
}

function subtotal() {
  return Object.values(state.cart).reduce((sum, entry) => {
    const item = byId(entry.itemId);
    const price = entry.unitPrice === null || entry.unitPrice === undefined ? item && item.price : entry.unitPrice;
    return item && price !== undefined ? sum + price * entry.quantity : sum;
  }, 0);
}

function postcodeArea(value) {
  return String(value || "").toUpperCase().replace(/\s+/g, "");
}

function deliveryZone() {
  const postcode = postcodeArea($("#checkout-form").elements.postcode.value);
  if (!takeaway || !postcode) return null;
  return takeaway.zones.find((zone) => zone.active && zone.postcodes.split(",").some((area) => postcode.startsWith(postcodeArea(area))));
}

function deliveryFee() {
  const zone = deliveryZone();
  return subtotal() && state.fulfilment === "Delivery" ? (zone ? zone.fee : 0) : 0;
}

function orderingFee() {
  return subtotal() ? 1 : 0;
}

function discountFor(amount) {
  const offer = takeaway && takeaway.promotions.find((promotion) => promotion.active && promotion.code === state.promo);
  return offer && offer.kind.toLowerCase().includes("percent") && amount >= offer.minimum ? amount * offer.value / 100 : 0;
}

function total() {
  return subtotal() + deliveryFee() + orderingFee() - discountFor(subtotal());
}

function bestOffer() {
  return takeaway && takeaway.promotions.find((promotion) => promotion.active);
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

function defaultCustomization(item) {
  const selections = item.optionGroups.filter((group) => group.required).map((group) => group.choices[0]);
  return { selections: selections.map((choice) => choice.name), extra: selections.reduce((sum, choice) => sum + choice.price, 0) };
}

function addCustomizedItem(id, customization) {
  const menuItem = byId(id);
  if (!menuItem || !menuItem.active) return;
  const selected = customization || { extra: 0, selections: [] };
  const key = `${id}::${selected.selections.join("|") || "plain"}`;
  const current = state.cart[key];
  state.cart[key] = current || { itemId: id, quantity: 0, selections: selected.selections, unitPrice: menuItem.price + selected.extra };
  state.cart[key].quantity += 1;
  saveState();
  renderCart();
  showToast(`${menuItem.name} added.`);
}

function addToCart(id) {
  const menuItem = byId(id);
  if (!menuItem || !menuItem.active) return;
  if (menuItem.optionGroups.length) {
    openOptions(menuItem);
    return;
  }
  addCustomizedItem(id, { extra: 0, selections: [] });
}

function updateQuantity(key, change) {
  state.cart[key].quantity += change;
  if (state.cart[key].quantity <= 0) delete state.cart[key];
  saveState();
  renderCart();
}

function cartLine(key, entry) {
  const item = byId(entry.itemId);
  const line = document.createElement("div");
  line.className = "cart-line";
  line.innerHTML = `
    <span>
      <strong>${item.name}</strong>
      <small>${entry.selections.length ? `${entry.selections.join(", ")} / ` : ""}${currency.format(entry.unitPrice || item.price)} each</small>
    </span>
    <b>${currency.format((entry.unitPrice || item.price) * entry.quantity)}</b>
    <div class="quantity-buttons" aria-label="${item.name} quantity">
      <button type="button" data-change="-1" aria-label="Remove one ${item.name}">-</button>
      <span>${entry.quantity}</span>
      <button type="button" data-change="1" aria-label="Add one ${item.name}">+</button>
    </div>
  `;
  line.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => updateQuantity(key, Number(button.dataset.change)));
  });
  return line;
}

function renderCart() {
  const lines = $("#cart-lines");
  lines.innerHTML = "";
  Object.entries(state.cart).forEach(([key, entry]) => {
    if (byId(entry.itemId)) {
      lines.append(cartLine(key, entry));
    } else {
      delete state.cart[key];
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
  $("#delivery-fields").hidden = state.fulfilment !== "Delivery";
  $("#delivery-fields input").required = state.fulfilment === "Delivery";
  deliveryMessage();
}

function deliveryMessage() {
  if (!takeaway || state.fulfilment !== "Delivery") return;
  const postcode = $("#checkout-form").elements.postcode.value;
  const zone = deliveryZone();
  const note = $("#zone-note");
  if (!postcode) {
    note.textContent = "Enter a postcode to confirm your delivery fee and ETA.";
    return;
  }
  note.textContent = zone
    ? `${zone.name}: ${currency.format(zone.fee)} delivery, ${zone.eta}, ${currency.format(zone.minimum)} delivery minimum.`
    : "This postcode is outside the live delivery zones. Choose collection or contact the takeaway.";
}

function orderLines() {
  return Object.values(state.cart).map((entry) => {
    const menuItem = byId(entry.itemId);
    return `${entry.quantity}x ${menuItem.name}${entry.selections.length ? ` (${entry.selections.join(", ")})` : ""}`;
  });
}

function showTracking(orderId, fulfilment, timing) {
  $("#tracking-steps").innerHTML = ["Received", "Accepted by kitchen", fulfilment === "Delivery" ? "Out for delivery" : "Ready for collection"].map((step, index) => `<li class="${index === 0 ? "active" : ""}">${step}</li>`).join("");
  $("#confirmation-number").textContent = orderId;
  $("#confirmation-copy").textContent = `${fulfilment} order queued for ${timing}. Status updates will appear here when the live order API is connected.`;
}

async function submitOrder(form) {
  if (!totalQuantity()) {
    showToast("Add a dish before placing your order.");
    return;
  }
  if (!takeaway.service.acceptingOrders) {
    showToast("Online ordering is paused right now.");
    return;
  }
  if (subtotal() < takeaway.service.minimumOrder) {
    showToast(`The order minimum is ${currency.format(takeaway.service.minimumOrder)}.`);
    return;
  }
  if (state.fulfilment === "Delivery") {
    const zone = deliveryZone();
    if (!zone) {
      showToast("Enter a live delivery postcode or choose collection.");
      return;
    }
    if (subtotal() < zone.minimum) {
      showToast(`${zone.name} needs ${currency.format(zone.minimum)} before delivery.`);
      return;
    }
  }

  const formData = new FormData(form);
  const orderNumber = `ZO-${Math.floor(1200 + Math.random() * 7800)}`;
  const timing = formData.get("timing");
  takeaway.orders.unshift({
    customer: formData.get("name"),
    fulfilment: state.fulfilment,
    id: orderNumber,
    items: orderLines().join(", "),
    note: formData.get("note"),
    payment: formData.get("payment"),
    placed: timing === "ASAP" ? "Now" : timing,
    postcode: formData.get("postcode"),
    status: "New",
    total: total()
  });
  takeaway = await ZeroTakeawayApi.saveTakeaway(takeaway);
  showTracking(orderNumber, state.fulfilment, timing);
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

$("#checkout-form").elements.postcode.addEventListener("input", () => {
  deliveryMessage();
  renderCart();
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
  ["burger", "chips", "shake"].map(byId).filter(Boolean).forEach((menuItem) => {
    addCustomizedItem(menuItem.id, defaultCustomization(menuItem));
  });
});

$("#clear-cart").addEventListener("click", () => {
  state.cart = {};
  saveState();
  renderCart();
});

$("#apply-promo").addEventListener("click", () => {
  state.promo = $("#promo-code").value.trim().toUpperCase();
  $("#promo-code").value = state.promo;
  const offer = takeaway.promotions.find((promotion) => promotion.active && promotion.code === state.promo);
  $("#promo-note").textContent = offer ? `${offer.code}: ${offer.detail} Minimum ${currency.format(offer.minimum)}.` : "That code is not active.";
  saveState();
  renderCart();
});

$("#checkout-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitOrder(event.currentTarget);
});

async function bootCustomerApp() {
  takeaway = await ZeroTakeawayApi.getTakeaway();
  menu = takeaway.menu;
  document.querySelector(".venue-chip strong").textContent = takeaway.name;
  document.querySelector(".hero-content > p").textContent = takeaway.name;
  document.querySelector(".hero-brandline").lastChild.textContent = takeaway.service.acceptingOrders ? " Taking direct orders now" : " Online ordering paused";
  $("#customer-service-status").textContent = takeaway.service.acceptingOrders ? `Collection ${takeaway.service.collectionMinutes} min` : "Ordering paused";
  $("#customer-minimum").textContent = takeaway.service.minimumOrder ? currency.format(takeaway.service.minimumOrder) : "No minimum";
  $("#customer-offer").textContent = bestOffer() ? `${bestOffer().code} over ${currency.format(bestOffer().minimum)}` : "Direct ordering";
  $("#customer-contact").textContent = `Call ${takeaway.contact.phone}`;
  $("#promo-code").value = state.promo;
  $("#menu-search").value = state.query;
  renderCategories();
  renderMenu();
  renderCart();
}

function optionPrice() {
  const checked = document.querySelectorAll("#customer-option-groups input:checked");
  const extras = [...checked].reduce((sum, input) => sum + Number(input.dataset.price), 0);
  $("#option-total").textContent = currency.format(pendingOptionItem.price + extras);
}

function openOptions(menuItem) {
  pendingOptionItem = menuItem;
  $("#option-title").textContent = menuItem.name;
  $("#customer-option-groups").innerHTML = menuItem.optionGroups.map((group) => `
    <fieldset class="option-group">
      <legend>${group.name}${group.required ? " / choose one" : ""}</legend>
      ${group.choices.map((choice, index) => `<label class="option-choice"><span><input name="${group.id}" type="${group.required ? "radio" : "checkbox"}" data-label="${choice.name}" data-price="${choice.price}" ${group.required && index === 0 ? "checked" : ""} />${choice.name}</span><strong>${choice.price ? `+${currency.format(choice.price)}` : "Included"}</strong></label>`).join("")}
    </fieldset>
  `).join("");
  $("#customer-option-groups").querySelectorAll("input").forEach((input) => input.addEventListener("change", optionPrice));
  $("#option-modal").hidden = false;
  optionPrice();
}

$("#close-options").addEventListener("click", () => $("#option-modal").hidden = true);
$("#option-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const checked = [...document.querySelectorAll("#customer-option-groups input:checked")];
  addCustomizedItem(pendingOptionItem.id, {
    extra: checked.reduce((sum, input) => sum + Number(input.dataset.price), 0),
    selections: checked.map((input) => input.dataset.label)
  });
  $("#option-modal").hidden = true;
});

bootCustomerApp();
