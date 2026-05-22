(function createZeroDataApis() {
  const takeawayKey = "zero-takeaway-harbour-v3";
  const fleetKey = "zero-master-fleet-v1";
  const apiBaseUrl = window.ZERO_TAKEAWAY_API_BASE_URL || window.ZERO_MENU_API_BASE_URL || "";
  const week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const defaultMenu = [
    {
      active: true,
      category: "Burgers",
      description: "Charred beef, pepper relish, crisp lettuce, and glossy house sauce.",
      id: "burger",
      name: "Dock Burger",
      optionGroups: [
        { id: "burger-cook", name: "Make it yours", required: true, choices: [{ name: "Burger only", price: 0 }, { name: "Meal with fries", price: 3.2 }] },
        { id: "burger-extras", name: "Extras", required: false, choices: [{ name: "Cheese", price: 0.8 }, { name: "Smoked bacon", price: 1.4 }] }
      ],
      price: 10.9,
      time: "Signature"
    },
    {
      active: true,
      category: "Wraps",
      description: "Grilled chicken, lemon slaw, chilli yogurt, and soft flatbread.",
      id: "wrap",
      name: "Fire Wrap",
      optionGroups: [{ id: "wrap-heat", name: "Heat", required: true, choices: [{ name: "Mild", price: 0 }, { name: "Hot", price: 0 }, { name: "Extra hot", price: 0 }] }],
      price: 9.4,
      time: "Hot"
    },
    { active: true, category: "Sides", description: "Double-cooked fries finished with smoked tomato dip.", id: "chips", name: "Sea Salt Fries", optionGroups: [], price: 3.6, time: "Crisp" },
    { active: true, category: "Sides", description: "Six lacquered wings with pickled cucumber and sesame crunch.", id: "wings", name: "Sticky Wings", optionGroups: [{ id: "wing-sauce", name: "Sauce", required: false, choices: [{ name: "Smoky BBQ", price: 0 }, { name: "Blue cheese dip", price: 0.7 }] }], price: 6.8, time: "Glazed" },
    { active: true, category: "Pizza", description: "Stone-baked margherita with basil oil and slow tomato sauce.", id: "margherita", name: "Margherita", optionGroups: [{ id: "pizza-size", name: "Pizza size", required: true, choices: [{ name: "10 inch", price: 0 }, { name: "12 inch", price: 2.5 }, { name: "14 inch", price: 4.5 }] }, { id: "pizza-crust", name: "Crust", required: false, choices: [{ name: "Garlic crust", price: 1 }, { name: "Cheese crust", price: 1.8 }] }], price: 9.8, time: "Stone baked" },
    { active: true, category: "Chicken", description: "Buttermilk chicken tenders with house dip and slaw.", id: "tenders", name: "Chicken Tenders", optionGroups: [{ id: "tender-count", name: "Portion", required: true, choices: [{ name: "5 pieces", price: 0 }, { name: "8 pieces", price: 3.1 }] }], price: 7.4, time: "Crunch" },
    { active: true, category: "Deals", description: "Two burgers, loaded fries, and two drinks for a direct night in.", id: "duo-box", name: "Duo Box", optionGroups: [{ id: "duo-drink", name: "Drinks", required: true, choices: [{ name: "Cola", price: 0 }, { name: "Berry shakes", price: 4 }] }], price: 24.5, time: "Bundle" },
    { active: true, category: "Fresh", description: "Warm halloumi, grains, herbs, pomegranate, and citrus dressing.", id: "salad", name: "Herb Halloumi Bowl", optionGroups: [], price: 8.7, time: "Bright" },
    { active: true, category: "Desserts", description: "Warm cookie dough, chocolate drizzle, vanilla gelato.", id: "cookie-dough", name: "Cookie Dough Melt", optionGroups: [{ id: "dessert-top", name: "Toppings", required: false, choices: [{ name: "Strawberries", price: 1 }, { name: "Salted caramel", price: 0.8 }] }], price: 6.2, time: "Warm" },
    { active: true, category: "Drinks", description: "Berry shake folded with vanilla and oat crumble.", id: "shake", name: "Berry Shake", optionGroups: [{ id: "shake-size", name: "Size", required: true, choices: [{ name: "Regular", price: 0 }, { name: "Large", price: 1.2 }] }], price: 4.5, time: "Cold" },
    { active: true, category: "Drinks", description: "Still spring water chilled for delivery and collection.", id: "water", name: "Spring Water", optionGroups: [], price: 1.6, time: "Chilled" }
  ];

  const defaultTakeaway = {
    contact: { email: "orders@harbourstreetkitchen.co.uk", phone: "07123 555 441" },
    holidays: [
      { date: "2026-12-25", note: "Christmas Day", closed: true },
      { date: "2026-12-26", note: "Reduced kitchen team", closed: false }
    ],
    hours: week.map((day, index) => ({ day, closed: index === 0, open: index === 0 ? "" : "12:00", close: index > 3 ? "23:00" : "22:30" })),
    id: "harbour-street-kitchen",
    menu: defaultMenu,
    name: "Harbour Street Kitchen",
    orderLink: "/",
    orders: [
      { id: "ZO-2418", customer: "Maya", fulfilment: "Delivery", status: "Preparing", placed: "18:14", total: 24.8, items: "Dock Burger meal, Fire Wrap" },
      { id: "ZO-2417", customer: "Owen", fulfilment: "Collection", status: "New", placed: "18:07", total: 16.3, items: "Sticky Wings, Sea Salt Fries, Berry Shake" },
      { id: "ZO-2413", customer: "Leah", fulfilment: "Delivery", status: "Ready", placed: "17:46", total: 32.1, items: "2 Dock Burgers, fries" }
    ],
    promotions: [
      { active: true, code: "DIRECT10", id: "direct10", kind: "Percent off", minimum: 18, value: 10, detail: "Reward first direct orders." },
      { active: true, code: "FREEFRIES", id: "freefries", kind: "Offer", minimum: 24, value: 0, detail: "Free fries with burger orders." }
    ],
    service: { acceptingOrders: true, collectionMinutes: 20, deliveryMinutes: 35, minimumOrder: 0 },
    zones: [
      { active: true, fee: 2.5, eta: "25-35 min", id: "town", minimum: 12, name: "Town centre", postcodes: "HD1, HD2" },
      { active: true, fee: 3.5, eta: "35-45 min", id: "riverside", minimum: 18, name: "Riverside", postcodes: "HD3" },
      { active: false, fee: 4.5, eta: "45-55 min", id: "outskirts", minimum: 24, name: "Outskirts", postcodes: "HD4" }
    ]
  };

  const defaultFleet = [
    { active: true, id: "harbour-street-kitchen", name: "Harbour Street Kitchen", postcode: "HD1", orders: 184, revenue: 4286, conversion: 18.4, commissionSaved: 986 },
    { active: true, id: "north-lane-pizza", name: "North Lane Pizza", postcode: "LS1", orders: 312, revenue: 7094, conversion: 22.1, commissionSaved: 1632 },
    { active: false, id: "moonlight-desserts", name: "Moonlight Desserts", postcode: "M14", orders: 97, revenue: 1898, conversion: 12.6, commissionSaved: 438 }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createId(name) {
    const slug = String(name || "item").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `${slug || "item"}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function cleanChoice(choice) {
    return { name: String(choice.name || "Choice").trim(), price: Math.max(0, Number(choice.price) || 0) };
  }

  function cleanGroup(group) {
    return {
      choices: Array.isArray(group.choices) && group.choices.length ? group.choices.map(cleanChoice) : [{ name: "Choice", price: 0 }],
      id: String(group.id || createId(group.name || "option-group")),
      name: String(group.name || "Options").trim(),
      required: Boolean(group.required)
    };
  }

  function cleanItem(item) {
    return {
      active: item.active !== false,
      category: String(item.category || "Menu").trim(),
      description: String(item.description || "").trim(),
      id: String(item.id || createId(item.name || "menu-item")),
      name: String(item.name || "New item").trim(),
      optionGroups: Array.isArray(item.optionGroups) ? item.optionGroups.map(cleanGroup) : [],
      price: Math.max(0, Number(item.price) || 0),
      time: String(item.time || "Direct").trim()
    };
  }

  function cleanTakeaway(profile) {
    const source = { ...clone(defaultTakeaway), ...profile };
    return {
      ...source,
      contact: { ...defaultTakeaway.contact, ...(source.contact || {}) },
      holidays: Array.isArray(source.holidays) ? source.holidays : [],
      hours: week.map((day) => {
        const saved = (source.hours || []).find((entry) => entry.day === day);
        return { close: "22:30", closed: false, open: "12:00", ...saved, day };
      }),
      menu: (source.menu || defaultMenu).map(cleanItem),
      orders: Array.isArray(source.orders) ? source.orders : clone(defaultTakeaway.orders),
      promotions: Array.isArray(source.promotions) ? source.promotions : clone(defaultTakeaway.promotions),
      service: { ...defaultTakeaway.service, ...(source.service || {}) },
      zones: Array.isArray(source.zones) ? source.zones : clone(defaultTakeaway.zones)
    };
  }

  function localTakeaway() {
    return cleanTakeaway(JSON.parse(localStorage.getItem(takeawayKey) || "null") || clone(defaultTakeaway));
  }

  async function request(path, options) {
    const response = await fetch(`${apiBaseUrl}${path}`, { headers: { "Content-Type": "application/json" }, ...options });
    if (!response.ok) throw new Error(`Zero API failed with ${response.status}.`);
    return response.json();
  }

  async function getTakeaway() {
    if (apiBaseUrl) return cleanTakeaway(await request("/takeaways/harbour-street-kitchen"));
    return localTakeaway();
  }

  async function saveTakeaway(profile) {
    const next = cleanTakeaway(profile);
    if (apiBaseUrl) return cleanTakeaway(await request(`/takeaways/${next.id}`, { body: JSON.stringify(next), method: "PUT" }));
    localStorage.setItem(takeawayKey, JSON.stringify(next));
    return next;
  }

  async function resetTakeaway() {
    return saveTakeaway(clone(defaultTakeaway));
  }

  function localFleet() {
    const saved = JSON.parse(localStorage.getItem(fleetKey) || "null");
    return Array.isArray(saved) && saved.length ? saved : clone(defaultFleet);
  }

  async function listFleet() {
    if (apiBaseUrl) return request("/master/takeaways");
    return localFleet();
  }

  async function saveFleet(items) {
    if (apiBaseUrl) return request("/master/takeaways", { body: JSON.stringify({ items }), method: "PUT" });
    localStorage.setItem(fleetKey, JSON.stringify(items));
    return items;
  }

  window.ZeroTakeawayApi = { createId, defaults: clone(defaultTakeaway), getTakeaway, resetTakeaway, saveTakeaway };
  window.ZeroMenuApi = {
    createId,
    defaults: clone(defaultMenu),
    async listMenu() { return (await getTakeaway()).menu; },
    async resetMenu() { return (await resetTakeaway()).menu; },
    async saveMenu(items) {
      const takeaway = await getTakeaway();
      takeaway.menu = items;
      return (await saveTakeaway(takeaway)).menu;
    }
  };
  window.ZeroFleetApi = { createId, defaults: clone(defaultFleet), listFleet, saveFleet };
})();
