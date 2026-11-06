(function(){
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
  const CART_KEY="affaTeknikCart";
  window.AffaCart={
    get(){try{return JSON.parse(localStorage.getItem(CART_KEY)||"[]")}catch(e){return[]}},
    save(items){localStorage.setItem(CART_KEY,JSON.stringify(items));window.dispatchEvent(new Event("cartupdated"));},
    count(){return this.get().reduce((n,i)=>n+i.qty,0)},
    total(){return this.get().reduce((n,i)=>n+i.price*i.qty,0)},
    add(product,variant,qty=1){
      const stock=Number(variant.stock??product.stock);
      const itemId=product.id+"::"+variant.sku;
      const items=this.get();
      const found=items.find(i=>i.itemId===itemId);
      const current=found?found.qty:0;
      if(current+qty>stock){showToast("Jumlah melebihi stok yang tersedia.");return false;}
      if(found)found.qty+=qty;
      else items.push({itemId,productId:product.id,sku:variant.sku,name:product.name,brand:product.brand,variant:variant.label,price:variant.price,stock,image:product.image,icon:product.icon,qty});
      this.save(items);showToast("Produk berhasil ditambahkan ke keranjang.");return true;
    },
    change(itemId,delta){
      const items=this.get(),item=items.find(i=>i.itemId===itemId);if(!item)return;
      item.qty=Math.max(1,Math.min(item.stock,item.qty+delta));this.save(items);
    },
    remove(itemId){this.save(this.get().filter(i=>i.itemId!==itemId));showToast("Produk dihapus dari keranjang.");},
    clear(){localStorage.removeItem(CART_KEY);window.dispatchEvent(new Event("cartupdated"));}
  };
  window.showToast=function(message){
    let toast=$("#site-toast");if(!toast){toast=document.createElement("div");toast.id="site-toast";toast.className="toast";document.body.appendChild(toast);}
    toast.textContent=message;toast.style.display="block";clearTimeout(window._toastTimer);window._toastTimer=setTimeout(()=>toast.style.display="none",2800);
  };
  window.escapeHTML=function(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));};
  // Mencoba beberapa format gambar otomatis (jpg, jpeg, png, webp, jfif) sebelum menampilkan placeholder.
  const IMG_EXT=["jpg","jpeg","png","webp","jfif","JPG","JPEG","PNG","WEBP"];
  window.affaImgNext=function(img){
    const i=Number(img.dataset.try||0);
    if(i<IMG_EXT.length){img.dataset.try=i+1;img.src=img.dataset.base+"."+IMG_EXT[i];return;}
    img.style.display="none";if(img.nextElementSibling)img.nextElementSibling.style.display="flex";
  };
  window.productImage=function(product,extraClass=""){
    const safe=escapeHTML(product.image),base=escapeHTML(String(product.image||"").replace(/\.[^./]+$/,"")),alt=escapeHTML(product.name),icon=escapeHTML(product.icon||"▦");
    return `<img class="${extraClass}" src="${safe}" data-base="${base}" alt="${alt}" onerror="affaImgNext(this)"><div class="image-placeholder" style="display:none"><span class="placeholder-icon">${icon}</span><small>FOTO PRODUK</small></div>`;
  };
  window.productCard=function(p){
    return `<article class="product-card">
      <a class="product-image-wrap" href="produk.html?id=${encodeURIComponent(p.id)}">${productImage(p)}<span class="product-badge">${escapeHTML(p.category)}</span></a>
      <div class="product-info"><div class="product-category">${escapeHTML(p.brand)}</div><h3><a href="produk.html?id=${encodeURIComponent(p.id)}">${escapeHTML(p.name)}</a></h3>
      <div class="product-meta">Mulai dari ${formatRupiah(Math.min(...p.variants.map(v=>v.price)))} · Stok ${p.stock}</div>
      <div class="product-bottom"><span class="price">${formatRupiah(p.price)}</span><button class="mini-add" type="button" data-add="${p.id}" aria-label="Tambah ${escapeHTML(p.name)} ke keranjang" title="Tambah ke keranjang">${ICON.plus}<span>Keranjang</span></button><span class="return-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>Kebijakan retur 7 hari</span></div></div></article>`;
  };
  const ICON={
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 7H6"/></svg>',
    menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    wa:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.3-5A8.4 8.4 0 1 1 21 11.5z"/><path d="M9 8.5c0 3.5 3 6.500 6.500 6.500l1-1.700-2-1-.9.900a4.600 4.600 0 0 1-2-2l.9-.9-1-2z" fill="currentColor" stroke="none"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
  };
  window.AFFA_ICON=ICON;
  const WA_URL="https://wa.me/6285256535824";
  function renderHeader(){
    const el=$("#site-header");if(!el)return;
    const path=location.pathname.split("/").pop()||"index.html";
    const on=f=>path===f?" active":"";
    el.innerHTML=`<div class="header-sticky"><div class="header-main"><div class="nav-wrap">
      <a class="brand" href="index.html" aria-label="Affa Teknik — beranda"><img class="brand-logo" src="images/logo-affateknik.png" alt="Logo Affa Teknik"><span><span class="brand-name">AFFA <b>TEKNIK</b></span><span class="brand-caption">Toko teknik &amp; alat pancing</span></span></a>
      <nav class="top-nav" aria-label="Menu utama"><a class="top-link${on("index.html")}" href="index.html">Beranda</a><a class="top-link${on("katalog.html")}" href="katalog.html">Katalog</a><a class="top-link${on("pesanan.html")}" href="pesanan.html">Pesanan</a><a class="top-link" href="index.html#profil">Tentang Toko</a><a class="top-link cart-icon-link${on("keranjang.html")}" href="keranjang.html" aria-label="Keranjang belanja" title="Keranjang">${ICON.cart}<span class="cart-count" id="header-cart-count">0</span></a><button class="theme-toggle" type="button" aria-label="Ganti mode gelap atau terang" title="Mode gelap / terang"><svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button></nav>
    </div></div></div>`;
    // tombol WhatsApp mengambang
    if(!$(".wa-float")){const a=document.createElement("a");a.className="wa-float";a.href=WA_URL;a.target="_blank";a.rel="noopener";a.setAttribute("aria-label","Chat WhatsApp Affa Teknik");a.innerHTML=ICON.wa;document.body.appendChild(a);}
  }
  function renderFooter(){
    const el=$("#site-footer");if(!el)return;
    el.innerHTML=`<div class="footer-top">
      <div><div class="footer-brand"><img src="images/logo-affateknik.png" alt=""><strong>AFFA TEKNIK</strong></div><p>Toko teknik dan alat pancing. Satu toko untuk kebutuhan bangunan, perlengkapan listrik, dan memancing.</p></div>
      <div><h4>Belanja</h4><ul><li><a href="katalog.html">Semua produk</a></li><li><a href="katalog.html#listrik">Perlengkapan listrik</a></li><li><a href="katalog.html#bangunan">Peralatan bangunan</a></li><li><a href="katalog.html#pancing">Alat pancing</a></li></ul></div>
      <div><h4>Halaman</h4><ul><li><a href="index.html">Beranda</a></li><li><a href="index.html#profil">Tentang Toko</a></li><li><a href="keranjang.html">Keranjang belanja</a></li><li><a href="pesanan.html">Riwayat pesanan</a></li></ul></div>
      <div><h4>Hubungi kami</h4><ul class="footer-contact"><li>${ICON.pin}<span>Jl. Poros Barru – Makassar, Desa Kupa, Dusun Buaka</span></li><li>${ICON.clock}<span>Senin–Sabtu, 08.00–17.00 WITA</span></li><li>${ICON.phone}<a href="${WA_URL}" target="_blank" rel="noopener">0852-5653-5824 (WhatsApp)</a></li></ul></div>
    </div>
    <div class="footer-bottom"><div><span>© ${new Date().getFullYear()} Affa Teknik. Seluruh hak cipta dilindungi.</span><span>Website prototype — pembayaran masih simulasi.</span></div></div>`;
  }
  function updateCartCount(){const el=$("#header-cart-count");if(el){const n=AffaCart.count();el.textContent=n;el.style.display=n?"":"none";}}
  function renderFeatured(){const el=$("#featured-products");if(el)el.innerHTML=PRODUK.slice(0,4).map(productCard).join("");}
  function renderCatalog(){
    const grid=$("#catalog-products");if(!grid)return;
    let active="Semua",query="";
    const update=()=>{
      const found=PRODUK.filter(p=>(active==="Semua"||p.category===active)&&(`${p.name} ${p.brand} ${p.sku} ${p.category}`).toLowerCase().includes(query.toLowerCase()));
      grid.innerHTML=found.map(productCard).join("");$("#product-count").textContent=found.length;$("#empty-products").classList.toggle("hidden",found.length!==0);
    };
    $$(".filter-chip").forEach(btn=>btn.addEventListener("click",()=>{$$(".filter-chip").forEach(b=>b.classList.remove("active"));btn.classList.add("active");active=btn.dataset.filter;update();}));
    $("#product-search")?.addEventListener("input",e=>{query=e.target.value.trim();update();});
    const qp=new URLSearchParams(location.search).get("q");if(qp){query=qp.trim();const si=$("#product-search");if(si)si.value=qp;}
    const applyHash=()=>{const m={"#listrik":"Listrik","#bangunan":"Bangunan","#pancing":"Pancing"}[location.hash];if(m){const b=$(`.filter-chip[data-filter="${m}"]`);if(b)b.click();}};
    window.addEventListener("hashchange",applyHash);
    const hash=location.hash;if(["#listrik","#bangunan","#pancing"].includes(hash)){const cat=hash.slice(1);const filter=cat==="listrik"?"Listrik":cat==="bangunan"?"Bangunan":"Pancing";const btn=$(`.filter-chip[data-filter="${filter}"]`);if(btn)btn.click();}
    update();
  }
  function renderProductDetail(){
    const root=$("#product-detail");if(!root)return;
    const id=new URLSearchParams(location.search).get("id")||PRODUK[0].id;
    const p=findProduct(id);
    if(!p){root.innerHTML=`<div class="empty-state"><strong>Produk tidak ditemukan.</strong><p>Silakan kembali ke katalog.</p><a class="btn btn-primary" href="katalog.html">Kembali ke katalog</a></div>`;return;}
    root.innerHTML=`<div class="detail-image">${productImage(p)}</div><div class="detail-info"><span class="eyebrow">${escapeHTML(p.category)} · ${escapeHTML(p.brand)}</span><h1>${escapeHTML(p.name)}</h1><div class="product-meta">SKU: ${escapeHTML(p.sku)}</div><div class="detail-price" id="detail-price">${formatRupiah(p.variants[0].price)}</div><div class="stock-line" id="detail-stock">✓ Stok tersedia: ${p.variants[0].stock} pcs</div><p class="detail-description">${escapeHTML(p.description)}</p>
      <label class="detail-label" for="variant-select">Pilih varian / ukuran</label><select class="variant-select" id="variant-select">${p.variants.map((v,i)=>`<option value="${i}">${escapeHTML(v.label)} — ${formatRupiah(v.price)} (stok ${v.stock})</option>`).join("")}</select>
      <div class="quantity-row"><span class="detail-label" style="margin:0">Jumlah</span><div class="quantity-control"><button type="button" id="qty-minus" aria-label="Kurangi jumlah">−</button><input type="number" id="detail-qty" value="1" min="1" max="${p.variants[0].stock}" readonly><button type="button" id="qty-plus" aria-label="Tambah jumlah">+</button></div></div>
      <div class="detail-actions"><button class="btn btn-primary" id="add-detail">Tambah ke Keranjang</button><button class="btn btn-outline" id="buy-now">Beli Sekarang</button></div><span class="return-link return-link-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>Kebijakan retur 7 hari</span><p class="small-note">Stok yang tampil merupakan data katalog prototype. Konfirmasikan ketersediaan dengan pemilik toko untuk transaksi sebenarnya.</p></div>`;
    let index=0,qty=1;
    const variant=()=>p.variants[index];
    const sync=()=>{$("#detail-price").textContent=formatRupiah(variant().price);$("#detail-stock").textContent=`✓ Stok tersedia: ${variant().stock} pcs`;$("#detail-qty").max=variant().stock;qty=Math.min(qty,variant().stock);$("#detail-qty").value=qty;};
    $("#variant-select").addEventListener("change",e=>{index=Number(e.target.value);qty=1;sync();});
    $("#qty-minus").addEventListener("click",()=>{qty=Math.max(1,qty-1);sync();});
    $("#qty-plus").addEventListener("click",()=>{qty=Math.min(variant().stock,qty+1);sync();});
    $("#add-detail").addEventListener("click",()=>AffaCart.add(p,variant(),qty));
    $("#buy-now").addEventListener("click",()=>{if(AffaCart.add(p,variant(),qty))location.href="keranjang.html";});
    const related=$("#related-products");if(related)related.innerHTML=PRODUK.filter(x=>x.id!==p.id).slice(0,4).map(productCard).join("");
  }
  document.addEventListener("click",e=>{
    const btn=e.target.closest("[data-add]");if(!btn)return;
    const p=findProduct(btn.dataset.add);if(p)AffaCart.add(p,p.variants[0],1);
  });
  document.addEventListener("DOMContentLoaded",()=>{
    renderHeader();renderFooter();renderFeatured();renderCatalog();renderProductDetail();updateCartCount();
    window.addEventListener("cartupdated",updateCartCount);
  });
})();