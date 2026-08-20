/* =========================================================
   COMICVERSE - INTERACTIVE STORE
   ========================================================= */

(() => {
    "use strict";

    const CART_KEY = "comicverse_cart";
    const WISHLIST_KEY = "comicverse_wishlist";
    const THEME_KEY = "comicverse_theme";

    let cart = loadJSON(CART_KEY, []);
    let wishlist = loadJSON(WISHLIST_KEY, []);

    const money = price => `$${Number(price).toFixed(2)}`;

    function loadJSON(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return Array.isArray(value) ? value : fallback;
        } catch {
            return fallback;
        }
    }

    function saveState() {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    }

    // Get product information from the card
    function getProductFromCard(card) {
        const title =
            card.querySelector("h3")?.textContent.trim() || "Comic";

        const price =
            Number(
                card
                    .querySelector("strong")
                    ?.textContent.replace(/[^0-9.]/g, "")
            ) || 0;

        const image =
            card.querySelector("img")?.src || "";

        const publisherEl =
            card.querySelector(".publisher") ||
            card.querySelector("div > p");

        const descriptionEl =
            card.querySelector(".product-info > p:not(.publisher)");

        return {
            name: title,
            price: price,
            image: image,
            publisher: publisherEl?.textContent.trim() || "",
            description: descriptionEl?.textContent.trim() || "",
            condition: "Collector Grade"
        };
    }

    /* =========================================================
       CART
       ========================================================= */

    function updateCart() {
        const section = document.getElementById("cart");

        if (!section) return;

        const totalBox = section.querySelector(".cart-total");

        // Remove old generated cart items
        section.querySelectorAll(".cart-box").forEach(item => {
            item.remove();
        });

        let total = 0;
        let count = 0;

        cart.forEach((item, index) => {
            total += item.price * item.quantity;
            count += item.quantity;

            const box = document.createElement("div");

            box.className = "cart-box";

            box.innerHTML = `
                <div class="cart-item-details">

                    <h3>${escapeHTML(item.name)}</h3>

                    <p>
                        Condition:
                        ${escapeHTML(item.condition || "Collector Grade")}
                    </p>

                    <div class="quantity-controls">

                        <button
                            type="button"
                            data-cart-action="decrease"
                            data-index="${index}">
                            −
                        </button>

                        <span>${item.quantity}</span>

                        <button
                            type="button"
                            data-cart-action="increase"
                            data-index="${index}">
                            +
                        </button>

                    </div>

                </div>

                <div class="cart-item-actions">

                    <strong>
                        ${money(item.price * item.quantity)}
                    </strong>

                    <button
                        type="button"
                        data-cart-action="remove"
                        data-index="${index}">
                        Remove
                    </button>

                </div>
            `;

            section.insertBefore(box, totalBox);
        });

        // Update total
        const totalElement =
            section.querySelector(".cart-total strong");

        if (totalElement) {
            totalElement.textContent = money(total);
        }

        // Create Buy Now button
        let buyButton =
            totalBox.querySelector("[data-buy]");

        if (!buyButton) {

            buyButton = document.createElement("button");

            buyButton.type = "button";
            buyButton.textContent = "Buy Now";
            buyButton.dataset.buy = "true";

            totalBox.appendChild(buyButton);
        }

        buyButton.disabled = cart.length === 0;

        buyButton.style.opacity =
            cart.length ? "1" : "0.55";

        // Update navbar cart count
        const navCart =
            document.querySelector(
                ".nav-buttons a[href='#cart']"
            );

        if (navCart) {
            navCart.textContent = `🛒 Cart (${count})`;
        }

        saveState();
    }


    // Add product to cart
    function addToCart(product) {

        const existing =
            cart.find(item => item.name === product.name);

        if (existing) {

            existing.quantity++;

        } else {

            cart.push({
                ...product,
                quantity: 1
            });
        }

        updateCart();

        showToast(
            `${product.name} added to cart.`
        );
    }


    /* =========================================================
       WISHLIST
       ========================================================= */

    function toggleWishlist(product) {

        const exists =
            wishlist.some(
                item => item.name === product.name
            );

        if (exists) {

            wishlist =
                wishlist.filter(
                    item => item.name !== product.name
                );

            showToast(
                `${product.name} removed from wishlist.`
            );

        } else {

            wishlist.push(product);

            showToast(
                `${product.name} saved to wishlist.`
            );
        }

        updateWishlist();
        updateWishlistButtons();

        saveState();
    }


    function updateWishlistButtons() {

        document
            .querySelectorAll(
                ".product-card, .comic-item"
            )
            .forEach(card => {

                const product =
                    getProductFromCard(card);

                const button =
                    card.querySelector(".wishlist-btn");

                if (!button) return;

                const saved =
                    wishlist.some(
                        item => item.name === product.name
                    );

                button.textContent =
                    saved ? "♥" : "♡";

                button.classList.toggle(
                    "active",
                    saved
                );

                button.setAttribute(
                    "aria-pressed",
                    String(saved)
                );

                button.title =
                    saved
                        ? "Remove from wishlist"
                        : "Add to wishlist";
            });
    }


    function updateWishlist() {

        const container =
            document.getElementById(
                "wishlist-items"
            );

        if (!container) return;

        if (!wishlist.length) {

            container.innerHTML = `
                <p class="empty-state">
                    Your wishlist is empty.
                    Tap ♡ on a comic to save it.
                </p>
            `;

            return;
        }

        container.innerHTML =
            wishlist.map((item, index) => `

                <article class="wishlist-card">

                    <img
                        src="${escapeAttribute(item.image)}"
                        alt="${escapeAttribute(item.name)}"
                    >

                    <div>

                        <p class="publisher">
                            ${escapeHTML(item.publisher)}
                        </p>

                        <h3>
                            ${escapeHTML(item.name)}
                        </h3>

                        <strong>
                            ${money(item.price)}
                        </strong>

                        <div class="wishlist-actions">

                            <button
                                type="button"
                                data-wishlist-cart="${index}">
                                Add to Cart
                            </button>

                            <button
                                type="button"
                                data-wishlist-remove="${index}">
                                Remove
                            </button>

                        </div>

                    </div>

                </article>

            `).join("");
    }


    /* =========================================================
       SEARCH + FILTER
       ========================================================= */

    function filterProducts() {

        const text =
            document
                .getElementById("search-box")
                ?.value
                .toLowerCase()
                .trim() || "";

        const publisher =
            document
                .getElementById("publisher")
                ?.value
                .toLowerCase() || "all";

        const era =
            document
                .getElementById("era")
                ?.value
                .toLowerCase() || "all";

        const products =
            document.querySelectorAll(
                ".product-card, .comic-item"
            );

        let matches = 0;

        products.forEach(card => {

            const content =
                card.textContent.toLowerCase();

            const publisherMatch =
                publisher === "all" ||
                content.includes(publisher);

            const cardEra =
                (card.dataset.era || "")
                    .toLowerCase();

            const eraMatch =
                era === "all" ||
                !cardEra ||
                cardEra === era;

            const show =
                (!text || content.includes(text)) &&
                publisherMatch &&
                eraMatch;

            card.hidden = !show;

            if (show) {
                matches++;
            }
        });


        let emptyMessage =
            document.getElementById(
                "search-empty-state"
            );

        if (!emptyMessage) {

            emptyMessage =
                document.createElement("p");

            emptyMessage.id =
                "search-empty-state";

            emptyMessage.style.cssText =
                "margin-top:18px;color:#ff304f;";

            document
                .querySelector(".search-section")
                ?.appendChild(emptyMessage);
        }

        emptyMessage.textContent =
            matches
                ? ""
                : "No comics matched your search.";

        const count =
            document.getElementById(
                "catalog-count"
            );

        if (count) {

            count.textContent =
                `${matches} comic${
                    matches === 1 ? "" : "s"
                } found`;
        }
    }


    // Clear all filters
    function clearFilters() {

        document.getElementById(
            "search-box"
        ).value = "";

        document.getElementById(
            "publisher"
        ).value = "all";

        document.getElementById(
            "era"
        ).value = "all";

        filterProducts();

        showToast(
            "Filters cleared."
        );
    }


    /* =========================================================
       PRICE SORTING
       ========================================================= */

    function createSortControl() {

        const form =
            document.querySelector(
                ".search-section form"
            );

        if (!form) return;

        if (
            document.getElementById(
                "sort-price"
            )
        ) {
            return;
        }

        const select =
            document.createElement("select");

        select.id = "sort-price";

        select.innerHTML = `
            <option value="default">
                Sort by Price
            </option>

            <option value="low">
                Price: Low to High
            </option>

            <option value="high">
                Price: High to Low
            </option>
        `;

        form.appendChild(select);

        select.addEventListener(
            "change",
            () => {

                const order =
                    select.value;

                const containers = [
                    document.getElementById(
                        "product-slider"
                    ),
                    document.querySelector(
                        ".catalog-grid"
                    )
                ].filter(Boolean);

                containers.forEach(container => {

                    const cards =
                        [...container.children];

                    cards.sort((a, b) => {

                        const priceA =
                            getProductFromCard(a).price;

                        const priceB =
                            getProductFromCard(b).price;

                        if (order === "low") {
                            return priceA - priceB;
                        }

                        if (order === "high") {
                            return priceB - priceA;
                        }

                        return 0;
                    });

                    cards.forEach(card => {
                        container.appendChild(card);
                    });
                });

                updateWishlistButtons();
            }
        );
    }


    /* =========================================================
       TOAST
       ========================================================= */

    function showToast(message) {

        let toast =
            document.getElementById(
                "comic-toast"
            );

        if (!toast) {

            toast =
                document.createElement("div");

            toast.id =
                "comic-toast";

            document.body.appendChild(toast);
        }

        toast.textContent =
            message;

        toast.classList.add(
            "show"
        );

        clearTimeout(
            showToast.timer
        );

        showToast.timer =
            setTimeout(
                () => {
                    toast.classList.remove(
                        "show"
                    );
                },
                2600
            );
    }


    /* =========================================================
       POPUP MODAL
       ========================================================= */

    function popup(
        message,
        title = "ComicVerse"
    ) {

        document
            .getElementById(
                "site-popup"
            )
            ?.remove();

        const box =
            document.createElement("div");

        box.id =
            "site-popup";

        box.className =
            "site-modal";

        box.innerHTML = `

            <div
                class="site-modal-content"
                role="dialog"
                aria-modal="true">

                <button
                    type="button"
                    class="modal-close"
                    data-close
                    aria-label="Close">
                    &times;
                </button>

                <h2>
                    ${escapeHTML(title)}
                </h2>

                <p>
                    ${escapeHTML(message)}
                </p>

                <button
                    type="button"
                    data-close>
                    Continue
                </button>

            </div>
        `;

        document.body.appendChild(box);

        box
            .querySelectorAll(
                "[data-close]"
            )
            .forEach(button => {

                button.onclick =
                    () => box.remove();
            });

        box.onclick = event => {

            if (
                event.target === box
            ) {
                box.remove();
            }
        };
    }


    /* =========================================================
       SLIDER
       ========================================================= */

    function slideLeft() {

        document
            .getElementById(
                "product-slider"
            )
            ?.scrollBy({
                left: -320,
                behavior: "smooth"
            });
    }


    function slideRight() {

        document
            .getElementById(
                "product-slider"
            )
            ?.scrollBy({
                left: 320,
                behavior: "smooth"
            });
    }


    /* =========================================================
       MOBILE MENU
       ========================================================= */

    function toggleMenu() {

        document
            .getElementById(
                "nav-menu"
            )
            ?.classList.toggle(
                "active"
            );
    }


    /* =========================================================
       DARK / LIGHT THEME
       ========================================================= */

    function setupTheme() {

        const savedTheme =
            localStorage.getItem(
                THEME_KEY
            );

        if (
            savedTheme === "light"
        ) {
            document.body
                .classList.add(
                    "light-theme"
                );
        }

        const button =
            document.getElementById(
                "theme-toggle"
            );

        if (!button) return;

        updateThemeButton(button);

        button.onclick = () => {

            document.body
                .classList.toggle(
                    "light-theme"
                );

            const light =
                document.body.classList.contains(
                    "light-theme"
                );

            localStorage.setItem(
                THEME_KEY,
                light
                    ? "light"
                    : "dark"
            );

            updateThemeButton(
                button
            );
        };
    }


    function updateThemeButton(button) {

        const light =
            document.body.classList.contains(
                "light-theme"
            );

        button.textContent =
            light
                ? "🌙"
                : "☀️";

        button.title =
            light
                ? "Switch to dark mode"
                : "Switch to light mode";
    }


    /* =========================================================
       AUTO SLIDER
       ========================================================= */

    function setupAutoSlider() {

        const slider =
            document.getElementById(
                "product-slider"
            );

        if (!slider) return;

        let timer =
            setInterval(
                slideRight,
                5000
            );

        slider.addEventListener(
            "mouseenter",
            () => clearInterval(timer)
        );

        slider.addEventListener(
            "mouseleave",
            () => {
                timer =
                    setInterval(
                        slideRight,
                        5000
                    );
            }
        );
    }


    /* =========================================================
       FORMS
       ========================================================= */

    function setupForms() {

        const searchForm =
            document.querySelector(
                ".search-section form"
            );

        searchForm?.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                filterProducts();

                document
                    .getElementById(
                        "catalog"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });
            }
        );


        document
            .getElementById(
                "search-box"
            )
            ?.addEventListener(
                "input",
                filterProducts
            );


        document
            .getElementById(
                "publisher"
            )
            ?.addEventListener(
                "change",
                filterProducts
            );


        document
            .getElementById(
                "era"
            )
            ?.addEventListener(
                "change",
                filterProducts
            );


        document
            .getElementById(
                "clear-filters"
            )
            ?.addEventListener(
                "click",
                clearFilters
            );


        // Contact form
        document
            .querySelector(
                ".contact-form"
            )
            ?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    const form =
                        event.target;

                    if (
                        !form.checkValidity()
                    ) {
                        form.reportValidity();
                        return;
                    }

                    const name =
                        document.getElementById(
                            "name"
                        ).value;

                    popup(
                        `Thanks, ${name}. Your message was received.`,
                        "Message Sent"
                    );

                    form.reset();
                }
            );


        // Pull List
        document
            .querySelector(
                ".pull-list form"
            )
            ?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    popup(
                        "Your pull list preferences have been saved.",
                        "Pull List Saved"
                    );
                }
            );
    }


    /* =========================================================
       PRODUCT BUTTONS
       ========================================================= */

    function setupProductActions() {

        document
            .querySelectorAll(
                ".product-card, .comic-item"
            )
            .forEach(card => {

                const product =
                    getProductFromCard(card);


                const cartButton =
                    card.querySelector(
                        ".add-cart-btn"
                    );

                if (cartButton) {

                    cartButton.addEventListener(
                        "click",
                        () => {
                            addToCart(product);
                        }
                    );
                }


                const wishlistButton =
                    card.querySelector(
                        ".wishlist-btn"
                    );

                if (wishlistButton) {

                    wishlistButton.addEventListener(
                        "click",
                        () => {
                            toggleWishlist(product);
                        }
                    );
                }
            });
    }


    /* =========================================================
       CART ACTION BUTTONS
       ========================================================= */

    function setupCartActions() {

        const cartSection =
            document.getElementById(
                "cart"
            );

        if (!cartSection) return;

        cartSection.addEventListener(
            "click",
            event => {

                const action =
                    event.target.dataset
                        .cartAction;

                const index =
                    Number(
                        event.target.dataset.index
                    );


                // Increase quantity
                if (
                    action === "increase"
                ) {

                    if (cart[index]) {
                        cart[index].quantity++;
                        updateCart();
                    }
                }


                // Decrease quantity
                if (
                    action === "decrease"
                ) {

                    if (cart[index]) {

                        cart[index].quantity--;

                        if (
                            cart[index]
                                .quantity <= 0
                        ) {
                            cart.splice(
                                index,
                                1
                            );
                        }

                        updateCart();
                    }
                }


                // Remove item
                if (
                    action === "remove"
                ) {

                    cart.splice(
                        index,
                        1
                    );

                    updateCart();
                }


                // Buy now
                if (
                    event.target.dataset.buy &&
                    cart.length
                ) {

                    const total =
                        cart.reduce(
                            (sum, item) =>
                                sum +
                                item.price *
                                item.quantity,
                            0
                        );

                    popup(
                        `Demo order placed successfully. Order total: ${money(total)}.`,
                        "Purchase Complete"
                    );

                    cart = [];

                    updateCart();
                }
            }
        );
    }


    /* =========================================================
       WISHLIST ACTIONS
       ========================================================= */

    function setupWishlistActions() {

        const container =
            document.getElementById(
                "wishlist-items"
            );

        if (!container) return;

        container.addEventListener(
            "click",
            event => {

                const removeIndex =
                    event.target.dataset
                        .wishlistRemove;

                const cartIndex =
                    event.target.dataset
                        .wishlistCart;


                // Remove wishlist item
                if (
                    removeIndex !== undefined
                ) {

                    wishlist.splice(
                        Number(removeIndex),
                        1
                    );

                    updateWishlist();
                    updateWishlistButtons();

                    saveState();
                }


                // Add wishlist item to cart
                if (
                    cartIndex !== undefined
                ) {

                    const item =
                        wishlist[
                            Number(cartIndex)
                        ];

                    if (item) {
                        addToCart(item);
                    }
                }
            }
        );
    }


    /* =========================================================
       SECURITY HELPERS
       ========================================================= */

    function escapeHTML(value) {

        return String(value)
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );
    }


    function escapeAttribute(value) {

        return escapeHTML(value);
    }


    /* =========================================================
       GLOBAL FUNCTIONS
       ========================================================= */

    window.slideLeft =
        slideLeft;

    window.slideRight =
        slideRight;

    window.toggleMenu =
        toggleMenu;


    /* =========================================================
       START APPLICATION
       ========================================================= */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            createSortControl();

            setupProductActions();

            setupCartActions();

            setupWishlistActions();

            setupForms();

            setupTheme();

            setupAutoSlider();

            updateCart();

            updateWishlist();

            updateWishlistButtons();

            filterProducts();
        }
    );

})();