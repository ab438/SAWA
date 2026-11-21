/* ==========================================================================
   Vesta — main.js
   Vanilla JS. One function per feature, guard clauses, reduced-motion aware.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FREE_SHIP = 150;

  /* ---------- Helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function money(n) { return (Math.round(n * 100) / 100).toLocaleString("en-US") + " LE"; }
  function lockScroll(on) { document.body.classList.toggle("body-lock", !!on); }

  /* ---------- Toast ---------- */
  var toastTimer;
  function showToast(msg) {
    var t = $("#toast"), m = $("#toastMsg");
    if (!t || !m) return;
    m.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  /* ---------- Sticky header state ---------- */
  function initStickyHeader() {
    var header = $("#siteHeader");
    if (!header) return;
    function onScroll() { header.classList.toggle("is-stuck", window.scrollY > 12); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile nav ---------- */
  function initMobileNav() {
    var toggle = $("#navToggle"), nav = $("#mobileNav"), close = $("#navClose"), scrim = $("#scrim");
    if (!toggle || !nav) return;
    function open() {
      nav.classList.add("open");
      if (scrim) scrim.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      lockScroll(true);
      var first = nav.querySelector("a");
      if (first) first.focus();
    }
    function shut() {
      nav.classList.remove("open");
      if (scrim) scrim.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      lockScroll(false);
    }
    toggle.addEventListener("click", open);
    if (close) close.addEventListener("click", shut);
    if (scrim) scrim.addEventListener("click", shut);
    $all("a", nav).forEach(function (a) { a.addEventListener("click", shut); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) shut(); });
  }

  /* ---------- Search panel ---------- */
  function initSearch() {
    var toggle = $("#searchToggle"), panel = $("#searchPanel"), close = $("#searchClose"), input = $("#searchInput");
    if (!toggle || !panel) return;
    function open() {
      panel.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      if (input) setTimeout(function () { input.focus(); }, 60);
    }
    function shut() {
      panel.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function () {
      panel.classList.contains("open") ? shut() : open();
    });
    if (close) close.addEventListener("click", shut);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("open")) shut(); });
    document.addEventListener("click", function (e) {
      if (panel.classList.contains("open") && !panel.contains(e.target) && !toggle.contains(e.target)) shut();
    });
  }

  /* ---------- Product filtering ---------- */
  function initFilter() {
    var buttons = $all(".filter-btn");
    var cards = $all("#productGrid .product-card");
    var noRes = $("#noResults");
    if (!buttons.length || !cards.length) return;
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        buttons.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        var shown = 0;
        cards.forEach(function (card) {
          var match = f === "all" || card.getAttribute("data-cat") === f;
          card.classList.toggle("hide", !match);
          if (match) shown++;
        });
        if (noRes) noRes.style.display = shown === 0 ? "block" : "none";
      });
    });
  }

  /* ---------- Wishlist toggles ---------- */
  
function initWishlist() {
  var STORAGE_KEY = "sawaWishlist";

  function getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveWishlist(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function getProductData(btn) {
    var card = btn.closest(".product-card");

    if (card) {
      var addBtn = card.querySelector(".js-add");
      var link = card.querySelector(".pc-name a");
      var img = card.querySelector(".pc-media img");

      return {
        id: addBtn ? addBtn.dataset.id : (link ? link.href : ""),
        name: addBtn ? addBtn.dataset.name : (link ? link.textContent.trim() : ""),
        price: addBtn ? Number(addBtn.dataset.price) : 0,
        img: addBtn ? addBtn.dataset.img : (img ? img.getAttribute("src") : ""),
        url: link ? link.getAttribute("href") : ""
      };
    }

    var mainBtn = $("#pdpAdd");
    if (!mainBtn) return null;

    return {
      id: mainBtn.dataset.id,
      name: mainBtn.dataset.name,
      price: Number(mainBtn.dataset.price),
      img: mainBtn.dataset.img,
      url: window.location.pathname
    };
  }

  function updateButtons() {
    var items = getWishlist();
    var count = $("#wishlistCount");
if (count) count.textContent = items.length;

var note = $("#wishlistQtyNote");
if (note) {
  note.textContent = items.length +
    (items.length === 1 ? " item" : " items");
}
    $all(".pc-wish").forEach(function (btn) {
      var product = getProductData(btn);
      var active = product && items.some(function (item) {
        return item.id === product.id;
      });

      btn.classList.toggle("active", !!active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    var big = $("#pdpWish");
    if (big) {
      var mainProduct = getProductData(big);
      var active = mainProduct && items.some(function (item) {
        return item.id === mainProduct.id;
      });

      big.classList.toggle("active", !!active);
      big.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function toggleWishlist(btn) {
    var product = getProductData(btn);
    if (!product || !product.id) return;

    var items = getWishlist();
    var index = items.findIndex(function (item) {
      return item.id === product.id;
    });

    if (index === -1) {
      items.push(product);
      showToast("Saved to wishlist");
    } else {
      items.splice(index, 1);
      showToast("Removed from wishlist");
    }

    saveWishlist(items);
    updateButtons();
  }

  $all(".pc-wish, #pdpWish").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      toggleWishlist(btn);
    });
  });

  updateButtons();
}


  /* ==========================================================================
     Cart
     ========================================================================== */
  var CART_STORAGE_KEY = "sawa_cart_v1";
  var cart = [];

  function loadCart() {
    try {
      var saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) cart = saved.filter(function (item) {
        return item && item.id && item.name && Number(item.price) >= 0 && Number(item.qty) > 0;
      }).map(function (item) {
        return { id: String(item.id), name: String(item.name), price: Number(item.price), img: String(item.img || ""), variant: String(item.variant || ""), qty: Math.max(1, parseInt(item.qty, 10) || 1) };
      });
    } catch (e) { cart = []; }
  }

  function saveCart() {
    try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch (e) {}
  }

  function cartKey(item) { return item.id + "|" + (item.variant || ""); }

  function addToCart(item) {
    var key = cartKey(item);
    var existing = cart.filter(function (c) { return cartKey(c) === key; })[0];
    if (existing) { existing.qty += item.qty; }
    else { cart.push(item); }
    renderCart(true);
  }

  function removeFromCart(key) {
    cart = cart.filter(function (c) { return cartKey(c) !== key; });
    renderCart();
  }

  function changeQty(key, delta) {
    cart.forEach(function (c) {
      if (cartKey(c) === key) { c.qty = Math.max(1, c.qty + delta); }
    });
    renderCart();
  }

  function cartTotals() {
    var qty = 0, sub = 0;
    cart.forEach(function (c) { qty += c.qty; sub += c.qty * c.price; });
    return { qty: qty, sub: sub };
  }

  function renderCart(bump) {
    saveCart();
    var wrap = $("#cartItems"), empty = $("#cartEmpty"), foot = $("#cartFoot");
    var countEl = $("#cartCount"), noteEl = $("#cartQtyNote"), subEl = $("#cartSubtotal");
    var freeMsg = $("#cartFreeMsg"), progress = $("#cartProgress");
    if (!wrap) return;
    var t = cartTotals();

    // count pill
    if (countEl) {
      countEl.textContent = t.qty;
      countEl.style.display = t.qty > 0 ? "flex" : "none";
      if (bump) { countEl.classList.remove("pop"); void countEl.offsetWidth; countEl.classList.add("pop"); }
    }
    if (noteEl) noteEl.textContent = t.qty + (t.qty === 1 ? " item" : " items");

    // lines
    $all(".cart-line", wrap).forEach(function (n) { n.remove(); });
    if (cart.length === 0) {
      if (empty) empty.style.display = "";
      if (foot) foot.hidden = true;
    } else {
      if (empty) empty.style.display = "none";
      if (foot) foot.hidden = false;
      cart.forEach(function (c) {
        var key = cartKey(c);
        var line = document.createElement("div");
        line.className = "cart-line";
        line.innerHTML =
          '<img src="' + c.img + '" alt="' + c.name + '" width="74" height="94" loading="lazy">' +
          '<div><div class="cl-name">' + c.name + '</div>' +
          '<div class="cl-meta">' + (c.variant || "") + '</div>' +
          '<div class="cl-price">' + money(c.price) + '</div>' +
          '<button class="cl-remove" type="button" data-key="' + key + '">Remove</button></div>' +
          '<div class="cl-right"><div class="qty-stepper">' +
          '<button type="button" class="q-minus" data-key="' + key + '" aria-label="Decrease quantity"' + (c.qty <= 1 ? " disabled" : "") + '>&minus;</button>' +
          '<span class="q">' + c.qty + '</span>' +
          '<button type="button" class="q-plus" data-key="' + key + '" aria-label="Increase quantity">+</button>' +
          '</div></div>';
        wrap.appendChild(line);
      });
    }

    // subtotal + free-ship progress
    if (subEl) subEl.textContent = money(t.sub);
    if (freeMsg) freeMsg.textContent = "Shipping cost will be confirmed when your order is placed.";
    if (progress) progress.style.width = "0%";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[ch];
    });
  }

  
function openAddToBag(item, onConfirm) {
  var oldModal = $("#sawaSizeModal");
  if (oldModal) oldModal.remove();

  var modal = document.createElement("div");
  modal.id = "sawaSizeModal";
  modal.style.cssText = "position:fixed;inset:0;z-index:10060;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:18px;";

  modal.innerHTML =
    '<section role="dialog" aria-modal="true" style="background:#fff;color:#241b1d;width:min(100%,420px);padding:24px;border-radius:14px;position:relative;font-family:inherit">' +
    '<button type="button" id="sawaSizeClose" aria-label="Close" style="position:absolute;right:14px;top:10px;border:0;background:none;font-size:26px;cursor:pointer">&times;</button>' +
    '<div style="display:flex;gap:15px;align-items:center;margin-bottom:20px">' +
    (item.img ? '<img src="' + escapeHtml(item.img) + '" alt="' + escapeHtml(item.name) + '" style="width:100px;height:125px;object-fit:cover;border-radius:8px">' : '') +
    '<div><h3 style="margin:0 0 8px;font-size:18px">' + escapeHtml(item.name) + '</h3>' +
    '<strong>' + money(item.price) + '</strong>' +
    (item.baseVariant ? '<p style="margin:6px 0 0;color:#777">' + escapeHtml(item.baseVariant) + '</p>' : '') +
    '</div></div>' +
    '<form id="sawaSizeForm">' +
    '<label for="sawaSizeSelect" style="display:block;margin-bottom:9px;font-weight:600">Select your size *</label>' +
    '<select id="sawaSizeSelect" name="size" required style="width:100%;padding:13px;border:1px solid #ccc;border-radius:7px;background:white;margin-bottom:18px">' +
    '<option value="">Choose your size</option>' +
    '<option value="Medium">S/M</option>' +
    '<option value="Large">L/XL</option>' +
    '</select>' +
    '<button type="submit" style="width:100%;padding:14px;background:#642b3a;color:white;border:0;border-radius:7px;font-weight:700;cursor:pointer">Add to Bag</button>' +
    '</form></section>';

  document.body.appendChild(modal);
  lockScroll(true);

  function close() {
    modal.remove();
    lockScroll(false);
  }

  $("#sawaSizeClose", modal).addEventListener("click", close);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) close();
  });

  $("#sawaSizeForm", modal).addEventListener("submit", function (e) {
    e.preventDefault();

    var size = $("#sawaSizeSelect", modal).value;
    if (!size) {
      $("#sawaSizeSelect", modal).reportValidity();
      return;
    }

    item.variant = [item.baseVariant, size].filter(Boolean).join(" · ");
    close();
    onConfirm(item);
  });
}

function openCheckout() {
    if (!cart.length) {
      showToast("Your cart is empty");
      return;
    }

    var existing = $("#sawaCheckoutModal");
    if (existing) {
      existing.classList.add("open");
      return;
    }

    var total = cartTotals().sub;
    var modal = document.createElement("div");
    modal.id = "sawaCheckoutModal";
    modal.style.cssText = "position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:18px;";

    modal.innerHTML =
      '<section role="dialog" aria-modal="true" aria-labelledby="sawaCheckoutTitle" style="background:#fff;color:#241b1d;width:min(100%,520px);max-height:90vh;overflow:auto;padding:26px;border-radius:14px;position:relative;font-family:inherit">' +
      '<button type="button" id="sawaCheckoutClose" aria-label="Close" style="position:absolute;right:14px;top:10px;border:0;background:none;font-size:28px;cursor:pointer">&times;</button>' +
      '<h2 id="sawaCheckoutTitle" style="margin:0 0 8px">Complete your order</h2>' +
      '<p style="margin:0 0 18px">Total: <strong>' + money(total) + '</strong> · Cash on delivery</p>' +

      '<form id="sawaCheckoutForm">' +

      '<label style="display:block;margin:10px 0 5px">Full name *</label>' +
      '<input name="customerName" required autocomplete="name" style="width:100%;padding:12px;border:1px solid #ccc;border-radius:7px">' +

      '<label style="display:block;margin:10px 0 5px">Mobile number *</label>' +
      '<input name="phone" required type="tel" inputmode="tel" autocomplete="tel" style="width:100%;padding:12px;border:1px solid #ccc;border-radius:7px">' +

      '<label style="display:block;margin:10px 0 5px">Governorate / City *</label>' +
      '<input name="city" required style="width:100%;padding:12px;border:1px solid #ccc;border-radius:7px">' +

      '<label style="display:block;margin:10px 0 5px">Detailed address *</label>' +
      '<textarea name="address" required rows="3" style="width:100%;padding:12px;border:1px solid #ccc;border-radius:7px;resize:vertical"></textarea>' +


      '<label style="display:block;margin:10px 0 5px">Notes (optional)</label>' +
      '<textarea name="notes" rows="2" style="width:100%;padding:12px;border:1px solid #ccc;border-radius:7px;resize:vertical"></textarea>' +

      '<button type="submit" style="width:100%;margin-top:18px;padding:14px;background:#642b3a;color:white;border:0;border-radius:7px;font-weight:700;cursor:pointer">Send order on WhatsApp</button>' +

      '<p style="font-size:12px;line-height:1.5;margin:12px 0 0;color:#666">Your order details will open in WhatsApp. Press Send there to deliver the order to the store.</p>' +
      '</form></section>';

    document.body.appendChild(modal);
    lockScroll(true);

    function close() {
      modal.remove();
      lockScroll(false);
    }

    $("#sawaCheckoutClose", modal).addEventListener("click", close);

    modal.addEventListener("click", function (e) {
      if (e.target === modal) close();
    });

    $("#sawaCheckoutForm", modal).addEventListener("submit", function (e) {
      e.preventDefault();

      var form = e.currentTarget;
      if (!form.reportValidity()) return;

      var data = new FormData(form);

      var lines = cart.map(function (item, index) {
        return (index + 1) + ". " + item.name +
          (item.variant ? " (" + item.variant + ")" : "") +
          " — " + item.qty + " × " + money(item.price) +
          " = " + money(item.qty * item.price);
      }).join("\n");

      var message =
        "New SAWA order\n\n" + lines +
        "\n\nTotal: " + money(cartTotals().sub) +
        "\nPayment: Cash on delivery" +
        "\n\nCustomer: " + data.get("customerName") +
        "\nPhone: " + data.get("phone") +
        "\nCity/Governorate: " + data.get("city") +
        "\nAddress: " + data.get("address") +
        "\nNotes: " + (data.get("notes") || "-");

      var url = "https://wa.me/201044986530?text=" + encodeURIComponent(message);

      window.open(url, "_blank", "noopener,noreferrer");

      close();
      showToast("Order details prepared in WhatsApp");
    });
  }


  function initProductSelection() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    if (id) {
      var name = params.get("name") || "Selected product";
      var price = parseFloat(params.get("price")) || 0;
      var img = params.get("img") || "";
      var title = $("#pdp-title");
      var add = $("#pdpAdd");
      var mainImg = $("#pdpMainImg");
      var priceEl = $(".pdp-price .now, .pdp-price");
      if (title) title.textContent = name;
      document.title = name + " — SAWA";
      if (add) {
        add.setAttribute("data-id", id);
        add.setAttribute("data-name", name);
        add.setAttribute("data-price", String(price));
        if (img) add.setAttribute("data-img", img);
        add.textContent = "Add to Cart — " + money(price);
      }
      if (priceEl && price > 0) priceEl.textContent = money(price);
      if (mainImg && img) { mainImg.src = img; mainImg.alt = name; }
      var thumbs = $("#pdpThumbs");
      if (thumbs && img) thumbs.style.display = "none";
    }

    // Every product card opens the exact product clicked, using its own card image.
    $all(".product-card").forEach(function (card) {
      var link = $(".pc-name a", card);
      if (!link) return;
      link.addEventListener("click", function (e) {
        var id = card.getAttribute("data-id");
        var name = card.getAttribute("data-name");
        var image = $(".pc-media img", card);
        var priceText = $(".pc-price .now", card);
        var price = priceText ? parseFloat(priceText.textContent.replace(/[^0-9.]/g, "")) : parseFloat(card.getAttribute("data-price"));
        if (!id || !name) return;
        e.preventDefault();
        var query = new URLSearchParams({ id: id, name: name, price: String(price || 0), img: image ? image.getAttribute("src") : card.getAttribute("data-img") || "" });
        window.location.href = "product.html?" + query.toString();
      });
    });
  }

  function initCart() {
    loadCart();
    var drawer = $("#cartDrawer"), scrim = $("#cartScrim");
    var openBtn = $("#cartOpen"), closeBtn = $("#cartClose");
    var contBtn = $("#cartContinue"), emptyShop = $("#cartEmptyShop");
    if (!drawer) return;

    function open() {
      drawer.classList.add("open");
      if (scrim) scrim.classList.add("open");
      lockScroll(true);
      if (closeBtn) closeBtn.focus();
    }
    function shut() {
      drawer.classList.remove("open");
      if (scrim) scrim.classList.remove("open");
      lockScroll(false);
    }
    if (openBtn) openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", shut);
    if (scrim) scrim.addEventListener("click", shut);
    if (contBtn) contBtn.addEventListener("click", shut);
    var checkoutBtn = $("#cartCheckout");
    if (checkoutBtn) checkoutBtn.addEventListener("click", openCheckout);
    if (emptyShop) emptyShop.addEventListener("click", shut);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("open")) shut(); });

    // delegate qty/remove inside cart
    drawer.addEventListener("click", function (e) {
      var minus = e.target.closest(".q-minus");
      var plus = e.target.closest(".q-plus");
      var rm = e.target.closest(".cl-remove");
      if (minus) changeQty(minus.getAttribute("data-key"), -1);
      else if (plus) changeQty(plus.getAttribute("data-key"), 1);
      else if (rm) removeFromCart(rm.getAttribute("data-key"));
    });

    // quick-add buttons across the page
        // Quick-add buttons: show product details and size selection first
    $all(".js-add").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();

        var card = btn.closest(".product-card");
        var visiblePrice = card ? $(".pc-price .now", card) : null;
        var cardImage = card ? $(".pc-media img", card) : null;
        var parsedPrice = visiblePrice
          ? parseFloat(visiblePrice.textContent.replace(/[^0-9.]/g, ""))
          : parseFloat(btn.getAttribute("data-price"));

        var item = {
          id: btn.getAttribute("data-id"),
          name: btn.getAttribute("data-name"),
          price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
          img: cardImage ? cardImage.getAttribute("src") : btn.getAttribute("data-img"),
          baseVariant: btn.getAttribute("data-variant") || "",
          qty: 1
        };

        openAddToBag(item, function (selectedItem) {
          addToCart(selectedItem);
          showToast(selectedItem.name + " added to bag");
          open();
        });
      });
    });

    // PDP add-to-bag (reads live colour/size/qty)
        // PDP add-to-bag: show product details and size selection first
    var pdpAdd = $("#pdpAdd");
    if (pdpAdd) {
      pdpAdd.addEventListener("click", function () {
        var colour = ($("#colourVal") || {}).textContent || "";
        var qty = parseInt(($("#qtyVal") || {}).textContent, 10) || 1;
        var mainImg = $("#pdpMainImg");

        var item = {
          id: pdpAdd.getAttribute("data-id"),
          name: pdpAdd.getAttribute("data-name"),
          price: parseFloat(pdpAdd.getAttribute("data-price")),
          img: mainImg
            ? mainImg.getAttribute("src")
            : pdpAdd.getAttribute("data-img"),
          baseVariant: colour,
          qty: qty
        };

        openAddToBag(item, function (selectedItem) {
          addToCart(selectedItem);
          showToast(selectedItem.name + " added to bag");
          open();
        });
      });
    }

    renderCart();
  }

function initWishlistDrawer() {
  var drawer = $("#wishlistDrawer");
  var scrim = $("#wishlistScrim");
  var openBtn = $("#wishlistOpen");
  var closeBtn = $("#wishlistClose");
  var itemsContainer = $("#wishlistItems");

  if (!drawer || !itemsContainer) return;

  var STORAGE_KEY = "sawaWishlist";

  function getItems() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function renderWishlist() {
    var items = getItems();

    $("#wishlistCount").textContent = items.length;
    $("#wishlistQtyNote").textContent =
      items.length + (items.length === 1 ? " item" : " items");

    itemsContainer.innerHTML = "";

    if (!items.length) {
      itemsContainer.innerHTML =
        '<div class="cart-empty"><p>Your wishlist is empty.<br>Save something lovely!</p></div>';
      return;
    }

    items.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "wishlist-item";

      var img = document.createElement("img");
      img.src = item.img || "";
      img.alt = item.name || "Product";

      var info = document.createElement("div");
      info.className = "wishlist-item-info";

      var name = document.createElement("h4");
      name.textContent = item.name;

      var price = document.createElement("p");
      price.textContent = item.price + " LE";

      var remove = document.createElement("button");
      remove.className = "wishlist-remove";
      remove.textContent = "Remove";
      remove.setAttribute("data-wishlist-id", item.id);

      info.appendChild(name);
      info.appendChild(price);
      info.appendChild(remove);

      row.appendChild(img);
      row.appendChild(info);

      itemsContainer.appendChild(row);
    });
  }

  function open() {
    renderWishlist();
    drawer.classList.add("open");
    if (scrim) scrim.classList.add("open");
    lockScroll(true);
    if (closeBtn) closeBtn.focus();
  }

  function shut() {
    drawer.classList.remove("open");
    if (scrim) scrim.classList.remove("open");
    lockScroll(false);
  }

  if (openBtn) openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", shut);
  if (scrim) scrim.addEventListener("click", shut);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.classList.contains("open")) {
      shut();
    }
  });

  itemsContainer.addEventListener("click", function (e) {
    var removeBtn = e.target.closest(".wishlist-remove");
    if (!removeBtn) return;

    var id = removeBtn.getAttribute("data-wishlist-id");
    var items = getItems().filter(function (item) {
      return item.id !== id;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    renderWishlist();

    $all(".pc-wish, #pdpWish").forEach(function (btn) {
      var card = btn.closest(".product-card");
      var addBtn = card ? $(".js-add", card) : $("#pdpAdd");
      var productId = addBtn ? addBtn.dataset.id : "";

      var active = items.some(function (item) {
        return item.id === productId;
      });

      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    showToast("Removed from wishlist");
  });

  renderWishlist();
}

  /* ---------- New arrivals scroll-snap nav ---------- */
  function initSnapNav() {
    var row = $("#snapRow"), prev = $("#snapPrev"), next = $("#snapNext");
    if (!row) return;
    function step() {
      var item = row.querySelector(".snap-item");
      return item ? item.getBoundingClientRect().width + 22 : 280;
    }
    if (prev) prev.addEventListener("click", function () { row.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" }); });
    if (next) next.addEventListener("click", function () { row.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" }); });
  }

  /* ---------- Countdown ---------- */
  function initCountdown() {
    var box = $("#countdown");
    if (!box) return;
    var units = {
      days: box.querySelector('[data-cd="days"]'),
      hours: box.querySelector('[data-cd="hours"]'),
      mins: box.querySelector('[data-cd="mins"]'),
      secs: box.querySelector('[data-cd="secs"]')
    };
    // Target: 2 days 8 hours from load (front-end demo)
    var target = Date.now() + (2 * 24 * 60 * 60 + 8 * 60 * 60) * 1000;
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function tick() {
      var diff = Math.max(0, target - Date.now());
      var s = Math.floor(diff / 1000);
      var d = Math.floor(s / 86400); s -= d * 86400;
      var h = Math.floor(s / 3600); s -= h * 3600;
      var m = Math.floor(s / 60); s -= m * 60;
      if (units.days) units.days.textContent = pad(d);
      if (units.hours) units.hours.textContent = pad(h);
      if (units.mins) units.mins.textContent = pad(m);
      if (units.secs) units.secs.textContent = pad(s);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Count-up stats ---------- */
  function initCounters() {
    var nums = $all("[data-count]");
    if (!nums.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduceMotion) { el.textContent = target + suffix; return; }
      var start = null, dur = 1500;
      function frame(ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var els = $all(".reveal");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Testimonial slider ---------- */
  function initTestimonials() {
    var track = $("#testiTrack"), dotsWrap = $("#testiDots");
    if (!track) return;
    var slides = $all(".testi-slide", track);
    var dots = dotsWrap ? $all("button", dotsWrap) : [];
    if (slides.length < 2) return;
    var i = 0, timer;
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("active", k === i); });
      dots.forEach(function (d, k) { d.classList.toggle("active", k === i); });
    }
    function auto() {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(function () { go(i + 1); }, 6000);
    }
    dots.forEach(function (d, k) { d.addEventListener("click", function () { go(k); auto(); }); });
    go(0); auto();
  }

  /* ---------- Newsletter ---------- */
  function initNewsletter() {
    var form = $("#nlForm"), ok = $("#nlOk"), input = $("#nlEmail");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (input && !input.checkValidity()) { input.reportValidity(); return; }
      if (ok) ok.classList.add("show");
      form.reset();
      showToast("You're on the list — welcome to Vesta");
    });
  }

  /* ---------- Smooth-scroll anchors (respect reduced motion) ---------- */
  function initSmoothScroll() {
    $all('a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      a.addEventListener("click", function (e) {
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
    });
  }

  /* ==========================================================================
     Product detail page
     ========================================================================== */
  
function initGallery() {
    var thumbs = $all(".pdp-thumb");
    var mainImg = $("#pdpMainImg");
    var prev = $("[data-gallery-prev]");
    var next = $("[data-gallery-next]");
    var counter = $(".gallery-count");

    if (!mainImg || !thumbs.length) return;

    var currentIndex = 0;

    function showImage(index) {
        currentIndex = (index + thumbs.length) % thumbs.length;

        var thumb = thumbs[currentIndex];
        var image = $("img", thumb);
        var full = thumb.getAttribute("data-full");

        if (!full && image) {
            full = image.getAttribute("src");
        }

        if (full) {
            mainImg.src = full;
        }

        thumbs.forEach(function (t, i) {
            t.classList.toggle("active", i === currentIndex);
            t.setAttribute("aria-current", i === currentIndex ? "true" : "false");
        });

        mainImg.alt = "Flora-Fringe Jacket - image " + (currentIndex + 1);

        if (counter) {
            counter.textContent = (currentIndex + 1) + " / " + thumbs.length;
        }
    }

    thumbs.forEach(function (thumb, index) {
        thumb.addEventListener("click", function () {
            showImage(index);
        });
    });

    if (prev) {
        prev.addEventListener("click", function (e) {
            e.stopPropagation();
            showImage(currentIndex - 1);
        });
    }

    if (next) {
        next.addEventListener("click", function (e) {
            e.stopPropagation();
            showImage(currentIndex + 1);
        });
    }

    showImage(0);
}


  function initLightbox() {
    var main = $("#pdpMain"), lb = $("#lightbox"), lbImg = $("#lightboxImg"), close = $("#lightboxClose"), mainImg = $("#pdpMainImg");
    if (!main || !lb) return;
    function open() {
      if (mainImg && lbImg) lbImg.src = mainImg.src;
      lb.classList.add("open");
      lockScroll(true);
      if (close) close.focus();
    }
    function shut() { lb.classList.remove("open"); lockScroll(false); }
    main.addEventListener("click", open);
    main.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    if (close) close.addEventListener("click", shut);
    lb.addEventListener("click", function (e) { if (e.target === lb) shut(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && lb.classList.contains("open")) shut(); });
  }

  function initSwatches() {
    var swatches = $all("#swatches .swatch"), val = $("#colourVal");
    if (!swatches.length) return;
    swatches.forEach(function (s) {
      s.addEventListener("click", function () {
        swatches.forEach(function (x) { x.classList.remove("active"); x.setAttribute("aria-checked", "false"); });
        s.classList.add("active");
        s.setAttribute("aria-checked", "true");
        if (val) val.textContent = s.getAttribute("data-colour");
      });
    });
  }

  function initSizePicker() {
    var sizes = $all("#sizes .size-btn");
    if (!sizes.length) return;
    sizes.forEach(function (s) {
      if (s.disabled) return;
      s.addEventListener("click", function () {
        sizes.forEach(function (x) { x.classList.remove("active"); x.setAttribute("aria-checked", "false"); });
        s.classList.add("active");
        s.setAttribute("aria-checked", "true");
      });
    });
  }

  function initQtyStepper() {
    var minus = $("#qtyMinus"), plus = $("#qtyPlus"), val = $("#qtyVal"), add = $("#pdpAdd");
    if (!val) return;
    function get() { return parseInt(val.textContent, 10) || 1; }
    function setPrice() {
      if (!add) return;
      var base = parseFloat(add.getAttribute("data-price"));
      add.textContent = "Add to Cart — " + money(base * get());
    }
    function set(n) { val.textContent = Math.max(1, n); if (minus) minus.disabled = get() <= 1; setPrice(); }
    if (minus) minus.addEventListener("click", function () { set(get() - 1); });
    if (plus) plus.addEventListener("click", function () { set(get() + 1); });
    set(1);
  }

  function initTabs() {
    var tabs = $all(".tab-btn"), panels = $all(".tab-panel");
    if (!tabs.length) return;
    function activate(name) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-tab") === name;
        t.classList.toggle("active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (p) { p.classList.toggle("active", p.getAttribute("data-panel") === name); });
    }
    tabs.forEach(function (t, idx) {
      t.addEventListener("click", function () { activate(t.getAttribute("data-tab")); });
      t.addEventListener("keydown", function (e) {
        var n;
        if (e.key === "ArrowRight") n = (idx + 1) % tabs.length;
        else if (e.key === "ArrowLeft") n = (idx - 1 + tabs.length) % tabs.length;
        else return;
        e.preventDefault();
        tabs[n].focus();
        activate(tabs[n].getAttribute("data-tab"));
      });
    });
    // deep links to reviews / size guide
    var jumpR = $("#jumpReviews"), jumpS = $("#jumpSize");
    if (jumpR) jumpR.addEventListener("click", function () { activate("reviews"); });
    if (jumpS) jumpS.addEventListener("click", function (e) { e.preventDefault(); activate("size"); var el = $("#sizeguide"); if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); });
  }
    /* ---------- Related Products Auto Slider ---------- */
  /* ---------- Related Products Auto Slider ---------- */


function initRelatedSlider() {
  var sliders = $all(".related-slider");

  sliders.forEach(function (slider) {
    var cards = $all(".product-card", slider);
    if (cards.length < 2) return;

    var timer = null;
    var paused = false;

    function moveNext() {
      if (paused) return;

      var gap = parseFloat(getComputedStyle(slider).gap) || 0;
      var step = cards[0].getBoundingClientRect().width + gap;
      var maxScroll = slider.scrollWidth - slider.clientWidth;

      if (Math.abs(slider.scrollLeft) >= maxScroll - 5) {
        slider.scrollTo({
          left: 0,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      } else {
        slider.scrollBy({
          left: step,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      }
    }

    function start() {
      if (timer || reduceMotion) return;
      timer = setInterval(moveNext, 3000);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    slider.addEventListener("mouseenter", function () {
      paused = true;
      stop();
    });

    slider.addEventListener("mouseleave", function () {
      paused = false;
      start();
    });

    slider.addEventListener("touchstart", function () {
      paused = true;
      stop();
    }, { passive: true });

    slider.addEventListener("touchend", function () {
      paused = false;
      start();
    }, { passive: true });

    start();
  });
}


  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initStickyHeader();
    initMobileNav();
    initSearch();
    initFilter();
    initWishlist();
    initWishlistDrawer();
    initCart();
    initProductSelection();
    initSnapNav();
    initCountdown();
    initCounters();
    initTestimonials();
    initNewsletter();
    initSmoothScroll();
    // PDP
    initGallery();
    initLightbox();
    initSwatches();
    initSizePicker();
    initQtyStepper();
    initTabs();
    initRelatedSlider();
  });

  // Reveal runs immediately so above-the-fold isn't stuck hidden
  initReveal();
})
();
