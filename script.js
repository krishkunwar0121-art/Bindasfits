// Small site script: load products, cart, search, cart storage, and simple forms
const PRODUCTS_URL = 'assets/products.json';
let PRODUCTS = [];
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

function setYearIds(){
  for(let i=1;i<=7;i++){
    const el = document.getElementById('year'+(i===1? '' : i));
    if(el) el.textContent = new Date().getFullYear();
  }
  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
}
setYearIds();

function fetchProducts(){
  return fetch(PRODUCTS_URL).then(r=>r.json()).then(j=>{PRODUCTS = j; return PRODUCTS});
}

function productCard(product){
  return `
    <div class="product" data-id="${product.id}">
      <img src="${product.image}" alt="${product.title}">
      <h4>${product.title}</h4>
      <p class="price">₹${product.price}</p>
      <p class="muted">${product.category}</p>
      <div style="display:flex;gap:8px;margin-top:auto;">
        <button class="btn btn-add" data-id="${product.id}">Add to cart</button>
        <a class="btn btn-outline" href="product.html?id=${product.id}">View</a>
      </div>
    </div>`;
}

function renderFeatured(){
  const grid = $('#featured-grid');
  if(!grid) return;
  const featured = PRODUCTS.slice(0,4);
  grid.innerHTML = featured.map(productCard).join('');
  attachAddButtons();
}

function renderProducts(filter='all', q=''){
  const grid = $('#products-grid');
  if(!grid) return;
  const list = PRODUCTS.filter(p=>{
    const matchCat = filter==='all' || p.category===filter;
    const matchQ = q==='' || p.title.toLowerCase().includes(q.toLowerCase());
    return matchCat && matchQ;
  });
  grid.innerHTML = list.map(productCard).join('');
  attachAddButtons();
}

function attachAddButtons(){
  $$('.btn-add').forEach(btn=>{
    btn.onclick = () => {
      const id = btn.dataset.id;
      addToCart(id,1);
    };
  });
}

function getCart(){
  return JSON.parse(localStorage.getItem('bf_cart')||'[]');
}

function saveCart(cart){
  localStorage.setItem('bf_cart', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(id, qty=1){
  const cart = getCart();
  const item = cart.find(i=>i.id===id);
  if(item) item.qty += qty;
  else{
    const p = PRODUCTS.find(x=>x.id===id);
    cart.push({id, qty, title:p.title, price:p.price, image:p.image});
  }
  saveCart(cart);
  alert('Added to cart');
}

function updateCartCount(){
  const c = getCart().reduce((s,i)=>s+i.qty,0);
  $$('#cart-count').forEach(el=>el.textContent = c);
}

function renderProductDetail(id){
  const target = $('#product-detail');
  if(!target) return;
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) { target.innerHTML = '<p>Product not found</p>'; return; }
  target.innerHTML = `
    <div><img src="${p.image}" alt="${p.title}"></div>
    <div>
      <h1>${p.title}</h1>
      <p class="price">₹${p.price}</p>
      <p>${p.description}</p>
      <div class="product-actions">
        <input class="qty" type="number" min="1" value="1" id="prod-qty">
        <button class="btn" id="add-cart-btn">Add to cart</button>
      </div>
    </div>`;
  $('#add-cart-btn').addEventListener('click', ()=>{
    const q = Number($('#prod-qty').value||1);
    addToCart(id,q);
  });
}

function renderCartPage(){
  const list = $('#cart-list');
  const summary = $('#cart-summary');
  if(!list || !summary) return;
  const cart = getCart();
  if(cart.length===0){
    list.innerHTML = '<p>Your cart is empty.</p>';
    summary.innerHTML = '';
    return;
  }
  list.innerHTML = cart.map(it=>{
    return `<div class="cart-item" data-id="${it.id}">
      <img src="${it.image}" alt="${it.title}">
      <div style="flex:1">
        <h4>${it.title}</h4>
        <p>₹${it.price} x <input class="qty" data-id="${it.id}" type="number" min="1" value="${it.qty}" style="width:68px"></p>
      </div>
      <div>
        <p>₹${it.price * it.qty}</p>
        <button class="btn btn-remove" data-id="${it.id}">Remove</button>
      </div>
    </div>`;
  }).join('');
  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  summary.innerHTML = `<div>Total: ₹${total}</div>
    <div style="margin-top:12px"><button id="checkout-btn" class="btn">Proceed to Checkout (Demo)</button></div>`;

  $$('.btn-remove').forEach(b=>b.onclick = ()=>{
    const id = b.dataset.id;
    const c = getCart().filter(x=>x.id!==id);
    saveCart(c);
    renderCartPage();
  });

  $$('.qty').forEach(inp=>{
    inp.onchange = ()=>{
      const id = inp.dataset.id;
      const val = Number(inp.value);
      const cart = getCart();
      const it = cart.find(x=>x.id===id);
      if(it){
        it.qty = val > 0 ? val : 1;
        saveCart(cart);
        renderCartPage();
      }
    };
  });

  $('#checkout-btn')?.addEventListener('click', ()=>alert('Checkout demo — integrate payments in backend later.'));
}

function initSite(){
  // mobile toggle
  $('#mobile-toggle')?.addEventListener('click', ()=>document.querySelector('.main-nav').classList.toggle('open'));
  $('#mobile-toggle-2')?.addEventListener('click', ()=>document.querySelector('.main-nav').classList.toggle('open'));

  updateCartCount();

  // home page
  if(document.body.contains($('#featured-grid'))){
    fetchProducts().then(renderFeatured);
  }

  // products page
  if(document.body.contains($('#products-grid'))){
    fetchProducts().then(()=>{
      renderProducts();
      $('#filter-category').onchange = ()=> renderProducts($('#filter-category').value, $('#search').value);
      $('#search').oninput = ()=> renderProducts($('#filter-category').value, $('#search').value);
    });
  }

  // product page
  if(document.body.contains($('#product-detail'))){
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    fetchProducts().then(()=> renderProductDetail(id));
  }

  // cart page
  if(document.body.contains($('#cart-list'))){
    fetchProducts().then(renderCartPage);
  }

  // contact form
  const contactForm = $('#contact-form');
  if(contactForm){
    contactForm.addEventListener('submit', e=>{
      e.preventDefault();
      $('#contact-msg').textContent = 'Message sent (demo).';
      contactForm.reset();
    });
  }

  // login form demo
  const loginForm = $('#login-form');
  if(loginForm){
    loginForm.addEventListener('submit', e=>{
      e.preventDefault();
      alert('Login demo — implement backend auth later.');
    });
  }
}

document.addEventListener('DOMContentLoaded', initSite);