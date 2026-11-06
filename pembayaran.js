/* ==========================================================
   CHECKOUT AFFA TEKNIK
   Alur: 1) Pembayaran  ->  2) Pengiriman  ->  3) Konfirmasi
   ----------------------------------------------------------
   >>> UBAH NOMOR REKENING DI BAWAH INI <<<
   Ganti "number" dan "holder" dengan data rekening toko yang asli.
   Hapus satu baris bank jika tidak dipakai, atau tambah baris baru.
   QRIS: simpan gambar QRIS di folder images/ dengan nama qris.jpg (atau .png/.webp).
   Opsi QRIS hanya tampil otomatis jika gambarnya ada; jika tidak ada, hanya transfer bank.
   ========================================================== */
/* ===== METODE PEMBAYARAN (ubah nomor di sini) =====
   online:true -> pembeli wajib mengunggah bukti pembayaran
   holder      -> nama pemilik (kosongkan jika tidak ingin ditampilkan) */
const PAYMENTS=[
  {id:"cod",name:"Bayar di tempat (COD)",short:"COD",online:false,desc:"Khusus pembeli yang mengambil barang ke toko. Bayar tunai saat barang diambil."},
  {id:"bri",name:"Transfer Bank BRI",short:"BRI",online:true,kind:"Nomor rekening",number:"380601022012533",holder:"Sulviana Fahra",desc:"Transfer ke rekening BRI di bawah ini."},
  {id:"dana",name:"DANA",short:"DANA",online:true,kind:"Nomor DANA",number:"089513615868",holder:"",desc:"Kirim ke nomor DANA di bawah ini."},
  {id:"shopeepay",name:"ShopeePay",short:"SPay",online:true,kind:"Nomor ShopeePay",number:"089513615868",holder:"",desc:"Kirim ke nomor ShopeePay di bawah ini."},
  {id:"seabank",name:"SeaBank",short:"SEA",online:true,kind:"Nomor rekening",number:"901277407050",holder:"",desc:"Transfer ke rekening SeaBank di bawah ini."}
];
const WA_NUMBER="6285256535824";

document.addEventListener("DOMContentLoaded",()=>{
  const $=(s,r=document)=>r.querySelector(s);
  const root=$("#checkout-root");
  if(!root)return;
  const CHECKOUT_KEY="affaTeknikCheckoutDraft";
  let step=1;
  let draft={name:"",phone:"",address:"",district:"",postal:"",shipping:"courier",payment:"bri",notes:""};
  try{draft={...draft,...JSON.parse(sessionStorage.getItem(CHECKOUT_KEY)||"{}")}}catch(e){}
  if(!PAYMENTS.some(p=>p.id===draft.payment))draft.payment="bri";

  const shippingMethods={
    pickup:{label:"Ambil di toko",price:0,description:"Ambil langsung di Affa Teknik, Desa Kupa Dusun Buaka."},
    courier:{label:"Kurir toko (area dekat)",price:10000,description:"Perkiraan biaya Rp10.000."},
    expedition:{label:"Ekspedisi reguler (antar kota)",price:25000,description:"Perkiraan biaya Rp25.000."},
    special:{label:"Pengiriman khusus partai besar",price:50000,description:"Perkiraan biaya Rp50.000; biaya sebenarnya akan dikonfirmasi toko."}
  };

  const saveDraft=()=>sessionStorage.setItem(CHECKOUT_KEY,JSON.stringify(draft));
  const getItems=()=>AffaCart.get();
  const getShipping=()=>shippingMethods[draft.shipping]||shippingMethods.courier;
  const getPay=()=>PAYMENTS.find(p=>p.id===draft.payment)||PAYMENTS[1];
  const subtotal=()=>AffaCart.total();
  const total=()=>subtotal()+getShipping().price;
  const money=n=>formatRupiah(n);
  const paymentLabel=()=>getPay().name;
  const paymentDetail=()=>getPay().online?`${getPay().name} ${getPay().number}`:getPay().name;

  function itemList(){return `<div class="order-list">${getItems().map(i=>`<div class="order-list-item"><div class="order-thumb">${productImage(i)}</div><div><strong>${escapeHTML(i.name)}</strong><small>${escapeHTML(i.variant)} · ${i.qty} pcs</small></div><span class="line-price">${money(i.price*i.qty)}</span></div>`).join("")}</div>`}
  // tahap = "bayar" (ongkir belum dipilih) atau "lengkap"
  function summaryRows(tahap="lengkap"){
    if(tahap==="bayar")return `<div class="summary-row"><span>Subtotal produk</span><strong>${money(subtotal())}</strong></div><div class="summary-row"><span>Ongkos kirim</span><strong>Dipilih di langkah berikutnya</strong></div>`;
    return `<div class="summary-row"><span>Subtotal produk</span><strong>${money(subtotal())}</strong></div><div class="summary-row"><span>${escapeHTML(getShipping().label)}</span><strong>${getShipping().price?money(getShipping().price):"Gratis"}</strong></div><div class="summary-row summary-total"><span>Total pembayaran</span><strong>${money(total())}</strong></div>`;
  }
  function updateProgress(){
    document.querySelectorAll("#checkout-progress .step").forEach(el=>{const n=Number(el.dataset.step);el.classList.toggle("active",n===step);el.classList.toggle("done",n<step);el.querySelector("span").textContent=n<step?"✓":n;});
  }
  function payInfo(p){return p.online?`<div class="bank-list"><div class="bank-row"><span class="bank-name">${escapeHTML(p.short)}</span><span class="bank-info"><small>${escapeHTML(p.kind)}</small><b>${escapeHTML(p.number)}</b>${p.holder?`<small>a.n. ${escapeHTML(p.holder)}</small>`:""}</span><button type="button" class="copy-btn" data-copy="${p.number}">Salin</button></div></div>`:"";}
  let proof=null; // bukti pembayaran {dataUrl,name} disimpan di memori sampai pesanan dikonfirmasi
  function compress(file){return new Promise((ok,no)=>{const fr=new FileReader();fr.onerror=no;fr.onload=()=>{const im=new Image();im.onerror=no;im.onload=()=>{const k=Math.min(1,900/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);ok(c.toDataURL("image/jpeg",.72));};im.src=fr.result;};fr.readAsDataURL(file);});}
  function render(){
    updateProgress();
    if(!getItems().length){root.innerHTML=`<div class="empty-cart"><div class="empty-cart-icon">🛒</div><h2>Keranjangmu masih kosong</h2><p>Tambahkan produk sebelum melanjutkan checkout.</p><a class="btn btn-primary" href="katalog.html">Kembali ke Katalog</a></div>`;return;}
    if(step===1)renderPayment();
    else if(step===2)renderShipping();
    else renderConfirmation();
  }

  /* ---------- Langkah 1: Pembayaran ---------- */
  function renderPayment(){
    root.innerHTML=`<div class="checkout-layout"><section class="form-panel"><h2 class="panel-title">Pilih metode pembayaran</h2><p class="section-subtitle" style="margin:0 0 20px">Pembayaran online wajib disertai bukti pembayaran, diunggah pada langkah konfirmasi.</p>
    <form id="payment-form"><div class="radio-list">${PAYMENTS.map(p=>`<label class="radio-option"><input type="radio" name="payment" value="${p.id}" ${draft.payment===p.id?"checked":""}><span><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.desc)}</small></span>${p.online?'<em class="pay-tag">Perlu bukti</em>':'<em class="pay-tag tag-store">Bayar di toko</em>'}</label><div class="pay-panel ${draft.payment===p.id?"":"hidden"}" data-panel="${p.id}">${p.online?payInfo(p)+'<p class="small-note">Transfer sesuai total pesanan, lalu unggah bukti pembayaran pada langkah terakhir.</p>':'<p class="small-note" style="margin:0">Pengiriman otomatis menjadi <b>Ambil di toko</b>. Bayar tunai di Affa Teknik saat mengambil barang.</p>'}</div>`).join("")}</div>
    <div class="form-actions"><a class="btn btn-outline" href="keranjang.html">← Kembali ke Keranjang</a><button class="btn btn-primary" type="submit">Lanjut ke Pengiriman →</button></div></form></section>
    <aside class="summary-card"><h2 class="panel-title">Ringkasan belanja</h2>${itemList()}<div style="margin-top:18px">${summaryRows("bayar")}</div></aside></div>`;
    const form=$("#payment-form");
    form.addEventListener("change",e=>{if(e.target.name==="payment"){draft.payment=e.target.value;if(draft.payment==="cod")draft.shipping="pickup";root.querySelectorAll(".pay-panel").forEach(p=>p.classList.toggle("hidden",p.dataset.panel!==draft.payment));saveDraft();}});
    form.addEventListener("click",e=>{const c=e.target.closest(".copy-btn");if(!c)return;e.preventDefault();const v=c.dataset.copy;(navigator.clipboard?navigator.clipboard.writeText(v):Promise.reject()).then(()=>showToast("Nomor disalin."),()=>showToast("Nomor: "+v));});
    form.addEventListener("submit",e=>{e.preventDefault();if(draft.payment==="cod")draft.shipping="pickup";saveDraft();step=2;render();window.scrollTo({top:0,behavior:"smooth"});});
  }

  /* ---------- Langkah 2: Pengiriman ---------- */
  function renderShipping(){
    root.innerHTML=`<div class="checkout-layout"><section class="form-panel"><h2 class="panel-title">Informasi pengiriman</h2><form id="shipping-form" novalidate><div class="demo-bar"><span><b>Mode demo</b> — isi data contoh untuk mencoba alur checkout dengan cepat.</span><button type="button" class="btn btn-light" id="demo-fill">Isi data contoh</button></div><div class="form-grid">
      <div class="form-field"><label for="customer-name">Nama lengkap *</label><input class="form-control" id="customer-name" name="name" required autocomplete="name" value="${escapeHTML(draft.name)}" placeholder="Nama penerima"></div>
      <div class="form-field"><label for="customer-phone">Nomor WhatsApp *</label><input class="form-control" id="customer-phone" name="phone" required inputmode="tel" autocomplete="tel" value="${escapeHTML(draft.phone)}" placeholder="08xxxxxxxxxx"></div>
      <div class="form-field full"><label for="customer-address">Alamat lengkap *</label><textarea class="form-control" id="customer-address" name="address" rows="3" required autocomplete="street-address" placeholder="Nama jalan, nomor rumah, patokan">${escapeHTML(draft.address)}</textarea></div>
      <div class="form-field"><label for="customer-district">Kecamatan / Kota *</label><input class="form-control" id="customer-district" name="district" required value="${escapeHTML(draft.district)}" placeholder="Kecamatan dan kota"></div>
      <div class="form-field"><label for="customer-postal">Kode pos <span class="hint">(opsional)</span></label><input class="form-control" id="customer-postal" name="postal" value="${escapeHTML(draft.postal)}" inputmode="numeric" placeholder="Kode pos"></div>
      <div class="form-field full"><label for="shipping-method">Metode pengiriman *</label><select class="form-control" id="shipping-method" name="shipping" ${draft.payment==="cod"?"disabled":""}>${Object.entries(shippingMethods).map(([key,m])=>`<option value="${key}" ${draft.shipping===key?"selected":""}>${m.label} — ${m.price?money(m.price):"Gratis"}</option>`).join("")}</select><span class="hint">${draft.payment==="cod"?"Metode COD hanya untuk ambil barang di toko.":"Biaya adalah estimasi dan dapat berubah sesuai jarak/ekspedisi."}</span></div>
      <div class="form-field full"><label for="order-notes">Catatan pesanan <span class="hint">(opsional)</span></label><textarea class="form-control" id="order-notes" name="notes" rows="2" placeholder="Catatan untuk penjual">${escapeHTML(draft.notes)}</textarea></div>
      </div><div class="form-actions"><button class="btn btn-outline" type="button" id="back-payment">← Ubah Pembayaran</button><button class="btn btn-primary" type="submit">Lanjut ke Konfirmasi →</button></div></form></section>
      <aside class="summary-card"><h2 class="panel-title">Ringkasan belanja</h2>${itemList()}<div style="margin-top:18px" id="ship-summary">${summaryRows()}</div><p class="small-note">Pembayaran: <strong style="color:#fff">${escapeHTML(paymentLabel())}</strong>. Pastikan alamat dan nomor kontak aktif agar toko dapat menghubungi penerima.</p></aside></div>`;
    const form=$("#shipping-form");
    $("#demo-fill").addEventListener("click",()=>{$("#customer-name").value="Pembeli Demo";$("#customer-phone").value="081234567890";$("#customer-address").value="Jl. Contoh No. 1, dekat pasar";$("#customer-district").value="Barru";showToast("Data demo terisi.");});
    form.shipping.addEventListener("change",e=>{draft.shipping=e.target.value;$("#ship-summary").innerHTML=summaryRows();});
    $("#back-payment").addEventListener("click",()=>{readShipping(form);saveDraft();step=1;render();window.scrollTo({top:0,behavior:"smooth"});});
    form.addEventListener("submit",e=>{
      e.preventDefault();readShipping(form);
      if(!draft.name||!draft.phone||(draft.shipping!=="pickup"&&(!draft.address||!draft.district))){showToast("Lengkapi nama, nomor WhatsApp, alamat, dan kecamatan/kota.");return;}
      if(draft.phone.replace(/\D/g,"").length<9){showToast("Periksa kembali nomor WhatsApp.");return;}
      saveDraft();step=3;render();window.scrollTo({top:0,behavior:"smooth"});
    });
  }
  function readShipping(f){draft.name=f.name.value.trim();draft.phone=f.phone.value.trim();draft.address=f.address.value.trim();draft.district=f.district.value.trim();draft.postal=f.postal.value.trim();draft.shipping=draft.payment==="cod"?"pickup":f.shipping.value;draft.notes=f.notes.value.trim();}

  /* ---------- Langkah 3: Konfirmasi ---------- */
  function waMessage(orderNumber){
    const lines=getItems().map(i=>`- ${i.name} (${i.variant}) x${i.qty}`).join("\n");
    return `Halo Affa Teknik, saya ingin konfirmasi pesanan ${orderNumber}.\n\n${lines}\n\nTotal: ${money(total())}\nPembayaran: ${paymentLabel()}\nPengiriman: ${getShipping().label}\nNama: ${draft.name}\nAlamat: ${draft.address}, ${draft.district}\n\n${getPay().online?"(Bukti pembayaran sudah saya unggah di website.)":"(Pembayaran tunai di toko saat pengambilan barang.)"}`;
  }
  function renderConfirmation(){
    const pay=getPay();
    const orderNumber="AT-"+new Date().toISOString().slice(2,10).replace(/-/g,"")+"-"+Math.random().toString(36).slice(2,6).toUpperCase();
    const order={orderNumber,createdAt:new Date().toLocaleString("id-ID"),customer:{...draft},items:getItems(),subtotal:subtotal(),shipping:getShipping(),total:total(),payment:{label:paymentLabel(),detail:paymentDetail()}};
    sessionStorage.setItem("affaTeknikPendingOrder",JSON.stringify(order));
    const alamat=draft.shipping==="pickup"?"Ambil di toko":`${escapeHTML(draft.address)}, ${escapeHTML(draft.district)}`;
    root.innerHTML=`<div class="confirmation-card"><div class="success-icon">✓</div><span class="eyebrow">Langkah terakhir</span><h2>Konfirmasi pesanan</h2><p>Periksa pesanan${pay.online?", lakukan pembayaran, lalu unggah bukti pembayaran":""}.</p><div class="order-number">${orderNumber}</div>
    <div class="confirmation-details"><div class="summary-row"><span>Metode pembayaran</span><strong>${escapeHTML(paymentLabel())}</strong></div><div class="summary-row"><span>Nama penerima</span><strong>${escapeHTML(draft.name)}</strong></div><div class="summary-row"><span>Nomor kontak</span><strong>${escapeHTML(draft.phone)}</strong></div><div class="summary-row"><span>Alamat</span><strong>${alamat}</strong></div><div class="summary-row"><span>Pengiriman</span><strong>${escapeHTML(getShipping().label)}</strong></div>${summaryRows()}</div>
    ${pay.online?`<div class="proof-box"><h3 class="detail-label">Bayar ${money(total())} ke:</h3>${payInfo(pay)}<label class="proof-drop" for="proof-file"><input type="file" id="proof-file" accept="image/*"><span><b>Unggah bukti pembayaran *</b><small>Foto atau screenshot (JPG/PNG), wajib untuk pembayaran online.</small></span></label><button type="button" class="btn btn-light" id="demo-proof" style="margin-top:12px">Gunakan bukti contoh (demo)</button><div id="proof-preview" class="proof-preview hidden"></div></div>`:`<div class="proof-box"><p class="small-note" style="margin:0">Bayar tunai ${money(total())} di toko saat mengambil barang. Tidak perlu bukti pembayaran online.</p></div>`}
    <div class="form-actions"><button class="btn btn-outline" id="back-shipping">← Ubah Pengiriman</button><button class="btn btn-primary" id="confirm-order" ${pay.online?"disabled":""}>Konfirmasi Pesanan ✓</button></div></div>`;
    proof=null;
    $("#back-shipping").addEventListener("click",()=>{step=2;render();});
    const cb=$(".copy-btn");if(cb)cb.addEventListener("click",e=>{const v=e.currentTarget.dataset.copy;(navigator.clipboard?navigator.clipboard.writeText(v):Promise.reject()).then(()=>showToast("Nomor disalin."),()=>showToast("Nomor: "+v));});
    const showProof=()=>{const pv=$("#proof-preview");pv.classList.remove("hidden");pv.innerHTML=`<img src="${proof.dataUrl}" alt="Bukti pembayaran"><span>${escapeHTML(proof.name)}</span>`;$("#confirm-order").disabled=false;};
    const dp=$("#demo-proof");
    if(dp)dp.addEventListener("click",()=>{const c=document.createElement("canvas");c.width=480;c.height=640;const g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,480,640);g.fillStyle="#0d2145";g.fillRect(0,0,480,90);g.fillStyle="#fff";g.font="bold 26px Arial";g.fillText("BUKTI PEMBAYARAN",24,56);g.fillStyle="#17803f";g.font="bold 34px Arial";g.fillText("BERHASIL",24,160);g.fillStyle="#14213d";g.font="20px Arial";["Metode : "+paymentLabel(),"Tujuan : "+getPay().number,"Total  : "+money(total()),"Tanggal: "+new Date().toLocaleString("id-ID"),"","*** CONTOH UNTUK DEMO ***"].forEach((t,i)=>g.fillText(t,24,220+i*40));proof={dataUrl:c.toDataURL("image/jpeg",.8),name:"bukti-demo.jpg"};showProof();showToast("Bukti contoh dipakai.");});
    const fi=$("#proof-file");
    if(fi)fi.addEventListener("change",async()=>{
      const f=fi.files[0];if(!f)return;
      if(!/^image\//.test(f.type)||f.size>8*1024*1024){showToast("Unggah gambar (JPG/PNG) maksimal 8 MB.");fi.value="";return;}
      try{proof={dataUrl:await compress(f),name:f.name};}catch(err){showToast("Gambar tidak dapat dibaca. Coba file lain.");return;}
      showProof();
    });
    $("#confirm-order").addEventListener("click",()=>{
      if(pay.online&&!proof){showToast("Unggah bukti pembayaran terlebih dahulu.");return;}
      const status=pay.online?"Menunggu verifikasi pembayaran":"Menunggu pengambilan & pembayaran di toko";
      const finalOrder={...order,status,proofName:proof?proof.name:"",confirmedAt:new Date().toLocaleString("id-ID")};
      let orders=[];try{orders=JSON.parse(localStorage.getItem("affaTeknikOrders")||"[]")}catch(e){}
      if(proof)finalOrder.proof=proof.dataUrl;
      orders.push(finalOrder);
      try{localStorage.setItem("affaTeknikOrders",JSON.stringify(orders));}catch(e){delete finalOrder.proof;try{localStorage.setItem("affaTeknikOrders",JSON.stringify(orders));}catch(e2){}}
      const wa=`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMessage(orderNumber))}`;
      root.innerHTML=`<div class="confirmation-card"><div class="success-icon">✓</div><h2>Terima kasih, ${escapeHTML(draft.name)}!</h2><p>${pay.online?"Pesanan dan bukti pembayaran kamu sudah kami terima. Toko akan memverifikasi pembayaran.":"Pesanan kamu sudah dicatat. Silakan ambil barang dan bayar tunai di toko."}</p><div class="order-number">${orderNumber}</div>${proof?`<div class="proof-preview" style="justify-content:center"><img src="${proof.dataUrl}" alt="Bukti pembayaran"><span>Bukti pembayaran terunggah</span></div>`:""}<div class="confirmation-details"><div class="summary-row"><span>Status pesanan</span><strong>${status}</strong></div><div class="summary-row"><span>Metode pembayaran</span><strong>${escapeHTML(paymentLabel())}</strong></div><div class="summary-row"><span>Total pesanan</span><strong>${money(order.total)}</strong></div></div><a class="btn btn-wa" style="width:100%" href="${wa}" target="_blank" rel="noopener">Konfirmasi ke WhatsApp toko</a><div class="form-actions"><a class="btn btn-outline" href="index.html">Kembali ke Beranda</a><a class="btn btn-primary" href="katalog.html">Belanja Lagi</a></div></div>`;
      AffaCart.clear();sessionStorage.removeItem(CHECKOUT_KEY);sessionStorage.removeItem("affaTeknikPendingOrder");
      document.querySelectorAll("#checkout-progress .step").forEach(el=>{el.classList.add("done");el.classList.remove("active");el.querySelector("span").textContent="✓";});
      window.scrollTo({top:0,behavior:"smooth"});
    });
  }
  render();
});
