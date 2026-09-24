/* =========================================================
   MIMI LUXE — SHARED CUSTOMER JAVASCRIPT
   ---------------------------------------------------------
   This file is loaded before the page-specific JavaScript.
   It handles:
   - API configuration
   - customer authentication
   - cart storage
   - shared navigation
   - mobile navigation drawer
   - language selection
   - shared footer
   - safe HTML helpers
   ========================================================= */

const API_URL = "https://menus-tournaments-pix-structures.trycloudflare.vom";

const CUSTOMER_TOKEN_KEY = "customer_access_token";
const CART_KEY = "mimi_luxe_cart";
const LANGUAGE_KEY = "mimi_luxe_language";

/* =========================================================
   CUSTOMER AUTHENTICATION
   Backend routes used:
   POST /customers/login
   GET/POST protected customer routes use Bearer token
   ========================================================= */

function getCustomerToken() {
    return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

function setCustomerToken(token) {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

function logoutCustomer(redirect = "login.html") {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    window.location.href = redirect;
}

function authHeaders(includeJson = false) {
    const headers = {};
    const token = getCustomerToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }

    return headers;
}


async function readApiResponse(response) {
    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    return data;
}

function apiMessage(data, fallback) {
    if (!data) {
        return fallback;
    }

    if (typeof data.detail === "string" && data.detail.trim()) {
        return data.detail.trim();
    }

    if (Array.isArray(data.detail)) {
        return data.detail
            .map(error => error?.msg || "Please check the information entered.")
            .join(" ");
    }

    return fallback;
}

function networkMessage(fallback) {
    return `${fallback} Please check that the store is running and try again.`;
}

/* =========================================================
   CART
   ---------------------------------------------------------
   Cart data is stored locally because your order endpoint
   receives product IDs and quantities at checkout.
   ========================================================= */

function getCart() {
    try {
        const storedCart = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(storedCart) ? storedCart : [];
    } catch (error) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product, quantity = 1) {
    const cart = getCart();

    const productId = Number(product.id);
    const stock = Number(product.stock_quantity ?? 0);

    if (!productId || product.is_available === false || stock <= 0) {
        return false;
    }

    const requestedQuantity = Math.max(1, Number(quantity) || 1);
    const existingItem = cart.find(item => Number(item.id) === productId);

    if (existingItem) {
        existingItem.quantity = Math.min(
            Number(existingItem.quantity || 0) + requestedQuantity,
            stock
        );
        existingItem.stock_quantity = stock;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            brand: product.brand,
            category: product.category,
            price: Number(product.price || 0),
            image_url: product.image_url || "",
            stock_quantity: stock,
            quantity: Math.min(requestedQuantity, stock)
        });
    }

    saveCart(cart);
    return true;
}

function updateCartCount() {
    const total = getCart().reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
    );

    document.querySelectorAll(".cart-count").forEach(element => {
        element.textContent = total;
    });
}

/* =========================================================
   DISPLAY HELPERS
   ========================================================= */

function money(value) {
    return `₦${Number(value || 0).toLocaleString()}`;
}

function escapeHtml(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[character])
    );
}

function imageOrPlaceholder(url, alt = "Product") {
    const imageUrl = resolveProductImageUrl(url);

    if (imageUrl) {
        return escapeHtml(imageUrl);
    }

    const safeAlt = escapeHtml(alt);

    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="750">
            <rect width="100%" height="100%" fill="#f1ede9"/>
            <text x="50%" y="50%"
                dominant-baseline="middle"
                text-anchor="middle"
                fill="#817a74"
                font-family="Georgia"
                font-size="28">
                ${safeAlt}
            </text>
        </svg>
    `);
}

function resolveProductImageUrl(url) {
    if (!url) {
        return "";
    }

    const value = String(url).trim();

    if (!value) {
        return "";
    }

    // Already a complete web URL or data URL.
    if (/^(https?:|data:|blob:)/i.test(value)) {
        return value;
    }

    // FastAPI/static-file paths commonly come back as /uploads/....
    if (value.startsWith("/")) {
        return `${API_URL}${value}`;
    }

    // Relative backend paths such as uploads/product.jpg.
    return `${API_URL}/${value.replace(/^\/+/, "")}`;
}


/* =========================================================
   LANGUAGE DATA
   ========================================================= */

const base = {
    home: "Home",
    shop: "Shop",
    orders: "My Orders",
    login: "Login",
    register: "Create Account",
    logout: "Logout",
    cart: "Cart",
    view: "View",
    add: "Add to Cart",
    customerService: "Customer Service",
    search: "Search",
    allCategories: "All categories",
    allBrands: "All brands",
    maxPrice: "Max price",
    apply: "Apply",
    clear: "Clear",
    noProducts: "No products found.",
    quantity: "Quantity",
    checkout: "Checkout",
    continueShopping: "Continue Shopping",
    orderPlaced: "Your order has been placed.",
    placeOrder: "Place Order",
    delivery: "Delivery",
    pickup: "Pickup",
    deliveryAddress: "Delivery address",
    pickupLocation: "Pickup location",
    customerName: "Full name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    status: "Status",
    total: "Total",
    fulfillment: "Fulfillment",
    details: "Details",
    signIn: "Sign in",
    createAccount: "Create account",
    remove: "Remove",
    summary: "Order Summary",
    items: "Items",
    backToCart: "Back to cart",
    backToOrders: "Back to My Orders",
    productDetails: "Product Details",
    shoppingCart: "Shopping Cart",
    myOrders: "My Orders",
    orderDetails: "Order Details",
    secureCheckout: "CHECKOUT",
    completeOrder: "Complete your order",
    shopCollection: "Shop Products",
    viewAll: "View all",
    featured: "Featured products",
    hereToHelp: "HERE TO HELP",
    curated: "SELECTED FOR YOU",
    collection: "MIMI LUXE",
    yourSelection: "YOUR SELECTION",
    account: "CUSTOMER ACCOUNT",
    orderLabel: "ORDER",
    welcomeBack: "Welcome back",
    loginDescription: "Sign in to manage your orders and complete checkout.",
    createYourAccount: "Create your account",
    registerDescription: "Create an account to keep your orders organised and make checkout easier.",
    newCustomer: "New to Mimi Luxe?",
    existingCustomer: "Already have an account?",
    passwordsNoMatch: "The passwords do not match.",
    accountCreated: "Account created successfully. You can now sign in.",
    loading: "Loading...",
    loadingProducts: "Loading products...",
    loadingOrder: "Loading order...",
    noOrder: "No order was selected.",
    noProduct: "No product was selected.",
    productNotFound: "Product not found.",
    currentlyUnavailable: "Currently unavailable",
    available: "available",
    productId: "Product ID",
    each: "each",
    orderSupport: "Order Support",
    deliveryPickup: "Delivery & Pickup",
    productQuestions: "Product Questions",
    supportText: "We are here to make your shopping experience simple.",
    orderSupportText: "Need help with an order? Sign in to view your order history and current status.",
    deliveryPickupText: "Choose delivery or pickup during checkout. The required location is checked before the order is created.",
    productQuestionsText: "Product information, availability and stock are shown directly from the catalogue.",
    footerDescription: "Beauty, fragrance and skincare products, with a simple way to browse, shop and manage your orders.",
    allRights: "All rights reserved.",
    support: "Support",
    accountNav: "Account",
    shopNav: "Shop",
    checkoutNav: "Checkout",
    products: "Products",
    menu: "Menu",
    language: "Language",
    productName: "Product name",
    loadingOrders: "Loading orders...",
    noOrders: "No orders yet",
    shopNow: "Shop now",
    continueShoppingText: "Continue shopping",
    trackOrders: "Track the orders placed from your account.",
    reviewCart: "Review your selected products before checkout.",
    searchCatalogue: "Search and filter the live product catalogue.",
    reviewOrder: "Review your order, items and current status.",
    deliveryHelp: "Choose delivery or pickup. The selected location is sent with your order.",
    footerCustomerService: "Customer Service",
    backToTop: "Back to top",
    heroTitle: "Beauty, fragrance and skincare for your everyday.",
    heroDescription: "Browse beauty, fragrance and skincare products selected for your routine.",
    featuredDescription: "Products loaded directly from the Mimi Luxe catalogue.",
    whyMimi: "WHY MIMI LUXE",
    trustTitle: "A simple way to browse products and manage your orders.",
    trustOne: "Products come directly from the live catalogue.",
    trustTwo: "Delivery and pickup are available at checkout.",
    trustThree: "Your customer orders stay connected to your account.",
    orderDate: "Order date",
};

/* Keep the existing language catalogue from the v2 package. */
const translations = {
    en: {...base},
    fr: {...base,home:"Accueil",shop:"Boutique",orders:"Mes commandes",login:"Connexion",register:"Créer un compte",logout:"Déconnexion",cart:"Panier",view:"Voir",add:"Ajouter au panier",customerService:"Service client",search:"Rechercher",allCategories:"Toutes les catégories",allBrands:"Toutes les marques",maxPrice:"Prix maximum",apply:"Appliquer",clear:"Effacer",noProducts:"Aucun produit trouvé.",quantity:"Quantité",checkout:"Paiement",continueShopping:"Continuer vos achats",orderPlaced:"Commande passée avec succès.",placeOrder:"Passer la commande",delivery:"Livraison",pickup:"Retrait",deliveryAddress:"Adresse de livraison",pickupLocation:"Lieu de retrait",customerName:"Nom complet",email:"E-mail",password:"Mot de passe",confirmPassword:"Confirmer le mot de passe",status:"Statut",total:"Total",fulfillment:"Livraison / retrait",details:"Détails",signIn:"Se connecter",createAccount:"Créer un compte",remove:"Supprimer",summary:"Résumé de la commande",items:"Articles",backToCart:"Retour au panier",backToOrders:"Retour à mes commandes",productDetails:"Détails du produit",shoppingCart:"Panier",myOrders:"Mes commandes",orderDetails:"Détails de la commande",secureCheckout:"PAIEMENT SÉCURISÉ",completeOrder:"Finalisez votre commande",shopCollection:"Découvrir la collection",viewAll:"Tout voir",featured:"Produits sélectionnés",hereToHelp:"BESOIN D'AIDE",curated:"SÉLECTION POUR VOUS",collection:"COLLECTION MIMI LUXE",yourSelection:"VOTRE SÉLECTION",account:"COMPTE CLIENT",orderLabel:"COMMANDE",welcomeBack:"Bon retour",loginDescription:"Connectez-vous pour gérer vos commandes et finaliser vos achats.",createYourAccount:"Créez votre compte",registerDescription:"Rejoignez Mimi Luxe pour organiser vos commandes et accélérer le paiement.",newCustomer:"Nouveau chez Mimi Luxe ?",existingCustomer:"Vous avez déjà un compte ?",passwordsNoMatch:"Les mots de passe ne correspondent pas.",accountCreated:"Compte créé avec succès. Vous pouvez maintenant vous connecter.",loading:"Chargement…",loadingProducts:"Chargement des produits…",loadingOrder:"Chargement de la commande…",noOrder:"Aucune commande sélectionnée.",noProduct:"Aucun produit sélectionné.",productNotFound:"Produit introuvable.",currentlyUnavailable:"Actuellement indisponible",available:"disponible(s)",productId:"ID produit",each:"l'unité",orderSupport:"Assistance commandes",deliveryPickup:"Livraison et retrait",productQuestions:"Questions sur les produits",supportText:"Nous sommes là pour rendre votre expérience d'achat simple.",orderSupportText:"Besoin d'aide ? Connectez-vous pour consulter votre historique et le statut de vos commandes.",deliveryPickupText:"Choisissez la livraison ou le retrait lors du paiement. L'emplacement requis doit être fourni avant la création de la commande.",productQuestionsText:"Consultez les détails et les informations du catalogue avant votre achat.",footerDescription:"Une boutique en ligne de beauté, parfums et soins de la peau pensée pour une expérience simple.",allRights:"Tous droits réservés.",support:"Assistance",accountNav:"Compte",shopNav:"Boutique",checkoutNav:"Paiement",products:"Produits",menu:"Menu",language:"Langue",productName:"Nom du produit",loadingOrders:"Chargement des commandes…",noOrders:"Aucune commande pour le moment",shopNow:"Acheter maintenant",continueShoppingText:"Continuer vos achats",trackOrders:"Suivez les commandes passées depuis votre compte.",reviewCart:"Vérifiez vos produits sélectionnés avant le paiement.",searchCatalogue:"Recherchez et filtrez le catalogue de produits en direct.",reviewOrder:"Consultez votre commande, ses articles et son statut actuel.",deliveryHelp:"Choisissez la livraison ou le retrait. Le serveur valide l'emplacement avant de créer la commande.",footerCustomerService:"Service client",backToTop:"Retour en haut"},
    es: {...base,home:"Inicio",shop:"Tienda",orders:"Mis pedidos",login:"Iniciar sesión",register:"Crear cuenta",logout:"Cerrar sesión",cart:"Carrito",view:"Ver",add:"Añadir al carrito",customerService:"Atención al cliente",search:"Buscar",allCategories:"Todas las categorías",allBrands:"Todas las marcas",maxPrice:"Precio máximo",apply:"Aplicar",clear:"Limpiar",noProducts:"No se encontraron productos.",quantity:"Cantidad",checkout:"Pago",continueShopping:"Seguir comprando",orderPlaced:"Pedido realizado correctamente.",placeOrder:"Realizar pedido",delivery:"Entrega",pickup:"Recogida",deliveryAddress:"Dirección de entrega",pickupLocation:"Lugar de recogida",customerName:"Nombre completo",email:"Correo electrónico",password:"Contraseña",confirmPassword:"Confirmar contraseña",status:"Estado",total:"Total",fulfillment:"Entrega / recogida",details:"Detalles",signIn:"Iniciar sesión",createAccount:"Crear cuenta",remove:"Eliminar",summary:"Resumen del pedido",items:"Artículos",backToCart:"Volver al carrito",backToOrders:"Volver a mis pedidos",productDetails:"Detalles del producto",shoppingCart:"Carrito de compra",myOrders:"Mis pedidos",orderDetails:"Detalles del pedido",secureCheckout:"PAGO SEGURO",completeOrder:"Completa tu pedido",shopCollection:"Explorar colección",viewAll:"Ver todo",featured:"Productos destacados",hereToHelp:"ESTAMOS PARA AYUDAR",curated:"SELECCIONADO PARA TI",collection:"COLECCIÓN MIMI LUXE",yourSelection:"TU SELECCIÓN",account:"CUENTA DEL CLIENTE",orderLabel:"PEDIDO",welcomeBack:"Bienvenido de nuevo",loginDescription:"Inicia sesión para gestionar tus pedidos y completar la compra.",createYourAccount:"Crea tu cuenta",registerDescription:"Únete a Mimi Luxe para organizar tus pedidos y agilizar el pago.",newCustomer:"¿Nuevo en Mimi Luxe?",existingCustomer:"¿Ya tienes una cuenta?",passwordsNoMatch:"Las contraseñas no coinciden.",accountCreated:"Cuenta creada correctamente. Ya puedes iniciar sesión.",loading:"Cargando…",loadingProducts:"Cargando productos…",loadingOrder:"Cargando pedido…",noOrder:"No se seleccionó ningún pedido.",noProduct:"No se seleccionó ningún producto.",productNotFound:"Producto no encontrado.",currentlyUnavailable:"No disponible actualmente",available:"disponible(s)",productId:"ID del producto",each:"cada uno",orderSupport:"Ayuda con pedidos",deliveryPickup:"Entrega y recogida",productQuestions:"Preguntas sobre productos",supportText:"Estamos aquí para que tu experiencia de compra sea sencilla.",footerDescription:"Una tienda online refinada para una experiencia sencilla y elegante.",allRights:"Todos los derechos reservados.",support:"Soporte",accountNav:"Cuenta",shopNav:"Tienda",checkoutNav:"Pago",products:"Productos",language:"Idioma",productName:"Nombre del producto",loadingOrders:"Cargando pedidos…",noOrders:"Aún no hay pedidos",shopNow:"Comprar ahora",continueShoppingText:"Seguir comprando",trackOrders:"Consulta los pedidos realizados desde tu cuenta.",reviewCart:"Revisa tus productos seleccionados antes del pago.",searchCatalogue:"Busca y filtra el catálogo de productos.",reviewOrder:"Revisa tu pedido, artículos y estado actual.",deliveryHelp:"Elige entrega o recogida. El servidor valida la ubicación antes de crear el pedido.",footerCustomerService:"Atención al cliente",backToTop:"Volver arriba"},
    de: {...base,home:"Startseite",shop:"Shop",orders:"Meine Bestellungen",login:"Anmelden",register:"Konto erstellen",logout:"Abmelden",cart:"Warenkorb",view:"Ansehen",add:"In den Warenkorb",customerService:"Kundenservice",search:"Suchen",allCategories:"Alle Kategorien",allBrands:"Alle Marken",maxPrice:"Maximalpreis",apply:"Anwenden",clear:"Löschen",noProducts:"Keine Produkte gefunden.",quantity:"Menge",checkout:"Kasse",continueShopping:"Weiter einkaufen",orderPlaced:"Bestellung erfolgreich aufgegeben.",placeOrder:"Bestellung aufgeben",delivery:"Lieferung",pickup:"Abholung",deliveryAddress:"Lieferadresse",pickupLocation:"Abholort",customerName:"Vollständiger Name",email:"E-Mail",password:"Passwort",confirmPassword:"Passwort bestätigen",status:"Status",total:"Gesamt",fulfillment:"Lieferung / Abholung",details:"Details",signIn:"Anmelden",createAccount:"Konto erstellen",remove:"Entfernen",summary:"Bestellübersicht",items:"Artikel",backToCart:"Zurück zum Warenkorb",backToOrders:"Zurück zu meinen Bestellungen",productDetails:"Produktdetails",shoppingCart:"Warenkorb",myOrders:"Meine Bestellungen",orderDetails:"Bestelldetails",secureCheckout:"SICHERE KASSE",completeOrder:"Bestellung abschließen",shopCollection:"Kollektion entdecken",viewAll:"Alle ansehen",featured:"Empfohlene Produkte",hereToHelp:"WIR HELFEN",curated:"FÜR SIE AUSGEWÄHLT",collection:"MIMI LUXE KOLLEKTION",yourSelection:"IHRE AUSWAHL",account:"KUNDENKONTO",orderLabel:"BESTELLUNG",welcomeBack:"Willkommen zurück",loginDescription:"Melden Sie sich an, um Bestellungen zu verwalten und den Einkauf abzuschließen.",createYourAccount:"Konto erstellen",registerDescription:"Werden Sie Teil von Mimi Luxe und verwalten Sie Bestellungen einfacher.",newCustomer:"Neu bei Mimi Luxe?",existingCustomer:"Sie haben bereits ein Konto?",passwordsNoMatch:"Die Passwörter stimmen nicht überein.",accountCreated:"Konto erfolgreich erstellt. Sie können sich jetzt anmelden.",loading:"Laden…",loadingProducts:"Produkte werden geladen…",loadingOrder:"Bestellung wird geladen…",noOrder:"Keine Bestellung ausgewählt.",noProduct:"Kein Produkt ausgewählt.",productNotFound:"Produkt nicht gefunden.",currentlyUnavailable:"Derzeit nicht verfügbar",available:"verfügbar",productId:"Produkt-ID",each:"pro Stück",orderSupport:"Bestellhilfe",deliveryPickup:"Lieferung & Abholung",productQuestions:"Produktfragen",supportText:"Wir möchten Ihr Einkaufserlebnis einfach gestalten.",footerDescription:"Ein eleganter Online-Shop für ein einfaches, hochwertiges Einkaufserlebnis.",allRights:"Alle Rechte vorbehalten.",support:"Support",accountNav:"Konto",shopNav:"Shop",checkoutNav:"Kasse",products:"Produkte",language:"Sprache",productName:"Produktname",loadingOrders:"Bestellungen werden geladen…",noOrders:"Noch keine Bestellungen",shopNow:"Jetzt einkaufen",continueShoppingText:"Weiter einkaufen",trackOrders:"Verfolgen Sie die Bestellungen Ihres Kontos.",reviewCart:"Prüfen Sie Ihre Auswahl vor dem Bezahlen.",searchCatalogue:"Durchsuchen und filtern Sie den Produktkatalog.",reviewOrder:"Prüfen Sie Bestellung, Artikel und aktuellen Status.",deliveryHelp:"Wählen Sie Lieferung oder Abholung. Der Server prüft den Ort vor der Erstellung.",footerCustomerService:"Kundenservice",backToTop:"Nach oben"},
    pt: {...base,home:"Início",shop:"Loja",orders:"Meus pedidos",login:"Entrar",register:"Criar conta",logout:"Sair",cart:"Carrinho",view:"Ver",add:"Adicionar ao carrinho",customerService:"Atendimento",search:"Pesquisar",allCategories:"Todas as categorias",allBrands:"Todas as marcas",maxPrice:"Preço máximo",apply:"Aplicar",clear:"Limpar",noProducts:"Nenhum produto encontrado.",quantity:"Quantidade",checkout:"Finalizar compra",continueShopping:"Continuar comprando",orderPlaced:"Pedido realizado com sucesso.",placeOrder:"Fazer pedido",delivery:"Entrega",pickup:"Retirada",deliveryAddress:"Endereço de entrega",pickupLocation:"Local de retirada",customerName:"Nome completo",email:"E-mail",password:"Senha",confirmPassword:"Confirmar senha",status:"Estado",total:"Total",fulfillment:"Entrega / retirada",details:"Detalhes",signIn:"Entrar",createAccount:"Criar conta",remove:"Remover",summary:"Resumo do pedido",items:"Itens",backToCart:"Voltar ao carrinho",backToOrders:"Voltar aos meus pedidos",productDetails:"Detalhes do produto",shoppingCart:"Carrinho de compras",myOrders:"Meus pedidos",orderDetails:"Detalhes do pedido",secureCheckout:"CHECKOUT SEGURO",completeOrder:"Conclua seu pedido",shopCollection:"Explorar coleção",viewAll:"Ver tudo",featured:"Produtos em destaque",hereToHelp:"ESTAMOS AQUI PARA AJUDAR",curated:"SELECIONADO PARA VOCÊ",collection:"COLEÇÃO MIMI LUXE",yourSelection:"SUA SELEÇÃO",account:"CONTA DO CLIENTE",orderLabel:"PEDIDO",welcomeBack:"Bem-vindo de volta",loginDescription:"Entre para gerenciar seus pedidos e concluir a compra.",createYourAccount:"Crie sua conta",registerDescription:"Junte-se à Mimi Luxe para organizar pedidos e agilizar o checkout.",newCustomer:"Novo na Mimi Luxe?",existingCustomer:"Já tem uma conta?",passwordsNoMatch:"As senhas não coincidem.",accountCreated:"Conta criada com sucesso. Agora você pode entrar.",loading:"Carregando…",loadingProducts:"Carregando produtos…",loadingOrder:"Carregando pedido…",noOrder:"Nenhum pedido selecionado.",noProduct:"Nenhum produto selecionado.",productNotFound:"Produto não encontrado.",currentlyUnavailable:"Indisponível no momento",available:"disponível(is)",productId:"ID do produto",each:"cada",orderSupport:"Suporte de pedidos",deliveryPickup:"Entrega e retirada",productQuestions:"Dúvidas sobre produtos",supportText:"Estamos aqui para tornar sua experiência de compra simples.",footerDescription:"Uma loja online refinada para uma experiência simples e elegante.",allRights:"Todos os direitos reservados.",support:"Suporte",accountNav:"Conta",shopNav:"Loja",checkoutNav:"Checkout",products:"Produtos",language:"Idioma",productName:"Nome do produto",loadingOrders:"Carregando pedidos…",noOrders:"Ainda não há pedidos",shopNow:"Comprar agora",continueShoppingText:"Continuar comprando",trackOrders:"Acompanhe os pedidos feitos pela sua conta.",reviewCart:"Revise os produtos selecionados antes do checkout.",searchCatalogue:"Pesquise e filtre o catálogo de produtos.",reviewOrder:"Revise seu pedido, itens e status atual.",deliveryHelp:"Escolha entrega ou retirada. O servidor valida o local antes de criar o pedido.",footerCustomerService:"Atendimento ao cliente",backToTop:"Voltar ao topo"},
    it: {...base,home:"Home",shop:"Negozio",orders:"I miei ordini",login:"Accedi",register:"Crea account",logout:"Esci",cart:"Carrello",view:"Vedi",add:"Aggiungi al carrello",customerService:"Servizio clienti",search:"Cerca",allCategories:"Tutte le categorie",allBrands:"Tutti i marchi",maxPrice:"Prezzo massimo",apply:"Applica",clear:"Cancella",noProducts:"Nessun prodotto trovato.",quantity:"Quantità",checkout:"Checkout",continueShopping:"Continua gli acquisti",orderPlaced:"Ordine effettuato con successo.",placeOrder:"Effettua ordine",delivery:"Consegna",pickup:"Ritiro",deliveryAddress:"Indirizzo di consegna",pickupLocation:"Luogo di ritiro",customerName:"Nome completo",email:"Email",password:"Password",confirmPassword:"Conferma password",status:"Stato",total:"Totale",fulfillment:"Consegna / ritiro",details:"Dettagli",signIn:"Accedi",createAccount:"Crea account",remove:"Rimuovi",summary:"Riepilogo ordine",items:"Articoli",backToCart:"Torna al carrello",backToOrders:"Torna ai miei ordini",productDetails:"Dettagli prodotto",shoppingCart:"Carrello",myOrders:"I miei ordini",orderDetails:"Dettagli ordine",secureCheckout:"CHECKOUT SICURO",completeOrder:"Completa il tuo ordine",shopCollection:"Esplora la collezione",viewAll:"Vedi tutto",featured:"Prodotti in evidenza",hereToHelp:"SIAMO QUI PER AIUTARTI",curated:"SCELTO PER TE",collection:"COLLEZIONE MIMI LUXE",yourSelection:"LA TUA SELEZIONE",account:"ACCOUNT CLIENTE",orderLabel:"ORDINE",welcomeBack:"Bentornato",loginDescription:"Accedi per gestire i tuoi ordini e completare il checkout.",createYourAccount:"Crea il tuo account",registerDescription:"Unisciti a Mimi Luxe per organizzare gli ordini e rendere il checkout più veloce.",newCustomer:"Nuovo su Mimi Luxe?",existingCustomer:"Hai già un account?",passwordsNoMatch:"Le password non coincidono.",accountCreated:"Account creato con successo. Ora puoi accedere.",loading:"Caricamento…",loadingProducts:"Caricamento prodotti…",loadingOrder:"Caricamento ordine…",noOrder:"Nessun ordine selezionato.",noProduct:"Nessun prodotto selezionato.",productNotFound:"Prodotto non trovato.",currentlyUnavailable:"Attualmente non disponibile",available:"disponibile/i",productId:"ID prodotto",each:"ciascuno",orderSupport:"Supporto ordini",deliveryPickup:"Consegna e ritiro",productQuestions:"Domande sui prodotti",supportText:"Siamo qui per rendere semplice la tua esperienza di acquisto.",footerDescription:"Un negozio online raffinato per un'esperienza semplice ed elegante.",allRights:"Tutti i diritti riservati.",support:"Supporto",accountNav:"Account",shopNav:"Negozio",checkoutNav:"Checkout",products:"Prodotti",language:"Lingua",productName:"Nome prodotto",loadingOrders:"Caricamento ordini…",noOrders:"Nessun ordine ancora",shopNow:"Acquista ora",continueShoppingText:"Continua gli acquisti",trackOrders:"Segui gli ordini effettuati dal tuo account.",reviewCart:"Controlla i prodotti selezionati prima del checkout.",searchCatalogue:"Cerca e filtra il catalogo prodotti.",reviewOrder:"Controlla ordine, articoli e stato attuale.",deliveryHelp:"Scegli consegna o ritiro. Il server verifica il luogo prima di creare l'ordine.",footerCustomerService:"Servizio clienti",backToTop:"Torna su"},
    ar: {...base,home:"الرئيسية",shop:"المتجر",orders:"طلباتي",login:"تسجيل الدخول",register:"إنشاء حساب",logout:"تسجيل الخروج",cart:"السلة",view:"عرض",add:"أضف إلى السلة",customerService:"خدمة العملاء",search:"بحث",allCategories:"كل الفئات",allBrands:"كل العلامات",maxPrice:"أقصى سعر",apply:"تطبيق",clear:"مسح",noProducts:"لم يتم العثور على منتجات.",quantity:"الكمية",checkout:"الدفع",continueShopping:"متابعة التسوق",orderPlaced:"تم إنشاء الطلب بنجاح.",placeOrder:"إتمام الطلب",delivery:"توصيل",pickup:"استلام",deliveryAddress:"عنوان التوصيل",pickupLocation:"موقع الاستلام",customerName:"الاسم الكامل",email:"البريد الإلكتروني",password:"كلمة المرور",confirmPassword:"تأكيد كلمة المرور",status:"الحالة",total:"الإجمالي",fulfillment:"التوصيل / الاستلام",details:"التفاصيل",signIn:"تسجيل الدخول",createAccount:"إنشاء حساب",remove:"إزالة",summary:"ملخص الطلب",items:"العناصر",backToCart:"العودة إلى السلة",backToOrders:"العودة إلى طلباتي",productDetails:"تفاصيل المنتج",shoppingCart:"سلة التسوق",myOrders:"طلباتي",orderDetails:"تفاصيل الطلب",secureCheckout:"دفع آمن",completeOrder:"أكمل طلبك",shopCollection:"استكشف المجموعة",viewAll:"عرض الكل",featured:"منتجات مختارة",hereToHelp:"نحن هنا لمساعدتك",curated:"مختار لك",collection:"مجموعة ميمي لوكس",yourSelection:"اختيارك",account:"حساب العميل",orderLabel:"الطلب",welcomeBack:"مرحبًا بعودتك",loginDescription:"سجل الدخول لإدارة طلباتك وإكمال الشراء.",createYourAccount:"أنشئ حسابك",registerDescription:"انضم إلى ميمي لوكس لتنظيم طلباتك وتسريع عملية الدفع.",newCustomer:"جديد على ميمي لوكس؟",existingCustomer:"لديك حساب بالفعل؟",passwordsNoMatch:"كلمتا المرور غير متطابقتين.",accountCreated:"تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن.",loading:"جارٍ التحميل…",loadingProducts:"جارٍ تحميل المنتجات…",loadingOrder:"جارٍ تحميل الطلب…",noOrder:"لم يتم اختيار طلب.",noProduct:"لم يتم اختيار منتج.",productNotFound:"المنتج غير موجود.",currentlyUnavailable:"غير متوفر حاليًا",available:"متوفر",productId:"معرّف المنتج",each:"للوحدة",orderSupport:"دعم الطلبات",deliveryPickup:"التوصيل والاستلام",productQuestions:"أسئلة المنتجات",supportText:"نحن هنا لجعل تجربة التسوق بسيطة.",footerDescription:"متجر إلكتروني راقٍ لتجربة تسوق بسيطة وأنيقة.",allRights:"جميع الحقوق محفوظة.",support:"الدعم",accountNav:"الحساب",shopNav:"المتجر",checkoutNav:"الدفع",products:"المنتجات",language:"اللغة",productName:"اسم المنتج",loadingOrders:"جارٍ تحميل الطلبات…",noOrders:"لا توجد طلبات بعد",shopNow:"تسوق الآن",continueShoppingText:"متابعة التسوق",trackOrders:"تابع الطلبات التي أنشأتها من حسابك.",reviewCart:"راجع المنتجات المختارة قبل الدفع.",searchCatalogue:"ابحث وفلتر كتالوج المنتجات.",reviewOrder:"راجع طلبك وعناصره وحالته الحالية.",deliveryHelp:"اختر التوصيل أو الاستلام. يتحقق الخادم من الموقع قبل إنشاء الطلب.",footerCustomerService:"خدمة العملاء",backToTop:"العودة للأعلى"}
};

/* The full language names are intentionally kept broad. */
const languageNames = {
    en: "English",
    fr: "Français",
    es: "Español",
    de: "Deutsch",
    pt: "Português",
    it: "Italiano",
    ar: "العربية",
    zh: "中文",
    ja: "日本語",
    ko: "한국어",
    hi: "हिन्दी",
    tr: "Türkçe",
    nl: "Nederlands",
    ru: "Русский",
    sw: "Kiswahili",
    yo: "Yorùbá",
    ig: "Igbo",
    ha: "Hausa",
    am: "አማርኛ",
    bn: "বাংলা",
    id: "Bahasa Indonesia",
    ms: "Bahasa Melayu",
    vi: "Tiếng Việt",
    th: "ไทย",
    pl: "Polski",
    uk: "Українська",
    el: "Ελληνικά",
    he: "עברית",
    fa: "فارسی",
    ro: "Română",
    cs: "Čeština",
    hu: "Magyar",
    sv: "Svenska",
    no: "Norsk",
    da: "Dansk",
    fi: "Suomi"
};

const extraTranslations = {
    fr:{heroTitle:"Beauté, parfums et soins de la peau pour votre quotidien.",heroDescription:"Découvrez des produits de beauté, parfums et soins de la peau sélectionnés avec soin pour votre routine quotidienne.",featuredDescription:"Produits récemment chargés depuis notre catalogue en direct.",whyMimi:"POURQUOI MIMI LUXE",trustTitle:"Une expérience soignée du catalogue jusqu'à la commande.",trustOne:"Catalogue en direct connecté à votre boutique.",trustTwo:"Paiement simple avec livraison ou retrait et validation du stock.",trustThree:"Commandes clients protégées par la connexion au compte.",footerDescription:"Une boutique en ligne de beauté, parfums et soins de la peau pensée pour une expérience simple."},
    es:{heroTitle:"Belleza, fragancias y cuidado de la piel para tu día a día.",heroDescription:"Descubre productos de belleza, fragancias y cuidado de la piel seleccionados para tu rutina diaria.",featuredDescription:"Productos recién cargados desde nuestro catálogo en vivo.",whyMimi:"POR QUÉ MIMI LUXE",trustTitle:"Una experiencia cuidada desde el catálogo hasta el pedido.",trustOne:"Catálogo en vivo conectado directamente con tu tienda.",trustTwo:"Pago sencillo con entrega o recogida y validación de stock.",trustThree:"Pedidos privados protegidos por tu cuenta de cliente."},
    de:{heroTitle:"Beauty, Düfte und Hautpflege für Ihren Alltag.",heroDescription:"Entdecken Sie sorgfältig ausgewählte Beauty-, Duft- und Hautpflegeprodukte für Ihre tägliche Routine.",featuredDescription:"Neu aus unserem Live-Katalog geladen.",whyMimi:"WARUM MIMI LUXE",trustTitle:"Ein hochwertiges Einkaufserlebnis vom Katalog bis zur Bestellung.",trustOne:"Live-Katalog direkt mit Ihrem Shop verbunden.",trustTwo:"Einfacher Checkout mit Lieferung oder Abholung und Bestandsprüfung.",trustThree:"Kundenbestellungen sind durch Ihr Konto geschützt."},
    pt:{heroTitle:"Beleza, fragrâncias e cuidados para o seu dia a dia.",heroDescription:"Descubra produtos de beleza, fragrâncias e cuidados para a pele selecionados para a sua rotina.",featuredDescription:"Produtos carregados recentemente do nosso catálogo ao vivo.",whyMimi:"POR QUE MIMI LUXE",trustTitle:"Uma experiência elegante do catálogo ao pedido.",trustOne:"Catálogo ao vivo conectado diretamente à sua loja.",trustTwo:"Checkout simples com entrega ou retirada e validação de estoque.",trustThree:"Pedidos protegidos pelo login da conta do cliente."},
    it:{heroTitle:"Bellezza, fragranze e skincare per ogni giorno.",heroDescription:"Scopri prodotti di bellezza, fragranze e skincare selezionati con cura per la tua routine quotidiana.",featuredDescription:"Prodotti caricati di recente dal nostro catalogo live.",whyMimi:"PERCHÉ MIMI LUXE",trustTitle:"Un'esperienza curata dal catalogo all'ordine.",trustOne:"Catalogo live collegato direttamente al tuo negozio.",trustTwo:"Checkout semplice con consegna o ritiro e verifica dello stock.",trustThree:"Ordini protetti dall'accesso del cliente."},
    ar:{heroTitle:"منتجات الجمال والعطور والعناية بالبشرة ليومك.",heroDescription:"اكتشف منتجات مختارة من الجمال والعطور والعناية بالبشرة لروتينك اليومي.",featuredDescription:"منتجات مضافة حديثًا من الكتالوج المباشر.",whyMimi:"لماذا ميمي لوكس",trustTitle:"تجربة تسوق راقية من الكتالوج إلى الطلب.",trustOne:"كتالوج مباشر متصل بمتجرك.",trustTwo:"دفع بسيط مع التوصيل أو الاستلام والتحقق من المخزون.",trustThree:"طلبات العملاء محمية بتسجيل الدخول."}
};
Object.entries(extraTranslations).forEach(([lang, values])=>Object.assign(translations[lang],values));

const defaultExtras = {heroTitle:"Beauty, fragrance and skincare selected for your everyday.",heroDescription:"Discover beauty, fragrance and skincare products selected with care for your everyday routine and personal style.",featuredDescription:"Freshly loaded from our live catalogue.",whyMimi:"WHY MIMI LUXE",trustTitle:"A polished shopping experience from catalogue to order.",trustOne:"Live catalogue connected directly to your store backend.",trustTwo:"Simple delivery or pickup checkout with stock validation.",trustThree:"Private customer orders protected by your customer login."};
Object.assign(base,defaultExtras,extraTranslations.en||{}); Object.assign(translations.en,defaultExtras,extraTranslations.en||{});

Object.keys(languageNames).forEach(lang=>{ if(!translations[lang]) translations[lang]={...base}; });

Object.assign(translations.zh,{home:"首页",shop:"商店",orders:"我的订单",login:"登录",register:"创建账户",logout:"退出登录",cart:"购物车",view:"查看",add:"加入购物车",customerService:"客户服务",search:"搜索",allCategories:"所有类别",allBrands:"所有品牌",maxPrice:"最高价格",apply:"应用",clear:"清除",noProducts:"未找到产品。",quantity:"数量",checkout:"结账",continueShopping:"继续购物",placeOrder:"提交订单",delivery:"配送",pickup:"自取",deliveryAddress:"配送地址",pickupLocation:"自取地点",customerName:"姓名",email:"邮箱",password:"密码",confirmPassword:"确认密码",status:"状态",total:"总计",fulfillment:"配送方式",details:"详情",signIn:"登录",createAccount:"创建账户",remove:"删除",summary:"订单摘要",items:"商品",productDetails:"产品详情",shoppingCart:"购物车",myOrders:"我的订单",orderDetails:"订单详情",welcomeBack:"欢迎回来",completeOrder:"完成订单",shopCollection:"探索系列",viewAll:"查看全部",featured:"精选产品",orderLabel:"订单",language:"语言",products:"产品",support:"支持",backToTop:"返回顶部"});
Object.assign(translations.ja,{home:"ホーム",shop:"ショップ",orders:"注文履歴",login:"ログイン",register:"アカウント作成",logout:"ログアウト",cart:"カート",view:"見る",add:"カートに追加",customerService:"カスタマーサービス",search:"検索",allCategories:"すべてのカテゴリー",allBrands:"すべてのブランド",maxPrice:"最高価格",apply:"適用",clear:"クリア",noProducts:"商品が見つかりません。",quantity:"数量",checkout:"チェックアウト",continueShopping:"買い物を続ける",placeOrder:"注文する",delivery:"配送",pickup:"受け取り",deliveryAddress:"配送先住所",pickupLocation:"受け取り場所",customerName:"氏名",email:"メール",password:"パスワード",confirmPassword:"パスワード確認",status:"ステータス",total:"合計",fulfillment:"受け取り方法",details:"詳細",signIn:"ログイン",createAccount:"アカウント作成",remove:"削除",summary:"注文概要",items:"商品",productDetails:"商品詳細",shoppingCart:"ショッピングカート",myOrders:"注文履歴",orderDetails:"注文詳細",welcomeBack:"おかえりなさい",completeOrder:"注文を完了",shopCollection:"コレクションを見る",viewAll:"すべて見る",featured:"おすすめ商品",orderLabel:"注文",language:"言語",products:"商品",support:"サポート",backToTop:"トップへ戻る"});
Object.assign(translations.ko,{home:"홈",shop:"쇼핑",orders:"내 주문",login:"로그인",register:"계정 만들기",logout:"로그아웃",cart:"장바구니",view:"보기",add:"장바구니에 담기",customerService:"고객 서비스",search:"검색",allCategories:"모든 카테고리",allBrands:"모든 브랜드",maxPrice:"최대 가격",apply:"적용",clear:"지우기",noProducts:"상품을 찾을 수 없습니다.",quantity:"수량",checkout:"결제",continueShopping:"쇼핑 계속하기",placeOrder:"주문하기",delivery:"배송",pickup:"픽업",deliveryAddress:"배송 주소",pickupLocation:"픽업 장소",customerName:"이름",email:"이메일",password:"비밀번호",confirmPassword:"비밀번호 확인",status:"상태",total:"합계",fulfillment:"수령 방법",details:"상세",signIn:"로그인",createAccount:"계정 만들기",remove:"삭제",summary:"주문 요약",items:"상품",productDetails:"상품 상세",shoppingCart:"장바구니",myOrders:"내 주문",orderDetails:"주문 상세",welcomeBack:"다시 오신 것을 환영합니다",completeOrder:"주문 완료",shopCollection:"컬렉션 보기",viewAll:"전체 보기",featured:"추천 상품",orderLabel:"주문",language:"언어",products:"상품",support:"고객지원",backToTop:"맨 위로"});
Object.assign(translations.hi,{home:"होम",shop:"शॉप",orders:"मेरे ऑर्डर",login:"लॉग इन",register:"खाता बनाएं",logout:"लॉग आउट",cart:"कार्ट",view:"देखें",add:"कार्ट में जोड़ें",customerService:"ग्राहक सेवा",search:"खोजें",allCategories:"सभी श्रेणियां",allBrands:"सभी ब्रांड",maxPrice:"अधिकतम कीमत",apply:"लागू करें",clear:"साफ़ करें",noProducts:"कोई उत्पाद नहीं मिला।",quantity:"मात्रा",checkout:"चेकआउट",continueShopping:"खरीदारी जारी रखें",placeOrder:"ऑर्डर करें",delivery:"डिलीवरी",pickup:"पिकअप",deliveryAddress:"डिलीवरी पता",pickupLocation:"पिकअप स्थान",customerName:"पूरा नाम",email:"ईमेल",password:"पासवर्ड",confirmPassword:"पासवर्ड की पुष्टि",status:"स्थिति",total:"कुल",fulfillment:"प्राप्ति का तरीका",details:"विवरण",signIn:"साइन इन",createAccount:"खाता बनाएं",remove:"हटाएं",summary:"ऑर्डर सारांश",items:"आइटम",productDetails:"उत्पाद विवरण",shoppingCart:"शॉपिंग कार्ट",myOrders:"मेरे ऑर्डर",orderDetails:"ऑर्डर विवरण",welcomeBack:"वापसी पर स्वागत है",completeOrder:"ऑर्डर पूरा करें",shopCollection:"कलेक्शन देखें",viewAll:"सभी देखें",featured:"चुनिंदा उत्पाद",orderLabel:"ऑर्डर",language:"भाषा",products:"उत्पाद",support:"सहायता",backToTop:"ऊपर जाएं"});
Object.assign(translations.tr,{home:"Ana Sayfa",shop:"Mağaza",orders:"Siparişlerim",login:"Giriş",register:"Hesap Oluştur",logout:"Çıkış",cart:"Sepet",view:"Görüntüle",add:"Sepete Ekle",customerService:"Müşteri Hizmetleri",search:"Ara",allCategories:"Tüm kategoriler",allBrands:"Tüm markalar",maxPrice:"Maksimum fiyat",apply:"Uygula",clear:"Temizle",noProducts:"Ürün bulunamadı.",quantity:"Miktar",checkout:"Ödeme",continueShopping:"Alışverişe devam et",placeOrder:"Sipariş ver",delivery:"Teslimat",pickup:"Teslim alma",deliveryAddress:"Teslimat adresi",pickupLocation:"Teslim alma yeri",customerName:"Ad soyad",email:"E-posta",password:"Şifre",confirmPassword:"Şifreyi onayla",status:"Durum",total:"Toplam",fulfillment:"Teslim yöntemi",details:"Detaylar",signIn:"Giriş yap",createAccount:"Hesap oluştur",remove:"Kaldır",summary:"Sipariş özeti",items:"Ürünler",productDetails:"Ürün detayları",shoppingCart:"Alışveriş sepeti",myOrders:"Siparişlerim",orderDetails:"Sipariş detayları",welcomeBack:"Tekrar hoş geldiniz",completeOrder:"Siparişi tamamla",shopCollection:"Koleksiyonu keşfet",viewAll:"Tümünü gör",featured:"Öne çıkan ürünler",orderLabel:"SİPARİŞ",language:"Dil",products:"Ürünler",support:"Destek",backToTop:"Yukarı dön"});
Object.assign(translations.sw,{home:"Nyumbani",shop:"Duka",orders:"Maagizo Yangu",login:"Ingia",register:"Fungua Akaunti",logout:"Toka",cart:"Kikapu",view:"Tazama",add:"Ongeza kwenye kikapu",customerService:"Huduma kwa Wateja",search:"Tafuta",allCategories:"Kategoria zote",allBrands:"Chapa zote",maxPrice:"Bei ya juu",apply:"Tumia",clear:"Futa",noProducts:"Hakuna bidhaa zilizopatikana.",quantity:"Kiasi",checkout:"Malipo",continueShopping:"Endelea kununua",placeOrder:"Weka oda",delivery:"Uwasilishaji",pickup:"Kuchukua",deliveryAddress:"Anwani ya uwasilishaji",pickupLocation:"Mahali pa kuchukua",customerName:"Jina kamili",email:"Barua pepe",password:"Nenosiri",confirmPassword:"Thibitisha nenosiri",status:"Hali",total:"Jumla",fulfillment:"Njia ya kupokea",details:"Maelezo",signIn:"Ingia",createAccount:"Fungua akaunti",remove:"Ondoa",summary:"Muhtasari wa oda",items:"Bidhaa",productDetails:"Maelezo ya bidhaa",shoppingCart:"Kikapu cha ununuzi",myOrders:"Maagizo yangu",orderDetails:"Maelezo ya oda",welcomeBack:"Karibu tena",completeOrder:"Kamilisha oda",shopCollection:"Gundua mkusanyiko",viewAll:"Tazama zote",featured:"Bidhaa zilizochaguliwa",orderLabel:"ODA",language:"Lugha",products:"Bidhaa",support:"Msaada",backToTop:"Rudi juu"});

function currentLanguage() {
    return localStorage.getItem(LANGUAGE_KEY) || "en";
}

function t(key) {
    const language = currentLanguage();
    return (
        translations[language]?.[key] ||
        base[key] ||
        key
    );
}

function setLanguage(language) {
    if (!languageNames[language]) {
        language = "en";
    }

    localStorage.setItem(LANGUAGE_KEY, language);

    document.documentElement.lang = language;
    document.documentElement.dir = ["ar", "fa", "he"].includes(language)
        ? "rtl"
        : "ltr";

    document.querySelectorAll("[data-i18n]").forEach(element => {
        element.textContent = t(element.dataset.i18n);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
        element.placeholder = t(element.dataset.i18nPlaceholder);
    });

    const select = document.getElementById("language-select");
    if (select) {
        select.value = language;
    }
}

function initLanguage() {
    const select = document.getElementById("language-select");

    if (!select) {
        return;
    }

    select.innerHTML = Object.entries(languageNames)
        .map(([code, name]) => `<option value="${code}">${name}</option>`)
        .join("");

    select.value = currentLanguage();

    select.addEventListener("change", () => {
        setLanguage(select.value);
    });

    setLanguage(currentLanguage());
}

/* =========================================================
   NAVIGATION + MOBILE DRAWER
   ---------------------------------------------------------
   Desktop: normal navigation.
   Mobile: navigation slides in from the RIGHT.
   ========================================================= */

function updateNavAuth() {
    const loggedIn = Boolean(getCustomerToken());

    document.querySelectorAll("[data-auth='logged-in']").forEach(element => {
        element.classList.toggle("hidden", !loggedIn);
    });

    document.querySelectorAll("[data-auth='logged-out']").forEach(element => {
        element.classList.toggle("hidden", loggedIn);
    });

    document.querySelectorAll("[data-action='logout']").forEach(element => {
        element.onclick = event => {
            event.preventDefault();
            logoutCustomer();
        };
    });
}

function initNav() {
    const toggle = document.getElementById("menu-toggle");
    const nav = document.getElementById("nav-links");

    if (toggle && nav) {
        let backdrop = document.getElementById("mobile-nav-backdrop");

        if (!backdrop) {
            backdrop = document.createElement("div");
            backdrop.id = "mobile-nav-backdrop";
            backdrop.className = "mobile-nav-backdrop";
            document.body.appendChild(backdrop);
        }

        let closeButton = nav.querySelector(".mobile-nav-close");

        if (!closeButton) {
            closeButton = document.createElement("button");
            closeButton.type = "button";
            closeButton.className = "mobile-nav-close";
            closeButton.setAttribute("aria-label", "Close menu");
            closeButton.innerHTML = "&times;";
            nav.prepend(closeButton);
        }

        const closeMenu = () => {
            nav.classList.remove("open");
            backdrop.classList.remove("open");
            document.body.classList.remove("nav-open");
            toggle.setAttribute("aria-expanded", "false");
        };

        const openMenu = () => {
            nav.classList.add("open");
            backdrop.classList.add("open");
            document.body.classList.add("nav-open");
            toggle.setAttribute("aria-expanded", "true");
        };

        toggle.setAttribute("aria-expanded", "false");
        toggle.onclick = () => {
            if (nav.classList.contains("open")) {
                closeMenu();
            } else {
                openMenu();
            }
        };

        closeButton.onclick = closeMenu;
        backdrop.onclick = closeMenu;

        nav.querySelectorAll("a").forEach(link => {
            link.onclick = event => {
                const action = link.dataset.action;
                const href = link.getAttribute("href");

                // Leave logout to updateNavAuth(), which owns the logout flow.
                if (action === "logout") {
                    return;
                }

                if (!href || href === "#") {
                    return;
                }

                // Mobile drawer links must navigate explicitly after the drawer
                // closes. This avoids the drawer transition swallowing the
                // browser's normal anchor navigation on mobile.
                event.preventDefault();
                event.stopPropagation();

                const destination = new URL(href, document.baseURI).href;
                closeMenu();

                window.setTimeout(() => {
                    window.location.assign(destination);
                }, 0);
            };
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeMenu();
            }
        });
    }

    updateCartCount();
    updateNavAuth();
    initLanguage();
}

/* =========================================================
   SHARED FOOTER
   ========================================================= */

function renderCustomerFooter() {
    const footer = document.getElementById("customer-footer");

    if (!footer) {
        return;
    }

    footer.innerHTML = `
        <div class="container">
            <div class="footer-grid">
                <div>
                    <h3>Mimi Luxe</h3>
                    <p data-i18n="footerDescription">
                        ${escapeHtml(t("footerDescription"))}
                    </p>
                </div>

                <div>
                    <h4 data-i18n="shopNav">Shop</h4>
                    <a href="products.html" data-i18n="products">Products</a>
                    <a href="cart.html" data-i18n="cart">Cart</a>
                    <a href="orders.html" data-auth="logged-in" data-i18n="orders">My Orders</a>
                </div>

                <div>
                    <h4 data-i18n="accountNav">Account</h4>
                    <a href="login.html" data-auth="logged-out" data-i18n="login">Login</a>
                    <a href="register.html" data-auth="logged-out" data-i18n="register">Create Account</a>
                    <a href="orders.html" data-auth="logged-in" data-i18n="orders">My Orders</a>
                </div>

                <div>
                    <h4 data-i18n="support">Support</h4>
                    <a href="index.html#service" data-i18n="footerCustomerService">Customer Service</a>
                    <a href="checkout.html" data-i18n="checkoutNav">Checkout</a>
                    <a href="#top" data-i18n="backToTop">Back to top</a>
                </div>
            </div>

            <div class="footer-bottom">
                <span>© 2026 Mimi Luxe. </span>
                <span data-i18n="allRights">All rights reserved.</span>
            </div>
        </div>
    `;

    updateNavAuth();
    setLanguage(currentLanguage());
}

/* =========================================================
   PAGE INITIALISATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initNav();
    renderCustomerFooter();
    updateCartCount();
});
