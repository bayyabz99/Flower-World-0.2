function formatPrice(n) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCart() {
  const items = Cart.get();
  const container = document.getElementById('cartItems');
  const summary = document.getElementById('cartSummary');
  const layout = document.querySelector('.cart-layout');

  if (!items.length) {
    container.innerHTML =
      '<div class="empty-state"><p>Sepetiniz boş.</p><a href="/urunler" class="btn btn-primary">Çiçeklere Göz At</a></div>';
    summary.style.display = 'none';
    if (layout) layout.classList.add('cart-layout--empty');
    return;
  }

  if (layout) layout.classList.remove('cart-layout--empty');

  container.innerHTML = items
    .map(
      (item, index) => `
    <article class="cart-item" data-cart-index="${index}">
      <div class="cart-item-info">
        <a href="/urun/${escapeHtml(item.slug)}">${escapeHtml(item.title)}</a>
        ${
          item.selected_color
            ? `<p class="cart-item-meta">Renk: <strong>${escapeHtml(item.selected_color)}</strong></p>`
            : ''
        }
        <p class="cart-item-meta">Birim: ${formatPrice(item.price)}</p>
      </div>
      <p class="cart-item-line-total">${formatPrice(item.price * item.quantity)}</p>
      <div class="cart-item-actions">
        <div class="cart-qty-control" aria-label="Adet">
          <button type="button" class="btn-qty btn-qty-minus" data-cart-index="${index}" aria-label="Azalt">−</button>
          <span class="cart-qty-value">${item.quantity}</span>
          <button type="button" class="btn-qty btn-qty-plus" data-cart-index="${index}" aria-label="Artır">+</button>
        </div>
        <button type="button" class="btn-danger btn-remove" data-cart-index="${index}">Kaldır</button>
      </div>
    </article>`
    )
    .join('');

  document.getElementById('cartTotal').textContent = formatPrice(Cart.total());
  summary.style.display = 'block';

  container.querySelectorAll('.btn-remove').forEach((btn) => {
    btn.onclick = () => {
      const index = parseInt(btn.dataset.cartIndex, 10);
      Cart.removeAt(index);
      renderCart();
    };
  });

  container.querySelectorAll('.btn-qty-minus').forEach((btn) => {
    btn.onclick = () => {
      const index = parseInt(btn.dataset.cartIndex, 10);
      const cartItems = Cart.get();
      const item = cartItems[index];
      if (!item) return;
      if (item.quantity > 1) {
        Cart.updateQtyAt(index, item.quantity - 1);
      } else {
        Cart.removeAt(index);
      }
      renderCart();
    };
  });

  container.querySelectorAll('.btn-qty-plus').forEach((btn) => {
    btn.onclick = () => {
      const index = parseInt(btn.dataset.cartIndex, 10);
      const item = Cart.get()[index];
      if (!item) return;
      Cart.updateQtyAt(index, item.quantity + 1);
      renderCart();
    };
  });
}

document.addEventListener('DOMContentLoaded', () => {
  Cart.save(Cart.get());
  renderCart();

  document.getElementById('btnClearCart')?.addEventListener('click', () => {
    if (!Cart.get().length) return;
    if (confirm('Sepetteki tüm ürünler kaldırılacak. Emin misiniz?')) {
      Cart.clear();
      renderCart();
    }
  });

  const btnCheckout = document.getElementById('btnWhatsappCheckout');
  if (btnCheckout) {
    btnCheckout.onclick = () => {
      const items = Cart.get();
      if (!items.length) return;

      let msg = 'Merhaba, çiçek siparişi vermek istiyorum:\n\n';
      msg += '💐 *SİPARİŞ VERİLEN BUKETLER:*\n';
      msg += '───────────────────────\n';

      items.forEach((item, idx) => {
        const colorText = item.selected_color ? ` [Renk: ${item.selected_color}]` : '';
        msg += `*${idx + 1}.* ${item.title}${colorText}\n`;
        msg += `   Adet: ${item.quantity} × ${formatPrice(item.price)}\n`;
        msg += `   Tutar: *${formatPrice(item.price * item.quantity)}*\n\n`;
      });

      msg += '───────────────────────\n';
      msg += `💵 *GENEL TOPLAM: ${formatPrice(Cart.total())}*\n\n`;
      msg += 'Teslimat adresi ve saat bilgisini paylaşacağım. Yardımcı olabilir misiniz?';

      let phone = btnCheckout.dataset.phone || '';
      phone = phone.replace(/\D/g, '');

      if (!phone) {
        alert('Satıcının WhatsApp iletişim numarası sistemde tanımlanmamış!');
        return;
      }

      const encodedText = encodeURIComponent(msg);
      window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
    };
  }
});
