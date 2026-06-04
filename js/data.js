/* =========================================================
   SoulScythe — seed data (products, reviews, fake orders)
   Pre-populated so the site is fully functional with no backend.
   ========================================================= */
window.SS_DATA = {
  admin: { email: "admin@soulscythe.com", password: "admin123" },
  categories: ["Figures", "Apparel", "Posters", "Accessories"],
  products: [
    { id: 1, name: "Ichigo Bankai Figure", category: "Figures", price: 89.99, oldPrice: 109.99, badge: "Bestseller", rating: 5, colors: ["#e01e2b", "#1a1a22"], sizes: ["One Size"], description: "Premium 1/7 scale Bankai figure with hand-painted detailing and a dynamic battle-ready pose. Limited foundry run." },
    { id: 2, name: "Tanjiro Water Breathing Figure", category: "Figures", price: 79.99, badge: "New", rating: 5, colors: ["#19a9ff", "#0c2a44"], sizes: ["One Size"], description: "Capture the flowing Water Breathing technique in stunning translucent resin with LED-ready base." },
    { id: 3, name: "Edward Elric Alchemist Statue", category: "Figures", price: 99.99, rating: 4, colors: ["#e8b923", "#3a2a05"], sizes: ["One Size"], description: "A detailed alchemist statue mid-transmutation, complete with glowing array base and signature red coat." },
    { id: 4, name: "SoulScythe Reaper Hoodie", category: "Apparel", price: 64.99, badge: "Limited", rating: 5, colors: ["#e01e2b", "#08080b"], sizes: ["S", "M", "L", "XL", "2XL"], description: "Heavyweight blackout hoodie with reflective reaper embroidery and blood-red interior hood lining." },
    { id: 5, name: "Demon Slayer Haori Jacket", category: "Apparel", price: 74.99, rating: 4, colors: ["#2ecc71", "#0c2a18"], sizes: ["S", "M", "L", "XL"], description: "Checkered-pattern haori-inspired bomber jacket. Lightweight, breathable, and battle-stylish." },
    { id: 6, name: "Akatsuki Cloud Tee", category: "Apparel", price: 29.99, rating: 4, colors: ["#e01e2b", "#14141d"], sizes: ["S", "M", "L", "XL", "2XL"], description: "Soft-touch cotton tee with the iconic red cloud print front and back. A rogue classic." },
    { id: 7, name: "Bleach Espada Poster Set", category: "Posters", price: 24.99, badge: "Set of 3", rating: 5, colors: ["#39e6ff", "#0c1a2a"], sizes: ["A2"], description: "Museum-grade matte poster trilogy featuring the Espada in striking monochrome and neon accents." },
    { id: 8, name: "Alchemist Transmutation Poster", category: "Posters", price: 19.99, rating: 4, colors: ["#e8b923", "#2a2105"], sizes: ["A2", "A1"], description: "Glow-in-the-dark transmutation circle poster printed on premium 250gsm stock." },
    { id: 9, name: "Sharingan LED Keychain", category: "Accessories", price: 14.99, badge: "Hot", rating: 5, colors: ["#e01e2b", "#1a0205"], sizes: ["One Size"], description: "Light-up Sharingan keychain with three glow modes. The eye that sees all your keys." },
    { id: 10, name: "Nichirin Blade Replica", category: "Accessories", price: 49.99, rating: 5, colors: ["#19a9ff", "#08151f"], sizes: ["One Size"], description: "Collector display replica with reinforced scabbard and themed stand. For display only." },
    { id: 11, name: "Soul Reaper Enamel Pin Pack", category: "Accessories", price: 12.99, rating: 4, colors: ["#e8b923", "#1a1505"], sizes: ["One Size"], description: "Set of 5 hard-enamel pins featuring iconic soul-society crests." },
    { id: 12, name: "Flame Hashira Premium Figure", category: "Figures", price: 119.99, badge: "Premium", rating: 5, colors: ["#ff6a00", "#2a0c02"], sizes: ["One Size"], description: "Top-tier 1/6 scale flame-effect figure with translucent fire parts and a deluxe diorama base." }
  ],
  reviews: [
    { author: "Ichigo_Fan99", stars: 5, text: "The Bankai figure is INSANE. Detail is razor sharp and the base glows perfectly. Shipping was lightning fast." },
    { author: "DemonSlayer_Kira", stars: 5, text: "Wore the Reaper Hoodie to a con and got stopped 12 times for photos. Worth every penny." },
    { author: "AlchemistEd", stars: 4, text: "The transmutation poster glows way brighter than I expected. My whole room feels like a lab now." },
    { author: "BleachBankai", stars: 5, text: "Espada poster set is gallery quality. Already ordered a second set for my brother." },
    { author: "SharinganSeer", stars: 5, text: "That LED keychain is dangerously cool. The eye actually follows you. Obsessed." },
    { author: "NichirinNova", stars: 4, text: "Blade replica is heavier and nicer than the photos. The stand really completes the display." }
  ],
  orders: [
    { id: "SS-100245", customer: "Ichigo Kurosaki", email: "ichigo@soulsociety.io", total: 154.98, status: "Processing", date: "2026-05-28", items: 2 },
    { id: "SS-100246", customer: "Tanjiro Kamado", email: "tanjiro@slayer.io", total: 79.99, status: "Shipped", date: "2026-05-27", items: 1 },
    { id: "SS-100247", customer: "Edward Elric", email: "ed@alchemy.io", total: 219.97, status: "Delivered", date: "2026-05-25", items: 3 },
    { id: "SS-100248", customer: "Rukia Kuchiki", email: "rukia@soulsociety.io", total: 44.98, status: "Processing", date: "2026-05-24", items: 2 },
    { id: "SS-100249", customer: "Roy Mustang", email: "roy@flame.io", total: 119.99, status: "Shipped", date: "2026-05-22", items: 1 }
  ]
};

/* Seed localStorage on first visit so data persists across pages */
(function seedStorage() {
  if (!localStorage.getItem("ss_products")) {
    localStorage.setItem("ss_products", JSON.stringify(window.SS_DATA.products));
  }
  if (!localStorage.getItem("ss_orders")) {
    localStorage.setItem("ss_orders", JSON.stringify(window.SS_DATA.orders));
  }
  if (!localStorage.getItem("ss_reviews")) {
    localStorage.setItem("ss_reviews", JSON.stringify(window.SS_DATA.reviews));
  }
})();
