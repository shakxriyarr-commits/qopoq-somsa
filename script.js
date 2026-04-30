import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 1. Firebase konfiguratsiyasi
const firebaseConfig = {
    apiKey: "AIzaSyCZdqBBYEoIXAqln8a9c801AT3G_I_ys4U",
    authDomain: "shsh-120cf.firebaseapp.com",
    databaseURL: "https://shsh-120cf-default-rtdb.firebaseio.com",
    projectId: "shsh-120cf",
    storageBucket: "shsh-120cf.firebasestorage.app",
    messagingSenderId: "897260945183",
    appId: "1:897260945183:web:6e6fd385b1718ed00afa2a",
    measurementId: "G-NDYE872XCD"
};

// 2. Initializatsiya
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const productsRef = ref(db, 'products');

// Telegram Bot ma'lumotlari
const BOT_TOKEN = "8740580495:AAGLyL1oeM-Pu96tFzwvb5Y63uJaPWmGgEI"; 
const ADMIN_ID = "8030496668"; 
const KURYER_ID = "7312694067"; 

// Global o'zgaruvchilar
window.products = [];
window.cart = JSON.parse(localStorage.getItem('burger_cart_blue_final')) || [];
window.isAdmin = false;
let clicks = 0;

// 3. Admin Panelga kirish (Footerga 3 marta bosish)[cite: 2, 3]
window.handleAdmin = () => {
    clicks++;
    if (clicks === 3) {
        const password = prompt("Admin parolini kiriting:");
        if (password === "7777") {
            window.isAdmin = true;
            document.getElementById('admin-box').style.display = 'block';
            window.renderMenu();
        }
        clicks = 0;
    }
    setTimeout(() => { clicks = 0; }, 2000);
};

// 4. Firebase'dan mahsulotlarni real-vaqtda olish[cite: 3]
onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    window.products = [];
    if (data) {
        Object.keys(data).forEach(key => {
            window.products.push({ fKey: key, ...data[key] });
        });
    }
    window.renderMenu();
});

// 5. Menyuni chizish
window.renderMenu = function(data = window.products) {
    const menu = document.getElementById('menuList');
    if (!menu) return;
    menu.innerHTML = data.map((p, index) => `
        <div class="item reveal">
            ${window.isAdmin ? `<button class="admin-del" style="position:absolute; top:10px; right:10px; background:red; color:white; border-radius:50%; border:none; width:30px; height:30px; cursor:pointer;" onclick="removeProduct('${p.fKey}')">&times;</button>` : ''}
            <img src="${p.img}" loading="lazy">
            <h3>${p.name}</h3>
            <div class="price">${p.price.toLocaleString()} so'm</div>
            <button class="button" onclick="addToCart(${p.id})">Savatga qo'shish</button>
        </div>
    `).join('');
};

// 6. Savatga qo'shish va yangilash
window.addToCart = function(id) {
    const p = window.products.find(x => x.id === id);
    const item = window.cart.find(x => x.id === id);
    if(item) item.qty++; else window.cart.push({...p, qty: 1});
    window.updateCart();
};

window.updateCart = function() {
    localStorage.setItem('burger_cart_blue_final', JSON.stringify(window.cart));
    document.getElementById('cart-badge').innerText = window.cart.reduce((s, i) => s + i.qty, 0);
    let total = 0;
    document.getElementById('cart-list').innerHTML = window.cart.map(i => {
        total += i.price * i.qty;
        return `<div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <span>${i.name} (${i.qty})</span>
            <span>${(i.price * i.qty).toLocaleString()} so'm</span>
        </div>`;
    }).join('');
    document.getElementById('total-price').innerText = total.toLocaleString() + " so'm";
};

// 7. BUYURTMA BERISH (Telegram + Firebase)[cite: 3]
window.checkout = function() {
    if (window.cart.length === 0) return alert("Savat bo'sh!");
    const tel = prompt("Telefon raqamingiz:");
    const manzil = prompt("Manzilni kiriting:");
    if (!tel || !manzil) return alert("Ma'lumotlar to'liq emas!");

    let text = `🔵 YANGI BUYURTMA:\n📞 Tel: ${tel}\n📍 Manzil: ${manzil}\n\n`;
    let jami = 0;
    window.cart.forEach(i => {
        text += `• ${i.name} (${i.qty} dona)\n`;
        jami += i.price * i.qty;
    });
    text += `\n💰 JAMI: ${jami.toLocaleString()} so'm`;

    // Telegramga yuborish[cite: 3]
    const ids = [ADMIN_ID, KURYER_ID];
    ids.forEach(id => {
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: id, text: text })
        });
    });

    // Firebase'ga buyurtmani saqlash
    const ordersRef = ref(db, 'orders');
    push(ordersRef, {
        phone: tel,
        address: manzil,
        items: window.cart,
        total: jami,
        date: new Date().toISOString()
    });

    alert("Buyurtma qabul qilindi! Botga xabar yuborildi.");
    window.cart = [];
    window.updateCart();
    window.toggleCart();
};

// 8. Admin Panel: Taom qo'shish va o'chirish[cite: 3]
window.addProduct = () => {
    const n = document.getElementById('p-name').value;
    const p = parseInt(document.getElementById('p-price').value);
    const i = document.getElementById('p-img').value;
    if(n && p && i) {
        push(productsRef, { id: Date.now(), name: n, price: p, img: i }).then(() => {
            alert("Taom qo'shildi!");
            document.getElementById('p-name').value = '';
            document.getElementById('p-price').value = '';
            document.getElementById('p-img').value = '';
        });
    }
};

window.removeProduct = (fKey) => { 
    if(confirm("O'chirilsinmi?")) remove(ref(db, 'products/' + fKey)); 
};

window.toggleCart = () => document.getElementById('cartPanel').classList.toggle('active');
window.updateCart();
