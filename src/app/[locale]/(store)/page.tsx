import { getTranslations } from "next-intl/server";
import Image from "next/image";

export default async function Home() {

  const t = await getTranslations('HomePage');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-2 text-gray-600">{t('subtitle')}</p>
    </div>
  );
}
