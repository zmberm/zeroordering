const money = new Intl.NumberFormat("en-GB", { currency: "GBP", style: "currency" });
const dashboardState = { profile: null, query: "", selectedId: "", view: "overview" };
const editor = document.querySelector("#menu-editor");
const itemTemplate = document.querySelector("#dashboard-item-template");
const viewCopy = {
  delivery: ["Service area", "Control delivery zones and fulfilment."],
  hours: ["Hours and holidays", "Keep the app open only when the kitchen is."],
  menu: ["Menu studio", "Build dishes, prices, and customer options."],
  overview: ["Takeaway control center", "Run the ordering app from one place."],
  promotions: ["Offers", "Create direct-order discounts and promotions."]
};

function item() { return dashboardState.profile.menu.find((entry) => entry.id === dashboardState.selectedId); }
function id(name) { return ZeroTakeawayApi.createId(name); }
function toast(message) {
  const node = document.querySelector("#dashboard-toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2400);
}
function setView(view) {
  dashboardState.view = view;
  document.querySelectorAll(".dashboard-nav button").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  document.querySelectorAll(".control-view").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === view));
  document.querySelector("#view-kicker").textContent = viewCopy[view][0];
  document.querySelector("#view-title").textContent = viewCopy[view][1];
}
async function publish(message) {
  dashboardState.profile = await ZeroTakeawayApi.saveTakeaway(dashboardState.profile);
  render();
  toast(message);
}
function metrics() {
  const live = dashboardState.profile.menu.filter((entry) => entry.active).length;
  const pending = dashboardState.profile.orders.filter((order) => order.status !== "Complete").length;
  const activeOffers = dashboardState.profile.promotions.filter((offer) => offer.active).length;
  document.querySelector("#overview-metrics").innerHTML = `
    <article><span>Live menu items</span><strong>${live}</strong></article>
    <article><span>Open orders</span><strong>${pending}</strong></article>
    <article><span>Delivery zones</span><strong>${dashboardState.profile.zones.filter((zone) => zone.active).length}</strong></article>
    <article><span>Live offers</span><strong>${activeOffers}</strong></article>
  `;
}
function orderQueue() {
  const steps = { New: "Preparing", Preparing: "Ready", Ready: "Complete", Complete: "Complete" };
  document.querySelector("#order-queue").innerHTML = dashboardState.profile.orders.map((order) => `
    <article class="queue-card">
      <header><strong>${order.id}</strong><span>${order.status}</span></header>
      <h3>${order.customer} / ${order.fulfilment}</h3>
      <p>${order.items}</p>
      <footer><b>${money.format(order.total)}</b><small>${order.placed}</small><button data-order="${order.id}" ${order.status === "Complete" ? "disabled" : ""}>${steps[order.status]}</button></footer>
    </article>
  `).join("");
  document.querySelectorAll("[data-order]").forEach((button) => button.addEventListener("click", () => {
    const order = dashboardState.profile.orders.find((entry) => entry.id === button.dataset.order);
    order.status = steps[order.status];
    orderQueue();
    metrics();
  }));
}
function overview() {
  metrics();
  orderQueue();
  const profile = dashboardState.profile;
  document.querySelector("#service-card").innerHTML = `
    <strong>${profile.service.acceptingOrders ? "Online ordering open" : "Online ordering paused"}</strong>
    <p>Collection ${profile.service.collectionMinutes} min / Delivery ${profile.service.deliveryMinutes} min</p>
    <a href="../" target="_blank" rel="noreferrer">Open customer menu link</a>
  `;
  document.querySelector("#setup-grid").innerHTML = [
    ["Opening hours", profile.hours.filter((day) => !day.closed).length + " trading days"],
    ["Holiday rules", profile.holidays.length + " exceptions"],
    ["Menu options", profile.menu.reduce((sum, entry) => sum + entry.optionGroups.length, 0) + " groups"],
    ["Promotions", profile.promotions.filter((offer) => offer.active).length + " live"]
  ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join("");
}
function filteredMenu() {
  const query = dashboardState.query.toLowerCase();
  return dashboardState.profile.menu.filter((entry) => `${entry.name} ${entry.category} ${entry.description}`.toLowerCase().includes(query));
}
function menuList() {
  const target = document.querySelector("#dashboard-items");
  target.innerHTML = "";
  filteredMenu().forEach((entry) => {
    const node = itemTemplate.content.cloneNode(true);
    const row = node.querySelector(".dashboard-item");
    row.classList.toggle("selected", entry.id === dashboardState.selectedId);
    node.querySelector("small").textContent = `${entry.category} / ${entry.optionGroups.length} option groups`;
    node.querySelector("strong").textContent = entry.name;
    node.querySelector("em").textContent = entry.description;
    node.querySelector("b").textContent = money.format(entry.price);
    node.querySelector(".item-select").addEventListener("click", () => { dashboardState.selectedId = entry.id; menuList(); fillEditor(); });
    const live = node.querySelector(".item-live");
    live.checked = entry.active;
    live.addEventListener("change", () => { entry.active = live.checked; if (entry.id === dashboardState.selectedId) editor.elements.active.checked = live.checked; metrics(); toast(`${entry.name} ${entry.active ? "live" : "paused"} in draft.`); });
    target.append(node);
  });
}
function fillEditor() {
  const chosen = item();
  if (!chosen) return;
  ["name", "category", "price", "time", "description"].forEach((field) => editor.elements[field].value = chosen[field]);
  editor.elements.active.checked = chosen.active;
  modifiers();
}
function groupMarkup(group, index) {
  const choices = group.choices.map((choice, choiceIndex) => `
    <div class="choice-row">
      <input data-choice-name="${choiceIndex}" value="${choice.name}" aria-label="Choice name" />
      <span class="price-input"><b>GBP</b><input data-choice-price="${choiceIndex}" min="0" step="0.05" type="number" value="${choice.price}" aria-label="Choice price" /></span>
      <button data-remove-choice="${choiceIndex}" type="button" aria-label="Remove choice">x</button>
    </div>`).join("");
  return `<article class="modifier-card" data-group="${index}">
    <header><input class="group-name" value="${group.name}" aria-label="Option group name" /><label><input class="group-required" type="checkbox" ${group.required ? "checked" : ""} /> Required</label></header>
    <div class="choice-list">${choices}</div>
    <footer><button data-add-choice type="button">Add choice</button><button data-remove-group type="button">Remove group</button></footer>
  </article>`;
}
function modifiers() {
  const target = document.querySelector("#modifier-groups");
  target.innerHTML = item().optionGroups.length ? item().optionGroups.map(groupMarkup).join("") : '<p class="empty-note">No options yet. Add a group for sizes, sauces, toppings, meal upgrades, or drink choices.</p>';
  target.querySelectorAll(".modifier-card").forEach((card) => {
    const group = item().optionGroups[Number(card.dataset.group)];
    card.querySelector(".group-name").addEventListener("input", (event) => group.name = event.target.value);
    card.querySelector(".group-required").addEventListener("change", (event) => group.required = event.target.checked);
    card.querySelectorAll("[data-choice-name]").forEach((input) => input.addEventListener("input", (event) => group.choices[Number(event.target.dataset.choiceName)].name = event.target.value));
    card.querySelectorAll("[data-choice-price]").forEach((input) => input.addEventListener("input", (event) => group.choices[Number(event.target.dataset.choicePrice)].price = Number(event.target.value) || 0));
    card.querySelectorAll("[data-remove-choice]").forEach((button) => button.addEventListener("click", () => { if (group.choices.length > 1) group.choices.splice(Number(button.dataset.removeChoice), 1); modifiers(); }));
    card.querySelector("[data-add-choice]").addEventListener("click", () => { group.choices.push({ name: "New choice", price: 0 }); modifiers(); });
    card.querySelector("[data-remove-group]").addEventListener("click", () => { item().optionGroups = item().optionGroups.filter((entry) => entry.id !== group.id); modifiers(); menuList(); });
  });
}
function hours() {
  document.querySelector("#hours-grid").innerHTML = dashboardState.profile.hours.map((day, index) => `
    <article class="hour-row" data-hour="${index}">
      <strong>${day.day}</strong><label><input class="day-closed" type="checkbox" ${day.closed ? "checked" : ""} /> Closed</label>
      <input class="day-open" type="time" value="${day.open}" ${day.closed ? "disabled" : ""} aria-label="${day.day} open" />
      <input class="day-close" type="time" value="${day.close}" ${day.closed ? "disabled" : ""} aria-label="${day.day} close" />
    </article>`).join("");
  document.querySelectorAll("[data-hour]").forEach((row) => {
    const day = dashboardState.profile.hours[Number(row.dataset.hour)];
    row.querySelector(".day-closed").addEventListener("change", (event) => { day.closed = event.target.checked; hours(); });
    row.querySelector(".day-open").addEventListener("input", (event) => day.open = event.target.value);
    row.querySelector(".day-close").addEventListener("input", (event) => day.close = event.target.value);
  });
  holidays();
}
function holidays() {
  document.querySelector("#holiday-list").innerHTML = dashboardState.profile.holidays.map((closure, index) => `
    <article class="holiday-row" data-holiday="${index}">
      <input class="holiday-date" type="date" value="${closure.date}" aria-label="Holiday date" />
      <input class="holiday-note" value="${closure.note}" aria-label="Holiday note" />
      <label><input class="holiday-closed" type="checkbox" ${closure.closed ? "checked" : ""} /> Closed</label>
      <button class="danger-action" type="button">Remove</button>
    </article>`).join("");
  document.querySelectorAll("[data-holiday]").forEach((row) => {
    const closure = dashboardState.profile.holidays[Number(row.dataset.holiday)];
    row.querySelector(".holiday-date").addEventListener("input", (event) => closure.date = event.target.value);
    row.querySelector(".holiday-note").addEventListener("input", (event) => closure.note = event.target.value);
    row.querySelector(".holiday-closed").addEventListener("change", (event) => closure.closed = event.target.checked);
    row.querySelector("button").addEventListener("click", () => { dashboardState.profile.holidays = dashboardState.profile.holidays.filter((entry) => entry !== closure); holidays(); });
  });
}
function service() {
  const serviceForm = document.querySelector("#service-form");
  Object.entries(dashboardState.profile.service).forEach(([key, value]) => { if (serviceForm.elements[key]) serviceForm.elements[key].type === "checkbox" ? serviceForm.elements[key].checked = value : serviceForm.elements[key].value = value; });
  serviceForm.elements.phone.value = dashboardState.profile.contact.phone;
  serviceForm.querySelectorAll("input").forEach((input) => input.oninput = () => {
    if (input.name === "phone") dashboardState.profile.contact.phone = input.value;
    else dashboardState.profile.service[input.name] = input.type === "checkbox" ? input.checked : Number(input.value);
  });
  zones();
}
function zones() {
  document.querySelector("#zone-editor").innerHTML = dashboardState.profile.zones.map((zone, index) => `
    <article class="zone-card" data-zone="${index}">
      <header><input data-field="name" value="${zone.name}" aria-label="Zone name" /><label><input data-field="active" type="checkbox" ${zone.active ? "checked" : ""} /> Live</label></header>
      <div class="editor-grid">
        <label>Postcodes<input data-field="postcodes" value="${zone.postcodes}" /></label>
        <label>ETA<input data-field="eta" value="${zone.eta}" /></label>
        <label>Fee<span class="price-input"><b>GBP</b><input data-field="fee" min="0" step="0.50" type="number" value="${zone.fee}" /></span></label>
        <label>Minimum<span class="price-input"><b>GBP</b><input data-field="minimum" min="0" step="0.50" type="number" value="${zone.minimum}" /></span></label>
      </div><button class="danger-action" type="button">Remove zone</button>
    </article>`).join("");
  document.querySelectorAll("[data-zone]").forEach((card) => {
    const zone = dashboardState.profile.zones[Number(card.dataset.zone)];
    card.querySelectorAll("[data-field]").forEach((input) => input.addEventListener("input", () => zone[input.dataset.field] = input.type === "checkbox" ? input.checked : ["fee", "minimum"].includes(input.dataset.field) ? Number(input.value) : input.value));
    card.querySelector(".danger-action").addEventListener("click", () => { dashboardState.profile.zones = dashboardState.profile.zones.filter((entry) => entry !== zone); zones(); });
  });
}
function promotions() {
  document.querySelector("#promotion-grid").innerHTML = dashboardState.profile.promotions.map((offer, index) => `
    <article class="promo-card" data-promo="${index}">
      <header><input data-field="code" value="${offer.code}" aria-label="Promotion code" /><label><input data-field="active" type="checkbox" ${offer.active ? "checked" : ""} /> Live</label></header>
      <div class="editor-grid">
        <label>Type<input data-field="kind" value="${offer.kind}" /></label>
        <label>Value<input data-field="value" min="0" step="1" type="number" value="${offer.value}" /></label>
        <label>Minimum<span class="price-input"><b>GBP</b><input data-field="minimum" min="0" step="0.50" type="number" value="${offer.minimum}" /></span></label>
        <label>Offer note<input data-field="detail" value="${offer.detail}" /></label>
      </div><button class="danger-action" type="button">Remove promotion</button>
    </article>`).join("");
  document.querySelectorAll("[data-promo]").forEach((card) => {
    const offer = dashboardState.profile.promotions[Number(card.dataset.promo)];
    card.querySelectorAll("[data-field]").forEach((input) => input.addEventListener("input", () => offer[input.dataset.field] = input.type === "checkbox" ? input.checked : ["minimum", "value"].includes(input.dataset.field) ? Number(input.value) : input.value));
    card.querySelector(".danger-action").addEventListener("click", () => { dashboardState.profile.promotions = dashboardState.profile.promotions.filter((entry) => entry !== offer); promotions(); });
  });
}
function render() {
  document.querySelector("#takeaway-name").textContent = dashboardState.profile.name;
  overview(); menuList(); fillEditor(); hours(); service(); promotions(); setView(dashboardState.view);
}
document.querySelectorAll(".dashboard-nav button").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
document.querySelector("#dashboard-search").addEventListener("input", (event) => { dashboardState.query = event.target.value.trim(); menuList(); });
editor.addEventListener("submit", (event) => {
  event.preventDefault();
  const chosen = item();
  ["name", "category", "time", "description"].forEach((field) => chosen[field] = editor.elements[field].value.trim());
  chosen.price = Number(editor.elements.price.value) || 0;
  chosen.active = editor.elements.active.checked;
  menuList(); overview(); toast(`${chosen.name} updated in draft.`);
});
document.querySelector("#add-option-group").addEventListener("click", () => { item().optionGroups.push({ choices: [{ name: "Choice", price: 0 }], id: id("option"), name: "Options", required: false }); modifiers(); menuList(); });
document.querySelector("#new-item").addEventListener("click", () => { const entry = { active: true, category: "Specials", description: "Describe this customer-facing menu item.", id: id("menu-item"), name: "New menu item", optionGroups: [], price: 0, time: "New" }; dashboardState.profile.menu.unshift(entry); dashboardState.selectedId = entry.id; menuList(); fillEditor(); });
document.querySelector("#duplicate-item").addEventListener("click", () => { const copy = JSON.parse(JSON.stringify(item())); copy.id = id(copy.name); copy.name += " Copy"; copy.optionGroups.forEach((group) => group.id = id(group.name)); dashboardState.profile.menu.unshift(copy); dashboardState.selectedId = copy.id; menuList(); fillEditor(); });
document.querySelector("#delete-item").addEventListener("click", () => { if (dashboardState.profile.menu.length < 2) return; dashboardState.profile.menu = dashboardState.profile.menu.filter((entry) => entry.id !== dashboardState.selectedId); dashboardState.selectedId = dashboardState.profile.menu[0].id; menuList(); fillEditor(); overview(); });
document.querySelector("#add-holiday").addEventListener("click", () => { dashboardState.profile.holidays.unshift({ closed: true, date: "2026-12-31", note: "Holiday closure" }); holidays(); });
document.querySelector("#add-zone").addEventListener("click", () => { dashboardState.profile.zones.unshift({ active: true, eta: "30-40 min", fee: 2.5, id: id("zone"), minimum: 12, name: "New zone", postcodes: "Add postcodes" }); zones(); });
document.querySelector("#add-promotion").addEventListener("click", () => { dashboardState.profile.promotions.unshift({ active: true, code: "NEWCODE", detail: "Direct-order offer.", id: id("offer"), kind: "Percent off", minimum: 20, value: 10 }); promotions(); });
document.querySelector("#add-demo-order").addEventListener("click", () => { dashboardState.profile.orders.unshift({ customer: "New customer", fulfilment: "Delivery", id: `ZO-${Math.floor(3000 + Math.random() * 6000)}`, items: "Dock Burger, Berry Shake", placed: "Now", status: "New", total: 17.4 }); overview(); });
document.querySelector("#save-system").addEventListener("click", () => publish("Takeaway app controls published."));
document.querySelector("#reset-system").addEventListener("click", async () => { dashboardState.profile = await ZeroTakeawayApi.resetTakeaway(); dashboardState.selectedId = dashboardState.profile.menu[0].id; render(); toast("Demo takeaway restored."); });
(async function boot() { dashboardState.profile = await ZeroTakeawayApi.getTakeaway(); dashboardState.selectedId = dashboardState.profile.menu[0].id; render(); })();
