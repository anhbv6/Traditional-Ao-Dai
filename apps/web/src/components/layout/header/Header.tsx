import { getTranslations } from 'next-intl/server';
import { CartButton } from './CartButton';
import { DesktopNav } from './DesktopNav';
import { HeaderWrapper } from './HeaderWrapper';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { NotificationButton } from './NotificationButton';
import { SearchOverlay } from './SearchOverlay';
import { UserMenu } from './UserMenu';
import { WishlistButton } from './WishlistButton';
import type { NavItem } from './types';

type HeaderProps = {
  sticky?: boolean;
};

export async function Header({ sticky = true }: HeaderProps) {
  const t = await getTranslations('Common');

  // Điều hướng chính — dùng chung cho thanh menu desktop và drawer mobile (Yêu thích là icon tim trên header ở cả hai)
  const navItems: NavItem[] = [
    { label: t('home'), href: '/' },
    { label: t('shop'), href: '/products' },
    { label: t('fabrics'), href: '/fabrics', desktopFrom2xl: true },
    { label: t('ourStory'), href: '/about' },
    { label: t('blog'), href: '/news' },
    { label: t('contact'), href: '/contact' },
  ];

  return (
    <HeaderWrapper sticky={sticky}>
      <header className="relative mx-auto flex h-14 w-full items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-8 lg:h-[4.5rem] lg:px-6 xl:px-8 2xl:h-20 2xl:px-12">
        {/* Chỉ giữ hình logo khi chật: điện thoại rất hẹp (< 360px) nhường chỗ hàng icon;
            lg → xl nhường chỗ menu desktop (tên "Thiên Canh" + mục "Chuyện Của Lụa & Mây" không đủ chỗ ở 1024px) */}
        <Logo textLogo textClassName="max-[359px]:sr-only lg:max-xl:sr-only" />
        <DesktopNav items={navItems} />
        {/* Cùng một khoảng cách cho mọi icon (kính lúp nằm ngoài nhóm mobile nên gap phải đặt ở cả hai cấp) */}
        <div className="flex items-center gap-1 sm:gap-2">
          <SearchOverlay label={t('search')} placeholder={t('searchPlaceholder')} />

          {/* PC Desktop Header Items */}
          <div className="hidden lg:flex lg:items-center lg:gap-1 xl:gap-2">
            <WishlistButton label={t('wishlist')} />
            <CartButton label={t('cart')} preview />
            <NotificationButton label={t('notifications')} preview />
            <LanguageSwitcher />
            <UserMenu loginLabel={t('login')} profileLabel={t('profile')} ordersLabel={t('orders')} logoutLabel={t('logout')} />
          </div>

          {/* Mobile: thao tác nhanh nằm ngoài header (thông báo, yêu thích, giỏ); drawer chỉ còn điều hướng + ngôn ngữ + tài khoản */}
          <div className="flex items-center gap-1 sm:gap-2 lg:hidden">
            <NotificationButton label={t('notifications')} />
            <WishlistButton label={t('wishlist')} />
            <CartButton label={t('cart')} />
            <MobileMenu
              items={navItems}
              loginLabel={t('login')}
              profileLabel={t('profile')}
              logoutLabel={t('logout')}
              languageLabel={t('language')}
              taglineDrawer={t(('tagline'))}
            />
          </div>
        </div>
      </header>
    </HeaderWrapper>
  );
}
