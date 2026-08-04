import { FaFacebook, FaTiktok, FaInstagram, FaXTwitter } from 'react-icons/fa6';
import { ZaloIcon } from './ZaloIcon';

type SocialLinksProps = {
  socialLabel: string;
};

export function SocialLinks({ socialLabel }: SocialLinksProps) {
  const socialItems = [
    { label: 'Facebook', href: 'https://www.facebook.com/', icon: FaFacebook },
    { label: 'TikTok', href: 'https://www.tiktok.com/', icon: FaTiktok },
    { label: 'Instagram', href: 'https://www.instagram.com/', icon: FaInstagram },
    { label: 'Zalo OA', href: 'https://zalo.me/', icon: ZaloIcon },
    { label: 'X (Twitter)', href: 'https://x.com/', icon: FaXTwitter },
  ];

  return (
    <div
      className="flex gap-4 justify-center lg:self-center w-full max-w-[180px] mt-2"
      aria-label={socialLabel}
    >
      {socialItems.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          title={label}
          className="grid place-items-center rounded-md text-primary transition-colors hover:opacity-70"
        >
          <Icon size={17} strokeWidth={1.7} />
        </a>
      ))}
    </div>
  );
}
