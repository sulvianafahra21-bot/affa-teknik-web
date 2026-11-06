/* Riwayat pesanan: membaca pesanan yang disimpan checkout di LocalStorage */
document.addEventListener("DOMContentLoaded",()=>{
  const root=document.querySelector("#orders-root");if(!root)return;
  const load=()=>{try{return JSON.parse(localStorage.getItem("affaTeknikOrders")||"[]")}catch(e){return[]}};
  function draw(){
    const list=load().slice().reverse();
    if(!list.length){root.innerHTML=`<div class="empty-cart"><div class="empty-cart-icon">📦</div><h2>Belum ada pesanan</h2><p>Pesanan yang sudah dikonfirmasi akan muncul di sini.</p><a class="btn btn-primary" href="katalog.html">Mulai Belanja</a></div>`;return;}
    root.innerHTML=list.map(x=>`<article class="order-card"><div class="order-card-head"><div><span class="eyebrow">${escapeHTML(x.confirmedAt||x.createdAt||"")}</span><div class="order-number">${escapeHTML(x.orderNumber)}</div></div><span class="status-pill">${escapeHTML(x.status||"")}</span></div>
      <div class="order-list">${x.items.map(i=>`<div class="order-list-item"><div class="order-thumb">${productImage(i)}</div><div><strong>${escapeHTML(i.name)}</strong><small>${escapeHTML(i.variant)} · ${i.qty} pcs</small></div><span class="line-price">${formatRupiah(i.price*i.qty)}</span></div>`).join("")}</div>
      <div class="summary-row"><span>Pembayaran</span><strong>${escapeHTML(x.payment.label)}</strong></div><div class="summary-row"><span>Pengiriman</span><strong>${escapeHTML(x.shipping.label)}</strong></div><div class="summary-row summary-total"><span>Total</span><strong>${formatRupiah(x.total)}</strong></div>
      ${x.proof?`<div class="proof-preview"><img src="${x.proof}" alt="Bukti pembayaran"><span>Bukti pembayaran terunggah</span></div>`:""}</article>`).join("")+`<div class="form-actions"><button class="btn btn-outline" id="clear-orders">Hapus riwayat</button></div>`;
    document.querySelector("#clear-orders").addEventListener("click",()=>{if(confirm("Hapus semua riwayat pesanan di browser ini?")){localStorage.removeItem("affaTeknikOrders");draw();}});
  }
  draw();
});
