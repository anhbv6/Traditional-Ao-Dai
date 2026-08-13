import { getTranslations } from 'next-intl/server';
import { CartButton } from './CartButton';
import { DesktopNav } from './DesktopNav';
import { HeaderWrapper } from './HeaderWrapper';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { SearchBar } from './SearchBar';
import { UserMenu } from './UserMenu';
import { WishlistButton } from './WishlistButton';
import type { NavItem } from './types';

type HeaderProps = {
  sticky?: boolean;
  cartCount?: number;
  wishlistCount?: number;
};

export async function Header({ sticky = true, cartCount = 0, wishlistCount = 0 }: HeaderProps) {
  const t = await getTranslations('Common');

  // Danh sách NavItems dành cho PC Desktop (Không có Wishlist)
  const desktopNavItems: NavItem[] = [
    { label: t('home'), href: '/' },
    { label: t('shop'), href: '/products' },
    { label: t('ourStory'), href: '/about' },
    { label: t('blog'), href: '/news' },
    { label: t('contact'), href: '/contact' },
  ];

  // Danh sách NavItems riêng cho Mobile Drawer (Bao gồm thêm Wishlist)
  const mobileNavItems: NavItem[] = [
    ...desktopNavItems,
    { label: t('wishlist'), href: '/wishlist' },
  ];

  return (
    <HeaderWrapper sticky={sticky}>
      <header className="relative mx-auto flex h-20 w-full items-center justify-between px-5 sm:px-8 lg:px-12">
        <Logo textLogo/>
        <DesktopNav items={desktopNavItems} />
        <div className="flex items-center gap-1 sm:gap-2">
          <SearchBar placeholder={t('search')} />

          {/* PC Desktop Header Items */}
          <div className="hidden lg:flex lg:items-center lg:gap-2">
            <WishlistButton count={wishlistCount} label={t('wishlist')} />
            <CartButton count={cartCount} label={t('cart')} />
            <LanguageSwitcher />
            <UserMenu loginLabel={t('login')} profileLabel={t('profile')} ordersLabel={t('orders')} logoutLabel={t('logout')} />
          </div>

          {/* Mobile Header Items: Cart icon + Mobile Menu Drawer */}
          <div className="flex items-center gap-1 lg:hidden">
            <CartButton count={cartCount} label={t('cart')} />
            <MobileMenu
              items={mobileNavItems}
              searchPlaceholder={t('searchPlaceholder')}
              loginLabel={t('login')}
              profileLabel={t('profile')}
              logoutLabel={t('logout')}
              wishlistCount={wishlistCount}
              languageLabel={t('language')}
              taglineDrawer={t(('tagline'))}
            />
          </div>
        </div>
      </header>
    </HeaderWrapper>
  );
}
