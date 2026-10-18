import { Lang } from '../i18n/dictionary'

// Legal template text for ToS, Privacy, and Refund policies in EN + UA.
// These are editable starting templates written for a Minecraft donation store that
// must pass payment-gateway verification (Monobank, LiqPay, Stripe, etc.).

export type LegalDocKey = 'terms' | 'privacy' | 'refund'

interface LegalDoc {
  title: string
  body: string[]
}

export function getLegalDoc(key: LegalDocKey, lang: Lang, storeName: string): LegalDoc {
  return DOCS[lang][key](storeName)
}

type DocFactory = (store: string) => LegalDoc

const DOCS: Record<Lang, Record<LegalDocKey, DocFactory>> = {
  en: {
    terms: (store) => ({
      title: 'Terms of Service',
      body: [
        `1. General Provisions`,
        `These Terms of Service ("Terms") govern the use of the online store "${store}" ("the Store"), which sells virtual in-game goods and services for Minecraft game servers. By placing an order you confirm that you have read, understood and agree to these Terms.`,
        `2. Nature of Goods`,
        `All products sold are digital, virtual items (ranks, kits, cosmetics, in-game currency, and similar) delivered to your Minecraft account on the associated game server. The goods have no real-world monetary value and cannot be exchanged for cash.`,
        `3. Not Affiliated with Mojang / Microsoft`,
        `${store} is not an official Minecraft product and is not approved by or associated with Mojang AB or Microsoft. "Minecraft" is a trademark of Mojang Synergies AB. All payments are voluntary contributions that go directly toward server hosting, maintenance and development.`,
        `4. Orders and Delivery`,
        `After successful payment, purchased items are delivered automatically to the Minecraft username provided at checkout, usually within a few minutes. It is your responsibility to enter the correct username. Delivery to an incorrect username entered by the buyer is non-refundable.`,
        `5. Pricing and Currency`,
        `Prices are stored in USD and may be displayed in other currencies for convenience using current exchange rates. The authoritative charge is calculated at checkout in the selected currency.`,
        `6. User Conduct`,
        `You agree not to abuse chargebacks, exploit bugs, or attempt fraudulent transactions. Violation may result in suspension of your game account and forfeiture of purchased items without refund.`,
        `7. Changes to the Terms`,
        `We reserve the right to update these Terms at any time. Continued use of the Store after changes constitutes acceptance of the updated Terms.`,
        `8. Contact`,
        `For any questions regarding these Terms, contact the server administration through the official Discord linked in the top bar.`,
      ],
    }),
    privacy: (store) => ({
      title: 'Privacy Policy',
      body: [
        `1. Data We Collect`,
        `${store} collects only the minimum data required to process your order: your Minecraft username, order details, and payment confirmation data provided by the payment processor. We do not store full card numbers — payments are handled entirely by certified payment gateways.`,
        `2. How We Use Your Data`,
        `Your data is used solely to deliver purchased items, provide customer support, prevent fraud, and keep records required by law and by our payment providers.`,
        `3. Payment Processing`,
        `Payments are processed by third-party providers (e.g. Monobank, LiqPay, Stripe). Their handling of your payment data is governed by their own privacy policies. We receive only a transaction reference and payment status.`,
        `4. Cookies and Local Storage`,
        `The Store uses browser local storage to remember your selected language, currency and Minecraft username for convenience. No tracking or advertising cookies are used.`,
        `5. Data Retention`,
        `Order and transaction records are retained for the period required by applicable law and payment-provider requirements, after which they are deleted or anonymized.`,
        `6. Your Rights`,
        `You may request access to, correction of, or deletion of your personal data by contacting the administration via the official Discord, subject to legal record-keeping obligations.`,
        `7. Security`,
        `We apply reasonable technical and organizational measures to protect your data, including encryption of sensitive configuration values.`,
      ],
    }),
    refund: (store) => ({
      title: 'Refund Policy',
      body: [
        `1. Digital Goods and Donations`,
        `All purchases at ${store} are for digital, virtual in-game goods or are voluntary donations toward server development. Because items are delivered instantly and consumed in-game, all sales are generally final.`,
        `2. When Refunds Are Possible`,
        `A refund may be issued only if: (a) you were charged but the item was not delivered due to a technical fault on our side, and (b) the issue cannot be resolved by re-delivering the item. Refund requests must be made within 14 days of purchase.`,
        `3. When Refunds Are Not Possible`,
        `Refunds are not provided for: items successfully delivered to the username you entered; items lost due to a ban or punishment for breaking server rules; change of mind after delivery; or an incorrect username entered by the buyer.`,
        `4. How to Request a Refund`,
        `Contact the server administration via the official Discord with your order reference and a description of the issue. We will investigate and respond within a reasonable time.`,
        `5. Chargebacks`,
        `Initiating a chargeback instead of contacting support may result in a permanent ban from the server and the store. Please always reach out to us first — we want to resolve any issue fairly.`,
      ],
    }),
  },
  ua: {
    terms: (store) => ({
      title: 'Умови використання (Публічна оферта)',
      body: [
        `1. Загальні положення`,
        `Ці Умови використання («Умови») регулюють користування інтернет-магазином «${store}» («Магазин»), який продає віртуальні ігрові товари та послуги для ігрових серверів Minecraft. Оформлюючи замовлення, ви підтверджуєте, що ознайомилися з цими Умовами та погоджуєтеся з ними.`,
        `2. Характер товарів`,
        `Усі товари є цифровими віртуальними предметами (ранги, набори, косметика, ігрова валюта тощо), які доставляються на ваш акаунт Minecraft на відповідному ігровому сервері. Товари не мають реальної грошової вартості та не підлягають обміну на готівку.`,
        `3. Відсутність зв'язку з Mojang / Microsoft`,
        `«${store}» не є офіційним продуктом Minecraft і жодним чином не пов'язаний з Mojang AB або Microsoft та не схвалений ними. «Minecraft» є торговою маркою Mojang Synergies AB. Усі платежі є добровільними внесками, які повністю спрямовуються на хостинг, обслуговування та розвиток сервера.`,
        `4. Замовлення та доставка`,
        `Після успішної оплати придбані предмети доставляються автоматично на нік Minecraft, вказаний під час оформлення, зазвичай протягом кількох хвилин. Ви несете відповідальність за правильність введеного ніка. Доставка на неправильно вказаний покупцем нік не підлягає поверненню.`,
        `5. Ціни та валюта`,
        `Ціни зберігаються в USD і можуть відображатися в інших валютах для зручності за поточним курсом. Остаточна сума списання розраховується під час оформлення у вибраній валюті.`,
        `6. Поведінка користувача`,
        `Ви погоджуєтеся не зловживати поверненнями платежів (chargeback), не використовувати помилки гри та не здійснювати шахрайських операцій. Порушення може призвести до блокування ігрового акаунта та втрати придбаних предметів без повернення коштів.`,
        `7. Зміни до Умов`,
        `Ми залишаємо за собою право оновлювати ці Умови в будь-який час. Подальше користування Магазином після внесення змін означає прийняття оновлених Умов.`,
        `8. Контакти`,
        `З будь-яких питань щодо цих Умов звертайтеся до адміністрації сервера через офіційний Discord, посилання на який є у верхній панелі.`,
      ],
    }),
    privacy: (store) => ({
      title: 'Політика конфіденційності',
      body: [
        `1. Які дані ми збираємо`,
        `«${store}» збирає лише мінімально необхідні дані для обробки замовлення: ваш нік Minecraft, деталі замовлення та дані підтвердження оплати, надані платіжним сервісом. Ми не зберігаємо повні номери карток — платежі повністю обробляються сертифікованими платіжними шлюзами.`,
        `2. Як ми використовуємо ваші дані`,
        `Ваші дані використовуються виключно для доставки придбаних предметів, надання підтримки, запобігання шахрайству та ведення записів, необхідних згідно із законом і вимогами платіжних провайдерів.`,
        `3. Обробка платежів`,
        `Платежі обробляються сторонніми провайдерами (напр. Monobank, LiqPay, Stripe). Обробка ваших платіжних даних регулюється їхніми власними політиками конфіденційності. Ми отримуємо лише ідентифікатор транзакції та статус оплати.`,
        `4. Файли cookie та локальне сховище`,
        `Магазин використовує локальне сховище браузера, щоб запам'ятати вибрану мову, валюту та нік Minecraft для зручності. Рекламні або трекінгові cookie не використовуються.`,
        `5. Зберігання даних`,
        `Записи про замовлення та транзакції зберігаються протягом періоду, визначеного чинним законодавством і вимогами платіжних провайдерів, після чого видаляються або знеособлюються.`,
        `6. Ваші права`,
        `Ви можете запросити доступ до своїх персональних даних, їх виправлення або видалення, звернувшись до адміністрації через офіційний Discord, з урахуванням законних зобов'язань щодо зберігання записів.`,
        `7. Безпека`,
        `Ми застосовуємо розумні технічні та організаційні заходи для захисту ваших даних, зокрема шифрування чутливих конфігураційних значень.`,
      ],
    }),
    refund: (store) => ({
      title: 'Політика повернення коштів',
      body: [
        `1. Цифрові товари та донати`,
        `Усі покупки в «${store}» є цифровими віртуальними ігровими товарами або добровільними донатами на розвиток сервера. Оскільки предмети доставляються миттєво та використовуються в грі, усі продажі зазвичай є остаточними.`,
        `2. Коли повернення можливе`,
        `Повернення коштів може бути здійснене лише якщо: (а) з вас було списано кошти, але предмет не було доставлено через технічну помилку з нашого боку, та (б) проблему неможливо вирішити повторною доставкою предмета. Запит на повернення має бути поданий протягом 14 днів з моменту покупки.`,
        `3. Коли повернення неможливе`,
        `Повернення не надається за: предмети, успішно доставлені на вказаний вами нік; предмети, втрачені через бан або покарання за порушення правил сервера; зміну рішення після доставки; або неправильно вказаний покупцем нік.`,
        `4. Як подати запит на повернення`,
        `Зверніться до адміністрації сервера через офіційний Discord, вказавши номер замовлення та опис проблеми. Ми розглянемо запит і відповімо в розумний термін.`,
        `5. Повернення платежів через банк (chargeback)`,
        `Ініціювання chargeback замість звернення до підтримки може призвести до постійного блокування на сервері та в магазині. Будь ласка, завжди спочатку звертайтеся до нас — ми прагнемо вирішити будь-яке питання чесно.`,
      ],
    }),
  },
}
