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
      common,
      contact,
      footer,
      home,
      news,
      product,
      products
    ] = await Promise.all([
      import(`../../messages/${locale}/about.json`).then(m => m.default),
      import(`../../messages/${locale}/auth.json`).then(m => m.default),
      import(`../../messages/${locale}/breadcrumbs.json`).then(m => m.default),
      import(`../../messages/${locale}/common.json`).then(m => m.default),
      import(`../../messages/${locale}/contact.json`).then(m => m.default),
      import(`../../messages/${locale}/footer.json`).then(m => m.default),
      import(`../../messages/${locale}/home.json`).then(m => m.default),
      import(`../../messages/${locale}/news.json`).then(m => m.default),
      import(`../../messages/${locale}/product.json`).then(m => m.default),
      import(`../../messages/${locale}/products.json`).then(m => m.default),
    ]);

    return {
        locale,
        messages: {
            AboutPage: about,
            Auth: auth,
            Breadcrumbs: breadcrumbs,
            Common: common,
            ContactPage: contact,
            Footer: footer,
            HomePage: home,
            NewsPage: news,
            Product: product,
            ProductsPage: products,
        }
    };
});
