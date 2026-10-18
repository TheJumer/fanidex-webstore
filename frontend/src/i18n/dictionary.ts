// Typed i18n dictionary for the storefront + admin dashboard.
// Two languages only: English (en) and Ukrainian (ua).
// Every static UI string lives here so the whole app can be translated at runtime.

export type Lang = 'en' | 'ua'

export interface Dict {
  // ---- Top bar ----
  copy: string
  discord: string
  login: string
  logout: string
  serverIpCopied: string
  copyFailed: string
  // ---- Navigation / store ----
  navigation: string
  home: string
  allPackages: string
  allPackagesDesc: string
  topCustomer: string
  noDonations: string
  loadingPackages: string
  noProducts: string
  // ---- Product card / modal ----
  buy: string
  view: string
  info: string
  buyNow: string
  selectDuration: string
  addedToCart: string
  // ---- Cart ----
  yourCart: string
  cartEmpty: string
  promoCode: string
  apply: string
  subtotal: string
  discount: string
  total: string
  checkout: string
  processing: string
  pricesFinalized: string
  promoApplied: string
  invalidCode: string
  couldNotValidate: string
  setUsernameFirst: string
  checkoutFailed: string
  // ---- Username modal ----
  enterUsername: string
  usernameDeliverNote: string
  confirm: string
  checking: string
  usernameRules: string
  invalidUsername: string
  playingAs: string
  // ---- Checkout success ----
  paymentSuccess: string
  paymentSuccessDesc: string
  orderReference: string
  backToStore: string
  // ---- Footer ----
  footerDisclaimer: string
  allRightsReserved: string
  legal: string
  termsOfService: string
  privacyPolicy: string
  refundPolicy: string
  acceptedPayments: string
  quickLinks: string
  close: string
  // ---- Admin common ----
  save: string
  saving: string
  create: string
  creating: string
  add: string
  adding: string
  delete: string
  deleting: string
  cancel: string
  edit: string
  loading: string
  savedSuccessfully: string
  saveFailed: string
  createdSuccessfully: string
  updatedSuccessfully: string
  deletedSuccessfully: string
  copied: string
  confirmDelete: string
  // ---- Admin sidebar ----
  adminPanel: string
  overview: string
  categories: string
  products: string
  promoCodes: string
  serverDelivery: string
  paymentGateways: string
  auditLogs: string
  // ---- Admin overview ----
  revenueToday: string
  revenueMonth: string
  revenueAll: string
  totalOrders: string
  activeTempRanks: string
  topDonor: string
  revenue30d: string
  recentPayments: string
  order: string
  player: string
  status: string
  gateway: string
  action: string
  rerun: string
  noPayments: string
  // ---- Admin settings ----
  serverSettingsTitle: string
  storeInformation: string
  storeName: string
  serverIpLabel: string
  discordUrl: string
  currenciesLabel: string
  exchangeRates: string
  exchangeRatesHint: string
  deliveryMode: string
  directRcon: string
  pluginApi: string
  rconHost: string
  rconPort: string
  rconPassword: string
  rconPasswordSaved: string
  testRcon: string
  requireOnline: string
  rotateSecret: string
  secretConfigured: string
  noSecretYet: string
  copySecretNow: string
  pendingQueue: string
  queueEmpty: string
  saveSettings: string
  rconTesting: string
  rconConnected: string
  // ---- Admin categories ----
  categoriesTitle: string
  newCategory: string
  name: string
  slug: string
  description: string
  parentTopLevel: string
  sortOrderLabel: string
  nameUk: string
  descriptionUk: string
  localizationOptional: string
  // ---- Admin products ----
  productsTitle: string
  newProduct: string
  editProduct: string
  type: string
  price: string
  active: string
  permanent: string
  temporary: string
  seeVariants: string
  category: string
  imageUrl: string
  descriptionMd: string
  tempWithVariants: string
  basePriceCents: string
  salePriceCents: string
  durationVariants: string
  addVariant: string
  label: string
  daysForever: string
  priceCents: string
  cmdsOnPurchase: string
  cmdsOnExpiry: string
  addCommand: string
  placeholders: string
  saveProduct: string
  // ---- Admin promos ----
  promosTitle: string
  newPromo: string
  code: string
  percentType: string
  fixedType: string
  value: string
  maxUses: string
  expires: string
  uses: string
  promoHint: string
  noPromos: string
  // ---- Admin gateways ----
  gatewaysTitle: string
  enabled: string
  disabled: string
  sandboxOnly: string
  apiKey: string
  secretKey: string
  webhookSecret: string
  saveKeys: string
  webhookUrl: string
  // ---- Admin audit ----
  auditTitle: string
  filterPlaceholder: string
  time: string
  actor: string
  ip: string
  result: string
  detail: string
  ok: string
  fail: string
  noLogs: string
}

export const en: Dict = {
  copy: 'COPY',
  discord: 'DISCORD',
  login: 'LOGIN',
  logout: 'logout',
  serverIpCopied: 'Server IP copied!',
  copyFailed: 'Copy failed',
  navigation: 'Navigation',
  home: 'HOME',
  allPackages: 'ALL PACKAGES',
  allPackagesDesc: 'Browse all available packages and support the server.',
  topCustomer: 'Top Customer',
  noDonations: 'No donations yet. Be the first!',
  loadingPackages: 'Loading packages...',
  noProducts: 'No products in this category yet.',
  buy: 'BUY',
  view: 'VIEW',
  info: 'INFO',
  buyNow: 'BUY NOW',
  selectDuration: 'Select duration',
  addedToCart: 'added to cart',
  yourCart: 'Your Cart',
  cartEmpty: 'Your cart is empty.',
  promoCode: 'PROMO CODE',
  apply: 'APPLY',
  subtotal: 'Subtotal',
  discount: 'Discount',
  total: 'Total',
  checkout: 'CHECKOUT',
  processing: 'Processing...',
  pricesFinalized: 'Prices are finalized securely on the server at checkout.',
  promoApplied: 'Promo applied!',
  invalidCode: 'Invalid code',
  couldNotValidate: 'Could not validate code',
  setUsernameFirst: 'Set your Minecraft username first',
  checkoutFailed: 'Checkout failed',
  enterUsername: 'Enter your Minecraft username',
  usernameDeliverNote: "We'll deliver your purchases to this account.",
  confirm: 'Confirm',
  checking: 'Checking...',
  usernameRules: 'Rules: 3-16 characters, letters, numbers and underscores only.',
  invalidUsername: 'Invalid username',
  playingAs: 'Playing as',
  paymentSuccess: 'Payment successful!',
  paymentSuccessDesc:
    'Your order has been confirmed and the delivery commands have been dispatched to the server. Items usually arrive within a minute.',
  orderReference: 'Order reference:',
  backToStore: 'Back to store',
  footerDisclaimer:
    'Not an official Minecraft product. Not approved by or associated with Mojang AB or Microsoft. All purchases go directly toward server hosting and development.',
  allRightsReserved: 'All Rights Reserved.',
  legal: 'Legal',
  termsOfService: 'Terms of Service',
  privacyPolicy: 'Privacy Policy',
  refundPolicy: 'Refund Policy',
  acceptedPayments: 'Accepted Payments',
  quickLinks: 'Quick Links',
  close: 'Close',
  save: 'Save',
  saving: 'Saving...',
  create: 'Create',
  creating: 'Creating...',
  add: 'Add',
  adding: 'Adding...',
  delete: 'Delete',
  deleting: 'Deleting...',
  cancel: 'Cancel',
  edit: 'Edit',
  loading: 'Loading…',
  savedSuccessfully: 'Saved successfully!',
  saveFailed: 'Save failed',
  createdSuccessfully: 'Created successfully!',
  updatedSuccessfully: 'Updated successfully!',
  deletedSuccessfully: 'Deleted successfully!',
  copied: 'Copied!',
  confirmDelete: 'Are you sure you want to delete this?',
  adminPanel: 'ADMIN PANEL',
  overview: 'Overview',
  categories: 'Categories',
  products: 'Products',
  promoCodes: 'Promo Codes',
  serverDelivery: 'Server & Delivery',
  paymentGateways: 'Payment Gateways',
  auditLogs: 'Audit Logs',
  revenueToday: 'Revenue Today',
  revenueMonth: 'Revenue This Month',
  revenueAll: 'Revenue All-Time',
  totalOrders: 'Total Orders',
  activeTempRanks: 'Active Temp Ranks',
  topDonor: 'Top Donor',
  revenue30d: 'Revenue (last 30 days)',
  recentPayments: 'Recent Payments',
  order: 'Order',
  player: 'Player',
  status: 'Status',
  gateway: 'Gateway',
  action: 'Action',
  rerun: 'Re-run',
  noPayments: 'No payments yet.',
  serverSettingsTitle: 'Server & Delivery Settings',
  storeInformation: 'Store Information',
  storeName: 'Store Name',
  serverIpLabel: 'Server IP (top bar)',
  discordUrl: 'Discord URL',
  currenciesLabel: 'Currencies (comma-sep)',
  exchangeRates: 'Exchange Rates (per 1 USD)',
  exchangeRatesHint: 'USD is the base currency (1.00). Set how many units of each currency equal 1 USD.',
  deliveryMode: 'Delivery Mode',
  directRcon: 'Direct RCON',
  pluginApi: 'Plugin API',
  rconHost: 'RCON Host',
  rconPort: 'RCON Port',
  rconPassword: 'RCON Password',
  rconPasswordSaved: '(saved — leave blank to keep)',
  testRcon: 'Test RCON Connection',
  requireOnline: 'Require player to be online before executing commands',
  rotateSecret: 'Generate / Rotate HMAC Secret',
  secretConfigured: 'A secret is configured.',
  noSecretYet: 'No secret set yet.',
  copySecretNow: 'Copy this secret into your plugin config now — it will not be shown again.',
  pendingQueue: 'Pending Command Queue',
  queueEmpty: 'Queue is empty.',
  saveSettings: 'Save Settings',
  rconTesting: 'Testing…',
  rconConnected: 'Connected',
  categoriesTitle: 'Categories',
  newCategory: 'New Category',
  name: 'Name',
  slug: 'Slug',
  description: 'Description',
  parentTopLevel: '(top level)',
  sortOrderLabel: 'Order',
  nameUk: 'Name (Ukrainian)',
  descriptionUk: 'Description (Ukrainian)',
  localizationOptional: 'Ukrainian localization (optional — falls back to default)',
  productsTitle: 'Products',
  newProduct: 'New Product',
  editProduct: 'Product',
  type: 'Type',
  price: 'Price',
  active: 'Active',
  permanent: 'Permanent',
  temporary: 'Temporary (variants)',
  seeVariants: 'see variants',
  category: 'Category',
  imageUrl: 'Image URL',
  descriptionMd: 'Description (markdown / HTML)',
  tempWithVariants: 'Temporary product with duration variants',
  basePriceCents: 'Base price (USD cents)',
  salePriceCents: 'Sale price (USD cents, optional)',
  durationVariants: 'Duration Variants',
  addVariant: 'Add variant',
  label: 'Label',
  daysForever: 'Days (0=forever)',
  priceCents: 'Price (USD cents)',
  cmdsOnPurchase: 'Execute Commands on Purchase',
  cmdsOnExpiry: 'Execute Commands on Expiry',
  addCommand: 'Add command',
  placeholders: 'Placeholders:',
  saveProduct: 'Save Product',
  promosTitle: 'Promo Codes',
  newPromo: 'New Promo',
  code: 'Code',
  percentType: 'Percent %',
  fixedType: 'Fixed (USD cents)',
  value: 'Value',
  maxUses: 'Max uses (0=∞)',
  expires: 'Expires',
  uses: 'Uses',
  promoHint: 'Percent: value is 0-100. Fixed: value is in USD cents (e.g. 500 = $5.00 off).',
  noPromos: 'No promo codes.',
  gatewaysTitle: 'Payment Gateways',
  enabled: 'Enabled',
  disabled: 'Disabled',
  sandboxOnly: '(sandbox — testing only)',
  apiKey: 'API Key',
  secretKey: 'Secret Key',
  webhookSecret: 'Webhook Signing Secret',
  saveKeys: 'Save Keys',
  webhookUrl: 'Webhook URL:',
  auditTitle: 'Security & Audit Logs',
  filterPlaceholder: 'Filter by action, email, or IP…',
  time: 'Time',
  actor: 'Actor',
  ip: 'IP',
  result: 'Result',
  detail: 'Detail',
  ok: 'OK',
  fail: 'FAIL',
  noLogs: 'No log entries.',
}

export const ua: Dict = {
  copy: 'КОПІЮВАТИ',
  discord: 'DISCORD',
  login: 'УВІЙТИ',
  logout: 'вийти',
  serverIpCopied: 'IP сервера скопійовано!',
  copyFailed: 'Не вдалося скопіювати',
  navigation: 'Навігація',
  home: 'ГОЛОВНА',
  allPackages: 'УСІ ПАКЕТИ',
  allPackagesDesc: 'Перегляньте всі доступні пакети та підтримайте сервер.',
  topCustomer: 'Топ покупець',
  noDonations: 'Ще немає донатів. Будьте першим!',
  loadingPackages: 'Завантаження пакетів...',
  noProducts: 'У цій категорії ще немає товарів.',
  buy: 'КУПИТИ',
  view: 'ОГЛЯД',
  info: 'ІНФО',
  buyNow: 'КУПИТИ ЗАРАЗ',
  selectDuration: 'Оберіть тривалість',
  addedToCart: 'додано в кошик',
  yourCart: 'Ваш кошик',
  cartEmpty: 'Ваш кошик порожній.',
  promoCode: 'ПРОМОКОД',
  apply: 'ЗАСТОСУВАТИ',
  subtotal: 'Проміжна сума',
  discount: 'Знижка',
  total: 'Разом',
  checkout: 'ОФОРМИТИ',
  processing: 'Обробка...',
  pricesFinalized: 'Ціни остаточно формуються безпечно на сервері під час оформлення.',
  promoApplied: 'Промокод застосовано!',
  invalidCode: 'Недійсний код',
  couldNotValidate: 'Не вдалося перевірити код',
  setUsernameFirst: 'Спочатку вкажіть свій нік Minecraft',
  checkoutFailed: 'Помилка оформлення',
  enterUsername: 'Введіть свій нік Minecraft',
  usernameDeliverNote: 'Ми доставимо ваші покупки на цей акаунт.',
  confirm: 'Підтвердити',
  checking: 'Перевірка...',
  usernameRules: 'Правила: 3-16 символів, лише літери, цифри та підкреслення.',
  invalidUsername: 'Недійсний нік',
  playingAs: 'Гра за ніком',
  paymentSuccess: 'Оплата успішна!',
  paymentSuccessDesc:
    'Ваше замовлення підтверджено, а команди доставки надіслано на сервер. Зазвичай товари надходять протягом хвилини.',
  orderReference: 'Номер замовлення:',
  backToStore: 'Назад до магазину',
  footerDisclaimer:
    "Цей сервер та магазин жодним чином не пов'язані з Mojang AB або Microsoft. Усі кошти йдуть на розвиток проєкту. Minecraft є торговою маркою Mojang Synergies AB.",
  allRightsReserved: 'Усі права захищені.',
  legal: 'Правова інформація',
  termsOfService: 'Умови використання',
  privacyPolicy: 'Політика конфіденційності',
  refundPolicy: 'Політика повернення коштів',
  acceptedPayments: 'Способи оплати',
  quickLinks: 'Швидкі посилання',
  close: 'Закрити',
  save: 'Зберегти',
  saving: 'Збереження...',
  create: 'Створити',
  creating: 'Створення...',
  add: 'Додати',
  adding: 'Додавання...',
  delete: 'Видалити',
  deleting: 'Видалення...',
  cancel: 'Скасувати',
  edit: 'Редагувати',
  loading: 'Завантаження…',
  savedSuccessfully: 'Збережено успішно!',
  saveFailed: 'Помилка збереження',
  createdSuccessfully: 'Створено успішно!',
  updatedSuccessfully: 'Оновлено успішно!',
  deletedSuccessfully: 'Видалено успішно!',
  copied: 'Скопійовано!',
  confirmDelete: 'Ви впевнені, що хочете це видалити?',
  adminPanel: 'АДМІН-ПАНЕЛЬ',
  overview: 'Огляд',
  categories: 'Категорії',
  products: 'Товари',
  promoCodes: 'Промокоди',
  serverDelivery: 'Сервер і доставка',
  paymentGateways: 'Платіжні шлюзи',
  auditLogs: 'Журнали аудиту',
  revenueToday: 'Дохід сьогодні',
  revenueMonth: 'Дохід за місяць',
  revenueAll: 'Дохід за весь час',
  totalOrders: 'Усього замовлень',
  activeTempRanks: 'Активні тимчасові ранги',
  topDonor: 'Топ донатер',
  revenue30d: 'Дохід (останні 30 днів)',
  recentPayments: 'Останні платежі',
  order: 'Замовлення',
  player: 'Гравець',
  status: 'Статус',
  gateway: 'Шлюз',
  action: 'Дія',
  rerun: 'Повторити',
  noPayments: 'Ще немає платежів.',
  serverSettingsTitle: 'Налаштування сервера та доставки',
  storeInformation: 'Інформація про магазин',
  storeName: 'Назва магазину',
  serverIpLabel: 'IP сервера (верхня панель)',
  discordUrl: 'Discord URL',
  currenciesLabel: 'Валюти (через кому)',
  exchangeRates: 'Курси валют (за 1 USD)',
  exchangeRatesHint: 'USD — базова валюта (1.00). Вкажіть, скільки одиниць кожної валюти дорівнює 1 USD.',
  deliveryMode: 'Режим доставки',
  directRcon: 'Прямий RCON',
  pluginApi: 'Plugin API',
  rconHost: 'RCON Хост',
  rconPort: 'RCON Порт',
  rconPassword: 'RCON Пароль',
  rconPasswordSaved: '(збережено — залиште порожнім, щоб не змінювати)',
  testRcon: 'Перевірити з’єднання RCON',
  requireOnline: 'Вимагати, щоб гравець був онлайн перед виконанням команд',
  rotateSecret: 'Згенерувати / Оновити HMAC-секрет',
  secretConfigured: 'Секрет налаштовано.',
  noSecretYet: 'Секрет ще не встановлено.',
  copySecretNow: 'Скопіюйте цей секрет у конфіг плагіна зараз — він більше не відображатиметься.',
  pendingQueue: 'Черга команд в очікуванні',
  queueEmpty: 'Черга порожня.',
  saveSettings: 'Зберегти налаштування',
  rconTesting: 'Перевірка…',
  rconConnected: 'З’єднано',
  categoriesTitle: 'Категорії',
  newCategory: 'Нова категорія',
  name: 'Назва',
  slug: 'Slug',
  description: 'Опис',
  parentTopLevel: '(верхній рівень)',
  sortOrderLabel: 'Порядок',
  nameUk: 'Назва (українською)',
  descriptionUk: 'Опис (українською)',
  localizationOptional: 'Українська локалізація (необов’язково — використовується типова за замовчуванням)',
  productsTitle: 'Товари',
  newProduct: 'Новий товар',
  editProduct: 'Товар',
  type: 'Тип',
  price: 'Ціна',
  active: 'Активний',
  permanent: 'Постійний',
  temporary: 'Тимчасовий (варіанти)',
  seeVariants: 'див. варіанти',
  category: 'Категорія',
  imageUrl: 'URL зображення',
  descriptionMd: 'Опис (markdown / HTML)',
  tempWithVariants: 'Тимчасовий товар з варіантами тривалості',
  basePriceCents: 'Базова ціна (центи USD)',
  salePriceCents: 'Ціна зі знижкою (центи USD, необов’язково)',
  durationVariants: 'Варіанти тривалості',
  addVariant: 'Додати варіант',
  label: 'Назва',
  daysForever: 'Днів (0=назавжди)',
  priceCents: 'Ціна (центи USD)',
  cmdsOnPurchase: 'Команди при покупці',
  cmdsOnExpiry: 'Команди при завершенні',
  addCommand: 'Додати команду',
  placeholders: 'Плейсхолдери:',
  saveProduct: 'Зберегти товар',
  promosTitle: 'Промокоди',
  newPromo: 'Новий промокод',
  code: 'Код',
  percentType: 'Відсоток %',
  fixedType: 'Фіксований (центи USD)',
  value: 'Значення',
  maxUses: 'Макс. використань (0=∞)',
  expires: 'Діє до',
  uses: 'Використань',
  promoHint: 'Відсоток: значення 0-100. Фіксований: значення в центах USD (напр. 500 = знижка $5.00).',
  noPromos: 'Немає промокодів.',
  gatewaysTitle: 'Платіжні шлюзи',
  enabled: 'Увімкнено',
  disabled: 'Вимкнено',
  sandboxOnly: '(пісочниця — лише для тестів)',
  apiKey: 'API-ключ',
  secretKey: 'Секретний ключ',
  webhookSecret: 'Секрет підпису Webhook',
  saveKeys: 'Зберегти ключі',
  webhookUrl: 'Webhook URL:',
  auditTitle: 'Безпека та журнали аудиту',
  filterPlaceholder: 'Фільтр за дією, email або IP…',
  time: 'Час',
  actor: 'Виконавець',
  ip: 'IP',
  result: 'Результат',
  detail: 'Деталі',
  ok: 'OK',
  fail: 'ПОМИЛКА',
  noLogs: 'Немає записів у журналі.',
}

export const dictionaries: Record<Lang, Dict> = { en, ua }
