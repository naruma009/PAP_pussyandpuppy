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
  inCart: "ในตะกร้า: {count}", notInCart: "ยังไม่อยู่ในตะกร้า", addCart: "เพิ่มลงตะกร้า ＋", add: "เพิ่ม", toCart: "ลงตะกร้า", stockLimit: "ถึงจำนวนสต็อกสูงสุดแล้ว", added: "เพิ่มลงตะกร้าแล้ว!", cartCount: "สินค้าในตะกร้า {count} ชิ้น",
  checkingSession: "กำลังตรวจสอบการเข้าสู่ระบบ", retrySession: "ลองตรวจสอบการเข้าสู่ระบบอีกครั้ง", sessionUnavailable: "ไม่สามารถตรวจสอบการเข้าสู่ระบบได้", logout: "ออกจากระบบ",
  cartTitle: "ตะกร้าความสุข", cartIntro: "ตรวจของโปรดก่อนพากลับบ้าน", loadingCart: "กำลังโหลดตะกร้า", emptyCart: "ตะกร้ายังว่างอยู่", browseProducts: "ไปเลือกของน่ารัก ๆ", perItem: "/ ชิ้น", decrease: "ลดจำนวน", increase: "เพิ่มจำนวน", remove: "ลบ", orderSummary: "สรุปคำสั่งซื้อ", total: "ยอดรวม", checkout: "ชำระเงิน",
  loginTitle: "เข้าสู่แก๊ง PAP", demoLoginNote: "Demo Login เท่านั้น — ไม่มีการยืนยันตัวตนและไม่ควรใช้กับข้อมูลจริง", nickname: "ชื่อเล่น", nicknameExample: "เช่น มะลิ", email: "อีเมล", signingIn: "กำลังเข้าสู่ระบบ", demoLogin: "เข้าสู่ระบบแบบ Demo", helloDemo: "สวัสดี {name} — คุณกำลังใช้บัญชี Demo", loggedIn: "เข้าสู่ระบบแล้ว สวัสดี {name}!",
  shippingOrder: "การจัดส่งและคำสั่งซื้อ", checkoutIntro: "ตรวจข้อมูลจัดส่งและรายการสินค้าก่อนยืนยัน", shipping: "ที่อยู่จัดส่ง", fullName: "ชื่อ-นามสกุล", phone: "เบอร์โทรศัพท์", address: "ที่อยู่", district: "เขต / อำเภอ", province: "จังหวัด", postalCode: "รหัสไปรษณีย์", addressHint: "กรอกข้อมูลเพื่อดูที่อยู่จัดส่ง", placeOrder: "ยืนยันคำสั่งซื้อ", placingOrder: "กำลังยืนยันคำสั่งซื้อ", orderConfirmed: "ยืนยันคำสั่งซื้อแล้ว", thanks: "ขอบคุณ!", orderPlaced: "คำสั่งซื้อ {id} ถูกบันทึกแล้ว",
  myOrders: "คำสั่งซื้อของฉัน", loadingOrders: "กำลังโหลดคำสั่งซื้อ", ordersUnavailable: "โหลดคำสั่งซื้อไม่สำเร็จ", noOrders: "ยังไม่มีคำสั่งซื้อ",
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
  inCart: "In Cart: {count}", notInCart: "Not in cart", addCart: "Add to Cart ＋", add: "Add", toCart: "to cart", stockLimit: "Stock limit reached", added: "Added to cart!", cartCount: "{count} items in cart",
  checkingSession: "Checking your session", retrySession: "Retry session", sessionUnavailable: "Your session could not be checked", logout: "Logout",
  cartTitle: "Cart of happiness", cartIntro: "Check their favorites before bringing them home.", loadingCart: "Loading cart", emptyCart: "Your cart is empty", browseProducts: "Browse cute products", perItem: "/ item", decrease: "Decrease", increase: "Increase", remove: "Remove", orderSummary: "Order Summary", total: "Total", checkout: "Checkout",
  loginTitle: "Join the PAP pack", demoLoginNote: "Demo login only — no identity verification; do not use real personal data.", nickname: "Nickname", nicknameExample: "e.g. Mali", email: "Email", signingIn: "Signing in", demoLogin: "Demo Login", helloDemo: "Hello {name} — you are using a demo account", loggedIn: "Logged in. Hello {name}!",
  shippingOrder: "Shipping & Order", checkoutIntro: "Review your shipping details and items before confirming.", shipping: "Shipping Address", fullName: "Full Name", phone: "Phone Number", address: "Address", district: "District / Area", province: "Province", postalCode: "Postal Code", addressHint: "Enter your details to preview the shipping address", placeOrder: "Place Order", placingOrder: "Placing order", orderConfirmed: "Order confirmed", thanks: "Thank you!", orderPlaced: "Order {id} has been placed.",
  myOrders: "My Orders", loadingOrders: "Loading orders", ordersUnavailable: "Orders could not be loaded", noOrders: "You have no orders yet",
  ...Object.fromEntries(["Food", "Treats", "Toys", "Beds", "Grooming", "Clothing", "Accessories", "Health & Care", "Other", "Cat Litter", "Litter Box", "Cat Toilet"].map((category) => [`category.${category}`, category])),
});

// M1: keep the existing preference keys while presenting the current brand.
Object.assign(messages.th, {
  bannerTitle: "รับข่าวดีจากแก๊ง pal2paw",
  loginTitle: "เข้าสู่แก๊ง pal2paw",
  manageProductsIntro: "เพิ่ม แก้ไข และดูแลสต็อกสินค้าของ pal2paw",
  personalityChatAsk: "ถามน้อง PAP",
});
Object.assign(messages.en, {
  bannerTitle: "Good news from the pal2paw pack",
  loginTitle: "Join the pal2paw pack",
  manageProductsIntro: "Add, edit, and maintain pal2paw product stock.",
  personalityChatAsk: "Ask PAP Pet",
});

Object.assign(messages.th, {
  manageProducts: "จัดการสินค้า", manageProductsIntro: "เพิ่ม แก้ไข และดูแลสต็อกสินค้าของ PAP", productInformation: "ข้อมูลสินค้า", productImage: "รูปสินค้า", imageHelp: "PNG, JPEG หรือ WebP ไม่เกิน 1.5 MB", productName: "ชื่อสินค้า", productDescription: "รายละเอียดสินค้า", productPrice: "ราคา (บาท)", stockQuantity: "จำนวนสต็อก", category: "หมวดหมู่", featuredProduct: "สินค้าแนะนำ",
  livePreview: "ตัวอย่างสินค้า", previewProductName: "ชื่อสินค้า", previewProductDescription: "รายละเอียดสินค้าจะแสดงที่นี่", adminStockCount: "สต็อก: {count} ชิ้น", "adminPet.cat": "สำหรับแมว", "adminPet.dog": "สำหรับหมา", "adminPet.both": "สำหรับแมวและหมา", "adminAge.all": "ทุกช่วงวัย", "adminAge.young": "ลูกสุนัข / ลูกแมว", "adminAge.adult": "โตเต็มวัย", "adminAge.senior": "สูงวัย",
  addProduct: "เพิ่มสินค้า", saveChanges: "บันทึกการแก้ไข", savingProduct: "กำลังบันทึก", clearForm: "ล้างฟอร์ม", cancelEdit: "ยกเลิกการแก้ไข", imageTooLarge: "รูปต้องมีขนาดไม่เกิน 1.5 MB", invalidImageType: "รูปต้องเป็น PNG, JPEG หรือ WebP", productAdded: "เพิ่มสินค้าแล้ว", productUpdated: "อัปเดตสินค้าแล้ว", productDeleted: "ลบสินค้าแล้ว", catalogSyncFailed: "ซิงก์รายการสินค้าล่าสุดไม่สำเร็จ",
  productList: "รายการสินค้า", image: "รูป", product: "สินค้า", categoryPet: "หมวดหมู่ / สัตว์", price: "ราคา", actions: "การทำงาน", out: "หมด", edit: "แก้ไข", delete: "ลบ", editProduct: "แก้ไข {name}", deleteProduct: "ลบ {name}", confirmDeleteProduct: "ยืนยันการลบ {name}?", noProductsAdmin: "ยังไม่มีสินค้า",
  customerOrdersAdmin: "คำสั่งซื้อของลูกค้า", adminOrdersIntro: "ตรวจสอบคำสั่งซื้อและข้อมูลจัดส่งล่าสุด", loadingAdminOrders: "กำลังโหลดคำสั่งซื้อของลูกค้า", adminOrdersUnavailable: "ไม่สามารถโหลดคำสั่งซื้อได้", noAdminOrders: "ยังไม่มีคำสั่งซื้อจากลูกค้า", orderId: "เลขคำสั่งซื้อ", orderedAt: "วันที่สั่งซื้อ", customerDetails: "ข้อมูลลูกค้า", shippingAddress: "ที่อยู่จัดส่ง", orderItems: "รายการสินค้า", orderTotal: "ยอดรวม", orderStatus: "สถานะ",
});

Object.assign(messages.en, {
  manageProducts: "Manage Products", manageProductsIntro: "Add, edit, and maintain PAP product stock.", productInformation: "Product Information", productImage: "Product Image", imageHelp: "PNG, JPEG, or WebP up to 1.5 MB", productName: "Product Name", productDescription: "Product Description", productPrice: "Price (THB)", stockQuantity: "Stock Quantity", category: "Category", featuredProduct: "Featured product",
  livePreview: "Live Preview", previewProductName: "Product Name", previewProductDescription: "Product description will appear here.", adminStockCount: "Stock: {count} items", "adminPet.cat": "For Cat", "adminPet.dog": "For Dog", "adminPet.both": "For Cat & Dog", "adminAge.all": "All Ages", "adminAge.young": "Puppy / Kitten", "adminAge.adult": "Adult", "adminAge.senior": "Senior",
  addProduct: "Add Product", saveChanges: "Save Changes", savingProduct: "Saving", clearForm: "Clear", cancelEdit: "Cancel Edit", imageTooLarge: "Image must be no larger than 1.5 MB.", invalidImageType: "Image must be PNG, JPEG, or WebP.", productAdded: "Product added", productUpdated: "Product updated", productDeleted: "Product deleted", catalogSyncFailed: "Latest product sync failed",
  productList: "Product List", image: "Image", product: "Product", categoryPet: "Category / Pet", price: "Price", actions: "Actions", out: "Out", edit: "Edit", delete: "Delete", editProduct: "Edit {name}", deleteProduct: "Delete {name}", confirmDeleteProduct: "Are you sure you want to delete {name}?", noProductsAdmin: "No products yet",
  customerOrdersAdmin: "Customer Orders", adminOrdersIntro: "Review the latest orders and shipping details.", loadingAdminOrders: "Loading customer orders", adminOrdersUnavailable: "Customer orders could not be loaded", noAdminOrders: "No customer orders yet", orderId: "Order ID", orderedAt: "Ordered at", customerDetails: "Customer", shippingAddress: "Shipping address", orderItems: "Items", orderTotal: "Total", orderStatus: "Status",
});

Object.assign(messages.th, {
  adminLogin: "เข้าสู่ระบบผู้ดูแล", accessCode: "รหัสผ่านผู้ดูแล", checkingCode: "กำลังตรวจสอบ", continueAdmin: "ดำเนินการต่อ", closeAdminLogin: "ปิดหน้าต่างเข้าสู่ระบบผู้ดูแล",
  adminNavigation: "เมนูผู้ดูแล", logoutAdmin: "ออกจากระบบผู้ดูแล", loggingOutAdmin: "กำลังออกจากระบบ", checkingAdmin: "กำลังตรวจสอบสิทธิ์ผู้ดูแล", adminSessionError: "ไม่สามารถตรวจสอบสิทธิ์ผู้ดูแลได้",
  adminDashboard: "แดชบอร์ดผู้ดูแล", adminFoundation: "ระบบผู้ดูแลพร้อมแล้ว การจัดการสินค้าและคำสั่งซื้อจะเพิ่มในขั้นถัดไป",
});

Object.assign(messages.en, {
  adminLogin: "Admin Login", accessCode: "Access code", checkingCode: "Checking", continueAdmin: "Continue", closeAdminLogin: "Close admin login",
  adminNavigation: "Admin navigation", logoutAdmin: "Logout Admin", loggingOutAdmin: "Logging out", checkingAdmin: "Checking admin access", adminSessionError: "Admin access could not be checked",
  adminDashboard: "Admin Dashboard", adminFoundation: "Admin access is ready. Product and order management will be added in the next phase.",
});

Object.assign(messages.th, {
  personalityFeed: "🍪 ให้อาหาร", personalityPet: "🤍 ลูบหัว", personalityChatAsk: "ถามน้อง PAP", personalityChatNote: "พวกน้องตอบตามภาษาของพวกน้อง — ไม่ใช่ AI",
  personalityClose: "ปิด", personalitySend: "ส่ง", personalityTyping: "กำลังพิมพ์", personalityChatMessage: "ข้อความถึงน้อง", personalityChatPlaceholder: "อยากรู้อะไร ถามน้องได้เลย",
  personalityMoodCta: "วันนี้น้องคิดอะไรอยู่?", personalityMoodWho: "วันนี้อยากวิเคราะห์ใคร?", personalityCatPet: "🐱 น้องแมว", personalityDogPet: "🐶 น้องหมา", personalityQuestion: "คำถาม", personalityRecommend: "แนะนำหมวดหมู่:",
});

Object.assign(messages.en, {
  personalityFeed: "🍪 Feed", personalityPet: "🤍 Pet", personalityChatAsk: "Ask PAP Pet", personalityChatNote: "Pet-language replies — not AI",
  personalityClose: "Close", personalitySend: "Send", personalityTyping: "Typing", personalityChatMessage: "Message to your pet", personalityChatPlaceholder: "Ask your pet anything",
  personalityMoodCta: "What is your pet thinking today?", personalityMoodWho: "Who would you like to analyze today?", personalityCatPet: "🐱 Cat", personalityDogPet: "🐶 Dog", personalityQuestion: "Question", personalityRecommend: "Recommended category:",
});
