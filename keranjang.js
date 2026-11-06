document.addEventListener("DOMContentLoaded",()=>{
  const root=document.querySelector("#cart-content");
  if(!root)return;
  function render(){
    const items=AffaCart.get();
    if(!items.length){
      root.innerHTML=`<div class="empty-cart"><div class="empty-cart-icon">🛒</div><h2>Keranjangmu masih kosong</h2><p>Yuk, temukan produk yang kamu butuhkan di katalog Affa Teknik.</p><a class="btn btn-primary" href="katalog.html">Jelajahi Katalog →</a></div>`;return;
    }
    const total=AffaCart.total();
    root.innerHTML=`<div class="cart-layout"><div class="cart-panel"><h2 class="panel-title">Produk pilihan (${items.reduce((n,i)=>n+i.qty,0)} item)</h2>${items.map(i=>`<div class="cart-item"><div class="cart-item-image">${productImage(i)}</div><div><h3>${escapeHTML(i.name)}</h3><p>${escapeHTML(i.variant)} · SKU ${escapeHTML(i.sku)}</p><div class="cart-item-actions"><div class="quantity-control"><button type="button" data-change="-1" data-id="${escapeHTML(i.itemId)}" aria-label="Kurangi">−</button><input value="${i.qty}" readonly aria-label="Jumlah"><button type="button" data-change="1" data-id="${escapeHTML(i.itemId)}" aria-label="Tambah">+</button></div><button class="remove-link" data-remove="${escapeHTML(i.itemId)}" type="button">Hapus</button></div></div><div class="cart-item-price">${formatRupiah(i.price*i.qty)}<div style="font-size:10px;color:#8190a3;font-weight:400;margin-top:4px">${formatRupiah(i.price)}/pcs</div></div></div>`).join("")}<a class="text-link" style="display:inline-block;margin-top:20px" href="katalog.html">← Lanjut belanja</a></div>
    <aside class="summary-card"><h2 class="panel-title">Ringkasan belanja</h2><div class="summary-row"><span>Subtotal produk</span><strong>${formatRupiah(total)}</strong></div><div class="summary-row"><span>Pengiriman</span><strong>Dihitung berikutnya</strong></div><div class="summary-row summary-total"><span>Total sementara</span><strong>${formatRupiah(total)}</strong></div><p class="small-note">Biaya pengiriman dihitung setelah kamu memilih metode pengiriman pada tahap checkout.</p><a class="btn btn-primary" href="pembayaran.html">Lanjut ke Pengiriman →</a></aside></div>`;
  }
  root.addEventListener("click",e=>{
    const change=e.target.closest("[data-change]");if(change){AffaCart.change(change.dataset.id,Number(change.dataset.change));return;}
    const remove=e.target.closest("[data-remove]");if(remove){AffaCart.remove(remove.dataset.remove);}
  });
  window.addEventListener("cartupdated",render);
  render();
});