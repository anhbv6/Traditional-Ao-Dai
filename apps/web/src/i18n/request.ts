import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({requestLocale}) => {
    let locale = await requestLocale;

    if (!locale || !routing.locales.some((allowedLocale) => allowedLocale === locale)) {
        locale = routing.defaultLocale;
    }

    // Parallel dynamic import of split JSON translation files
    const [
      about,
      auth,
      breadcrumbs,
      cart,
      common,
      contact,
      footer,
      home,
      news,
      product,
      products,
      profile,
      faqs,
      wishlist,
      admin,
      errors
    ] = await Promise.all([
      import(`../../messages/${locale}/about.json`).then(m => m.default),
      import(`../../messages/${locale}/auth.json`).then(m => m.default),
      import(`../../messages/${locale}/breadcrumbs.json`).then(m => m.default),
      import(`../../messages/${locale}/cart.json`).then(m => m.default),
      import(`../../messages/${locale}/common.json`).then(m => m.default),
      import(`../../messages/${locale}/contact.json`).then(m => m.default),
      import(`../../messages/${locale}/footer.json`).then(m => m.default),
      import(`../../messages/${locale}/home.json`).then(m => m.default),
      import(`../../messages/${locale}/news.json`).then(m => m.default),
      import(`../../messages/${locale}/product.json`).then(m => m.default),
      import(`../../messages/${locale}/products.json`).then(m => m.default),
      import(`../../messages/${locale}/profile.json`).then(m => m.default),
      import(`../../messages/${locale}/faqs.json`).then(m => m.default),
      import(`../../messages/${locale}/wishlist.json`).then(m => m.default),
      import(`../../messages/${locale}/admin.json`).then(m => m.default),
      import(`../../messages/${locale}/errors.json`).then(m => m.default),
    ]);

    return {
        locale,
        messages: {
            AboutPage: about,
            Auth: {
              ...auth,
              responses: {
                ...errors,
                ...(auth.responses || {})
              }
            },
            Breadcrumbs: breadcrumbs,
            CartPage: cart,
            Common: {
              ...common,
              errors: {
                ...errors,
                ...(common.errors || {})
              }
            },
            ContactPage: contact,
            Footer: footer,
            HomePage: home,
            NewsPage: news,
            Product: product,
            ProductsPage: products,
            ProfilePage: {
              ...profile,
              responses: {
                ...errors,
                ...(profile.responses || {})
              }
            },
            FaqsPage: faqs,
            WishlistPage: wishlist,
            AdminPage: {
              ...admin,
              login: {
                ...errors,
                ...(admin.login || {})
              }
            },
            Errors: errors,
        }
    };
});
