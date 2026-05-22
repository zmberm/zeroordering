const dashboardCurrency = new Intl.NumberFormat("en-GB", {
  currency: "GBP",
  style: "currency"
});

const dashboardState = {
  items: [],
  query: "",
  selectedId: ""
};

const editor = document.querySelector("#menu-editor");
const itemTemplate = document.querySelector("#dashboard-item-template");

function chosenItem() {
  return dashboardState.items.find((item) => item.id === dashboardState.selectedId);
}

function showDashboardToast(message) {
  const toast = document.querySelector("#dashboard-toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showDashboardToast.timer);
  showDashboardToast.timer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function filteredItems() {
  const query = dashboardState.query.toLowerCase();
  return dashboardState.items.filter((item) => {
    return `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(query);
  });
}

function renderMetrics() {
  const liveItems = dashboardState.items.filter((item) => item.active);
  const categories = new Set(liveItems.map((item) => item.category));
  const averagePrice = liveItems.length
    ? liveItems.reduce((sum, item) => sum + item.price, 0) / liveItems.length
    : 0;

  document.querySelector("#menu-metrics").innerHTML = `
    <article><span>Live items</span><strong>${liveItems.length}</strong></article>
    <article><span>Categories</span><strong>${categories.size}</strong></article>
    <article><span>Average price</span><strong>${dashboardCurrency.format(averagePrice)}</strong></article>
  `;
}

function fillEditor() {
  const item = chosenItem();
  if (!item) return;
  editor.elements.name.value = item.name;
  editor.elements.category.value = item.category;
  editor.elements.price.value = item.price.toFixed(2);
  editor.elements.time.value = item.time;
  editor.elements.description.value = item.description;
  editor.elements.active.checked = item.active;
}

function renderItems() {
  const target = document.querySelector("#dashboard-items");
  target.innerHTML = "";

  filteredItems().forEach((item) => {
    const node = itemTemplate.content.cloneNode(true);
    const row = node.querySelector(".dashboard-item");
    row.classList.toggle("selected", item.id === dashboardState.selectedId);
    node.querySelector("small").textContent = item.category;
    node.querySelector("strong").textContent = item.name;
    node.querySelector("em").textContent = item.description;
    node.querySelector("b").textContent = dashboardCurrency.format(item.price);
    const select = node.querySelector(".item-select");
    select.addEventListener("click", () => {
      dashboardState.selectedId = item.id;
      renderItems();
      fillEditor();
    });
    const live = node.querySelector(".item-live");
    live.checked = item.active;
    live.addEventListener("change", () => {
      item.active = live.checked;
      editor.elements.active.checked = item.id === dashboardState.selectedId ? live.checked : editor.elements.active.checked;
      renderMetrics();
      showDashboardToast(`${item.name} ${item.active ? "is live" : "is paused"}.`);
    });
    target.append(node);
  });

  if (!target.children.length) {
    target.innerHTML = '<p>No menu items match this search.</p>';
  }
}

function renderDashboard() {
  renderMetrics();
  renderItems();
  fillEditor();
}

function formItem() {
  const item = chosenItem();
  return {
    ...item,
    active: editor.elements.active.checked,
    category: editor.elements.category.value.trim(),
    description: editor.elements.description.value.trim(),
    name: editor.elements.name.value.trim(),
    price: Number(editor.elements.price.value),
    time: editor.elements.time.value.trim()
  };
}

async function saveDashboardMenu(message) {
  dashboardState.items = await ZeroMenuApi.saveMenu(dashboardState.items);
  renderDashboard();
  showDashboardToast(message);
}

document.querySelector("#dashboard-search").addEventListener("input", (event) => {
  dashboardState.query = event.currentTarget.value.trim();
  renderItems();
});

document.querySelector("#new-item").addEventListener("click", () => {
  const newItem = {
    active: true,
    category: "Specials",
    description: "Describe what makes this item worth ordering.",
    id: ZeroMenuApi.createId("New menu item"),
    name: "New menu item",
    price: 0,
    time: "New"
  };
  dashboardState.items.unshift(newItem);
  dashboardState.selectedId = newItem.id;
  renderDashboard();
});

document.querySelector("#duplicate-item").addEventListener("click", () => {
  const item = chosenItem();
  if (!item) return;
  const copy = {
    ...item,
    id: ZeroMenuApi.createId(`${item.name} copy`),
    name: `${item.name} Copy`
  };
  dashboardState.items.unshift(copy);
  dashboardState.selectedId = copy.id;
  renderDashboard();
});

document.querySelector("#delete-item").addEventListener("click", () => {
  const item = chosenItem();
  if (!item || dashboardState.items.length === 1) return;
  dashboardState.items = dashboardState.items.filter((entry) => entry.id !== item.id);
  dashboardState.selectedId = dashboardState.items[0].id;
  renderDashboard();
  showDashboardToast(`${item.name} removed from this draft.`);
});

editor.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextItem = formItem();
  dashboardState.items = dashboardState.items.map((item) => item.id === nextItem.id ? nextItem : item);
  renderDashboard();
  showDashboardToast(`${nextItem.name} updated in this draft.`);
});

document.querySelector("#save-menu").addEventListener("click", () => {
  saveDashboardMenu("Menu saved for the customer app.");
});

document.querySelector("#reset-menu").addEventListener("click", async () => {
  dashboardState.items = await ZeroMenuApi.resetMenu();
  dashboardState.selectedId = dashboardState.items[0].id;
  renderDashboard();
  showDashboardToast("Demo menu restored.");
});

async function bootDashboard() {
  dashboardState.items = await ZeroMenuApi.listMenu();
  dashboardState.selectedId = dashboardState.items[0].id;
  renderDashboard();
}

bootDashboard();
