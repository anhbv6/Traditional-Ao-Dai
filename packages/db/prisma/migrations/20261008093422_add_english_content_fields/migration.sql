-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "contentEn" TEXT,
ADD COLUMN     "excerptEn" TEXT,
ADD COLUMN     "titleEn" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "nameEn" TEXT;

-- AlterTable
ALTER TABLE "Faq" ADD COLUMN     "answerEn" TEXT,
ADD COLUMN     "questionEn" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "materialEn" TEXT,
ADD COLUMN     "nameEn" TEXT;

