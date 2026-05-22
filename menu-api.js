(function createZeroMenuApi() {
  const menuKey = "zero-menu-catalog-v1";
  const apiBaseUrl = window.ZERO_MENU_API_BASE_URL || "";
  const defaultMenu = [
    { id: "burger", name: "Dock Burger", category: "Burgers", price: 10.9, time: "Signature", description: "Charred beef, pepper relish, crisp lettuce, and glossy house sauce.", active: true },
    { id: "wrap", name: "Fire Wrap", category: "Wraps", price: 9.4, time: "Hot", description: "Grilled chicken, lemon slaw, chilli yogurt, and soft flatbread.", active: true },
    { id: "chips", name: "Sea Salt Fries", category: "Sides", price: 3.6, time: "Crisp", description: "Double-cooked fries finished with smoked tomato dip.", active: true },
    { id: "wings", name: "Sticky Wings", category: "Sides", price: 6.8, time: "Glazed", description: "Six lacquered wings with pickled cucumber and sesame crunch.", active: true },
    { id: "salad", name: "Herb Halloumi Bowl", category: "Fresh", price: 8.7, time: "Bright", description: "Warm halloumi, grains, herbs, pomegranate, and citrus dressing.", active: true },
    { id: "shake", name: "Berry Shake", category: "Drinks", price: 4.5, time: "Cold", description: "Berry shake folded with vanilla and oat crumble.", active: true }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function itemId(name) {
    const slug = String(name || "menu-item")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `${slug || "menu-item"}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function cleanItem(item) {
    return {
      id: String(item.id || itemId(item.name)),
      name: String(item.name || "New item").trim(),
      category: String(item.category || "Menu").trim(),
      price: Math.max(0, Number(item.price) || 0),
      time: String(item.time || "Direct").trim(),
      description: String(item.description || "").trim(),
      active: item.active !== false
    };
  }

  function localMenu() {
    const saved = JSON.parse(localStorage.getItem(menuKey) || "null");
    return Array.isArray(saved) && saved.length ? saved.map(cleanItem) : clone(defaultMenu);
  }

  async function request(path, options) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options
    });

    if (!response.ok) {
      throw new Error(`Menu API failed with ${response.status}.`);
    }

    return response.json();
  }

  async function listMenu() {
    if (apiBaseUrl) {
      const data = await request("/menu");
      return (data.items || data).map(cleanItem);
    }

    return localMenu();
  }

  async function saveMenu(items) {
    const nextMenu = items.map(cleanItem);

    if (apiBaseUrl) {
      const data = await request("/menu", {
        body: JSON.stringify({ items: nextMenu }),
        method: "PUT"
      });
      return (data.items || data).map(cleanItem);
    }

    localStorage.setItem(menuKey, JSON.stringify(nextMenu));
    return nextMenu;
  }

  async function resetMenu() {
    return saveMenu(clone(defaultMenu));
  }

  window.ZeroMenuApi = {
    createId: itemId,
    defaults: clone(defaultMenu),
    listMenu,
    resetMenu,
    saveMenu
  };
})();
