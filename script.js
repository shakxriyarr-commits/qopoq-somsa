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

// Telegram ma'lumotlari
const BOT_TOKEN = "8740580495:AAGLyL1oeM-Pu96tFzwvb5Y63uJaPWmGgEI"; 
const ADMIN_ID = "8030496668"; 
const KURYER_ID = "7312694067"; 

// Global o'zgaruvchilar
window.products = [];
window.cart = JSON.parse(localStorage.getItem('burger_cart_blue_final')) || [];
window.isAdmin = false;
let clicks = 0;

// 3. Maxfiy Admin Panel (3 marta bosish)
window.handleAdmin = () => {
    clicks++;
    if (clicks === 3) {
        const password = prompt("Admin parolini kiriting:");
        if (password === "7777") {
            window.isAdmin = true;
            document.getElementById('admin-box').style.display = 'block';
            window.renderMenu();
            alert("Admin rejimi faol!");
        }
        clicks = 0;
    }
    setTimeout(() => { clicks = 0; }, 2000);
};

// 4. Firebase'dan real-vaqtda olish (Xatolik tuzatildi)[cite: 3]
onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    window.products = [];
    if (data) {
        Object.keys(data).forEach(key => {
            window.products.push({ fKey: key, ...data[key] });
        });
    }
    window.renderMenu(); // Ma'lumot kelishi bilan chizamiz
});

// 5. Menyuni chizish funksiyasi (Tuzatilgan variant)[cite: 2, 3]
window.renderMenu = function(data = window.products) {
    const menu = document.getElementById('menuList');
    if (!menu) return;

    if (data.length === 0) {
        menu.innerHTML = `<p style="color:var(--accent); text-align:center; width:100%;">Menyuda taomlar mavjud emas.</p>`;
        return;
    }

    menu.innerHTML = data.map((p, index) => `
        <div class="item reveal active" style="transition-delay: ${index * 50}ms">
            ${window.isAdmin ? `<button class="admin-del" style="position:absolute; top:10px; right:10px; background:#ff4b2b; color:white; border:none; border-radius:50%; width:30px; height:30px; cursor:pointer; z-index:100;" onclick="removeProduct('${p.fKey}')">&times;</button>` : ''}
            <img src="${p.img}" loading="lazy" onerror="this.src='https://via.placeholder.com/300?text=Rasm+Topilmadi'">
            <h3>${p.name}</h3>
            <div class="price">${Number(p.price).toLocaleString()} so'm</div>
            <button class="button" onclick="addToCart(${p.id})">Savatga qo'shish</button>
        </div>
    `).join('');
};

// 6. Savat va Buyurtma funksiyalari[cite: 3]
window.addToCart = function(id) {
    const p = window.products.find(x => x.id === id);
    if (!p) return;
    const item = window.cart.find(x => x.id === id);
    if(item) item.qty++; else window.cart.push({...p, qty: 1});
    window.updateCart();
};

window.updateCart = function() {
    localStorage.setItem('burger_cart_blue_final', JSON.stringify(window.cart));
    const badge = document.getElementById('cart-badge');
    if(badge) badge.innerText = window.cart.reduce((s, i) => s + i.qty, 0);
    
    let total = 0;
    const cartList = document.getElementById('cart-list');
    if(cartList) {
        cartList.innerHTML = window.cart.map(i => {
            total += i.price * i.qty;
            return `<div style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:1px solid var(--border); padding-bottom:5px;">
                <span>${i.name} (x${i.qty})</span>
                <span style="color:var(--accent)">${(i.price * i.qty).toLocaleString()} so'm</span>
            </div>`;
        }).join('');
    }
    const totalEl = document.getElementById('total-price');
    if(totalEl) totalEl.innerText = total.toLocaleString() + " so'm";
};

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

    const ids = [ADMIN_ID, KURYER_ID];
    ids.forEach(id => {
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: id, text: text })
        });
    });

    alert("Buyurtma qabul qilindi! Admin va Kuryerga xabar yuborildi.");
    window.cart = [];
    window.updateCart();
    window.toggleCart();
};

// 7. Admin: Mahsulot qo'shish (Xatolik tuzatildi)[cite: 3]
window.addProduct = () => {
    const nameEl = document.getElementById('p-name');
    const priceEl = document.getElementById('p-price');
    const imgEl = document.getElementById('p-img');

    if (nameEl.value && priceEl.value && imgEl.value) {
        const newProd = {
            id: Date.now(),
            name: nameEl.value,
            price: parseInt(priceEl.value),
            img: imgEl.value
        };

        push(productsRef, newProd).then(() => {
            alert("Taom qo'shildi!");
            nameEl.value = ''; priceEl.value = ''; imgEl.value = '';
        });
    } else {
        alert("Barcha maydonlarni to'ldiring!");
    }
};

window.removeProduct = (fKey) => { 
    if(confirm("O'chirilsinmi?")) remove(ref(db, 'products/' + fKey)); 
};

window.toggleCart = () => document.getElementById('cartPanel').classList.toggle('active');
window.closeAdmin = () => {
    window.isAdmin = false;
    document.getElementById('admin-box').style.display = 'none';
    window.renderMenu();
};

window.updateCart();
