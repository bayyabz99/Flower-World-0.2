const Cart = {
  key: 'flower_cart',

  normalizeColor(color) {
    if (color == null || color === '') return null;
    const s = String(color).trim();
    return s || null;
  },

  normalizeProductId(id) {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  },

  normalizeItem(raw) {
    if (!raw || raw.product_id == null) return null;
    const productId = this.normalizeProductId(raw.product_id);
    if (productId == null) return null;
    return {
      product_id: productId,
      title: String(raw.title || ''),
      price: Number(raw.price) || 0,
      slug: String(raw.slug || ''),
      quantity: Math.max(1, parseInt(raw.quantity, 10) || 1),
      selected_color: this.normalizeColor(raw.selected_color),
    };
  },

  matchesItem(item, productId, selectedColor) {
    return (
      item.product_id === this.normalizeProductId(productId) &&
      item.selected_color === this.normalizeColor(selectedColor)
    );
  },

  get() {
    try {
      const raw = JSON.parse(localStorage.getItem(this.key) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.map((i) => this.normalizeItem(i)).filter(Boolean);
    } catch {
      return [];
    }
  },

  save(items) {
    const normalized = items.map((i) => this.normalizeItem(i)).filter(Boolean);
    localStorage.setItem(this.key, JSON.stringify(normalized));
    this.updateBadge();
  },

  add(item) {
    const items = this.get();
    const normalized = this.normalizeItem({
      ...item,
      quantity: item.quantity || 1,
    });
    if (!normalized) return;

    const existing = items.find((i) => this.matchesItem(i, normalized.product_id, normalized.selected_color));
    if (existing) {
      existing.quantity += normalized.quantity;
    } else {
      items.push(normalized);
    }
    this.save(items);
  },

  remove(productId, selectedColor = null) {
    this.save(
      this.get().filter((i) => !this.matchesItem(i, productId, selectedColor))
    );
  },

  removeAt(index) {
    const items = this.get();
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    this.save(items);
  },

  updateQty(productId, selectedColor, quantity) {
    const items = this.get();
    const item = items.find((i) => this.matchesItem(i, productId, selectedColor));
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.save(items);
    }
  },

  updateQtyAt(index, quantity) {
    const items = this.get();
    if (index < 0 || index >= items.length) return;
    items[index].quantity = Math.max(1, quantity);
    this.save(items);
  },

  total() {
    return this.get().reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  count() {
    return this.get().reduce((sum, i) => sum + i.quantity, 0);
  },

  updateBadge() {
    const el = document.getElementById('cartCount');
    if (el) el.textContent = this.count();
  },

  clear() {
    localStorage.removeItem(this.key);
    this.updateBadge();
  },
};

document.addEventListener('DOMContentLoaded', () => {
  Cart.save(Cart.get());
  Cart.updateBadge();
  document.querySelectorAll('[data-add-cart]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.disabled) return;
      Cart.add({
        product_id: +btn.dataset.addCart,
        title: btn.dataset.title,
        price: +btn.dataset.price,
        slug: btn.dataset.slug,
        quantity: 1,
        selected_color: null,
      });
      const orig = btn.textContent;
      btn.textContent = '✓ Eklendi';
      setTimeout(() => {
        btn.textContent = orig;
      }, 1200);
    });
  });
});
