export const messages = {
  th: {
    home: "หน้าหลัก", products: "สินค้า", login: "เข้าสู่ระบบ", cart: "ตะกร้าสินค้า",
    changeMode: "เปลี่ยน Pet Mode", light: "โหมดสว่าง", dark: "โหมดมืด",
    soundOn: "เปิดเสียง — กดเพื่อปิด", soundOff: "ปิดเสียง — กดเพื่อเปิด",
    landingTitle: "บ้านคุณเป็นทีมไหน?", landingIntro: "เลือกเพื่อนขนฟูของคุณ แล้วเราเตรียมของโปรดให้เอง",
    catCopy: "ของดีที่เจ้านายอนุมัติ", dogCopy: "พร้อมสนุกทุกวินาที", bothCopy: "สองทีม หนึ่งบ้านแสนสุข",
    foundation: "โครงหน้าสำหรับ M3A พร้อมแล้ว", notFound: "ไม่พบหน้านี้", backHome: "กลับหน้าหลัก",
  },
  en: {
    home: "Home", products: "Products", login: "Login", cart: "Cart",
    changeMode: "Change Pet Mode", light: "Light mode", dark: "Dark mode",
    soundOn: "Sound On — turn off", soundOff: "Sound Off — turn on",
    landingTitle: "Which team is your home?", landingIntro: "Choose your furry crew and we’ll prepare their favorites.",
    catCopy: "Approved by your feline boss", dogCopy: "Ready for fun every second", bothCopy: "Two teams, one happy home",
    foundation: "M3A route foundation is ready", notFound: "Page not found", backHome: "Back to Home",
  },
};

Object.assign(messages.th, {
  homeTitle: "ของโปรดสำหรับ", homeTitleAccent: "เพื่อนที่ดีที่สุด", homeIntro: "คัดของเล่น ของใช้ และขนมที่เติมความสุขให้ทุกเสียงเหมียวและทุกหางที่ส่าย",
  viewAllProducts: "ดูสินค้าทั้งหมด", happyPets: "แมวและหมาแสนสุข", weeklyFavorites: "ของโปรดประจำสัปดาห์", viewAll: "ดูทั้งหมด →", showLess: "แสดงน้อยลง ↑",
  noFeaturedProducts: "ยังไม่มีสินค้าแนะนำ", bannerTitle: "รับข่าวดีจากแก๊ง PAP", bannerIntro: "ของใหม่ โปรลับ และเรื่องน่ารักส่งตรงถึงหน้าจอ", joinPack: "เข้าร่วมแก๊ง",
  productsTitle: "ช้อปความสุข", productsIntro: "ของชิ้นเล็กที่สร้างโมเมนต์ใหญ่ให้สมาชิกขนฟู", productFilters: "ตัวกรองสินค้า",
  search: "ค้นหา", searchPlaceholder: "ค้นหาชื่อ รายละเอียด หรือหมวดหมู่", clearSearch: "ล้างคำค้นหา", petType: "ประเภทสัตว์", age: "ช่วงวัย", allAges: "ทุกช่วงวัย",
  kitten: "ลูกแมว", puppy: "ลูกสุนัข", puppyKitten: "ลูกสุนัข / ลูกแมว", adult: "โตเต็มวัย", senior: "สูงวัย", hideOutOfStock: "ซ่อนสินค้าที่หมด",
  sort: "เรียงตาม", recommended: "แนะนำ", priceLowHigh: "ราคา: ต่ำไปสูง", priceHighLow: "ราคา: สูงไปต่ำ", nameAZ: "ชื่อ: A ถึง Z", newest: "ใหม่ล่าสุด",
  priceRange: "ช่วงราคา", minimumPrice: "ราคาต่ำสุด", maximumPrice: "ราคาสูงสุด", favoritesOnly: "เฉพาะรายการโปรด", favoritesDeviceOnly: "บันทึกเฉพาะในอุปกรณ์นี้ ไม่ซิงก์กับบัญชี", resetFilters: "ล้างตัวกรอง",
  allProducts: "สินค้าทั้งหมด", catOnly: "แมว", dogOnly: "หมา", bothOnly: "ใช้ได้ทั้งคู่", forCat: "สำหรับแมว", forDog: "สำหรับหมา", forBoth: "สำหรับแมวและหมา",
  viewProduct: "ดู", addFavorite: "เพิ่มเป็นรายการโปรด", removeFavorite: "นำออกจากรายการโปรด", outStock: "สินค้าหมด", inStock: "มีสินค้า: {count}", stock: "สต็อก", items: "{count} ชิ้น",
  productCount: "พบสินค้า {count} ชิ้น", searchCount: "กำลังดมหาของให้น้อง... เจอ {count} ชิ้น", noFavorites: "ยังไม่มีของโปรดในอุปกรณ์นี้", noSearchResults: "ดมหาแล้ว แต่ยังไม่เจอสินค้าที่ตรงกัน", noCategoryProducts: "ยังไม่มีสินค้าในหมวดนี้", tryFilters: "ลองเปลี่ยนคำค้นหาหรือตัวกรองดูนะ",
  loadingProducts: "กำลังโหลดสินค้า", catalogError: "โหลดสินค้าไม่สำเร็จ", retry: "ลองอีกครั้ง", productMissing: "ไม่พบสินค้านี้", backToProducts: "กลับไปเลือกสินค้า",
  "category.Food": "อาหาร", "category.Treats": "ขนม", "category.Toys": "ของเล่น", "category.Beds": "ที่นอน", "category.Grooming": "ดูแลขน", "category.Clothing": "เสื้อผ้า", "category.Accessories": "อุปกรณ์", "category.Health & Care": "สุขภาพและการดูแล", "category.Other": "อื่น ๆ", "category.Cat Litter": "ทรายแมว", "category.Litter Box": "กระบะทราย", "category.Cat Toilet": "ห้องน้ำแมว",
});

Object.assign(messages.en, {
  homeTitle: "Favorites for", homeTitleAccent: "your best friend", homeIntro: "Toys, essentials, and treats for every meow and wagging tail.",
  viewAllProducts: "View all products", happyPets: "Happy cats and dogs", weeklyFavorites: "Weekly favorites", viewAll: "View All →", showLess: "Show Less ↑",
  noFeaturedProducts: "No featured products yet", bannerTitle: "Good news from the PAP pack", bannerIntro: "New arrivals, secret deals, and cute stories delivered to your screen.", joinPack: "Join the Pack",
  productsTitle: "Shop happiness", productsIntro: "Small things that create big moments for furry family members.", productFilters: "Product filters",
  search: "Search", searchPlaceholder: "Search name, description, or category", clearSearch: "Clear search", petType: "Pet Type", age: "Age", allAges: "All Ages", kitten: "Kitten", puppy: "Puppy", puppyKitten: "Puppy / Kitten", adult: "Adult", senior: "Senior", hideOutOfStock: "Hide out-of-stock",
  sort: "Sort", recommended: "Recommended", priceLowHigh: "Price: Low to High", priceHighLow: "Price: High to Low", nameAZ: "Name: A to Z", newest: "Newest",
  priceRange: "Price Range", minimumPrice: "Minimum price", maximumPrice: "Maximum price", favoritesOnly: "Favorites only", favoritesDeviceOnly: "Saved on this device only — not synced to your account", resetFilters: "Reset filters",
  allProducts: "All Products", catOnly: "Cat", dogOnly: "Dog", bothOnly: "Cat & Dog", forCat: "For Cat", forDog: "For Dog", forBoth: "For Cat & Dog",
  viewProduct: "View", addFavorite: "Add to favorites", removeFavorite: "Remove from favorites", outStock: "Out of Stock", inStock: "In Stock: {count}", stock: "Stock", items: "{count} items",
  productCount: "{count} products found", searchCount: "Sniffing out goodies... {count} found", noFavorites: "No favorites saved on this device yet", noSearchResults: "We sniffed everywhere, but found no matching products", noCategoryProducts: "No products in this category", tryFilters: "Try a different search or filter",
  loadingProducts: "Loading products", catalogError: "Products could not be loaded", retry: "Try again", productMissing: "Product not found", backToProducts: "Back to Products",
  ...Object.fromEntries(["Food", "Treats", "Toys", "Beds", "Grooming", "Clothing", "Accessories", "Health & Care", "Other", "Cat Litter", "Litter Box", "Cat Toilet"].map((category) => [`category.${category}`, category])),
});
