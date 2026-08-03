"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { type MockArticle, getAuthor } from "../types/news.types";

// Generates editorial paragraphs and bullet highlights based on category
function getArticleContent(category: string, title: string, description: string, locale: string) {
  const isEn = locale === 'en';
  
  if (category.toLowerCase().includes('guide') || category.toLowerCase().includes('cẩm nang')) {
    return {
      paragraphs: [
        isEn
          ? `Ao Dai guide guidelines suggest that preserving the beauty of traditional attire requires attention to detail. ${description} Understanding these steps will protect the hand-embroidered motifs and delicate fabric grains.`
          : `Cẩm nang bảo quản và giữ gìn áo dài truyền thống chỉ ra rằng vẻ đẹp của tà áo dài phụ thuộc rất nhiều vào sự nâng niu của người mặc. ${description} Việc nắm vững các quy trình giặt và cất giữ đúng cách giúp bảo vệ đường thêu tinh xảo và thớ vải mượt mà qua năm tháng.`,
        isEn
          ? 'First, let us examine the cleaning process. Specialized fabrics such as mulberry silk, velvet, or brocade are extremely sensitive to standard detergents and rigorous spin cycles. They require hand-washing or dedicated dry cleaning to maintain structural integrity.'
          : 'Trước hết, hãy xem xét quy trình giặt là. Các chất liệu cao cấp như lụa tơ tằm, nhung hay gấm cực kỳ nhạy cảm với các loại bột giặt thông thường và chu kỳ vắt mạnh của máy giặt. Việc giặt tay bằng sữa tắm nhẹ hoặc giặt hấp chuyên dụng là bắt buộc để giữ phom dáng.',
        isEn
          ? 'Second, environmental storage plays a vital role. Silk fibers can easily weaken or discolor if exposed to high temperatures and direct sunlight for extended periods. It is highly recommended to store them in breathable garment bags.'
          : 'Thứ hai, yếu tố môi trường cất giữ đóng vai trò then chốt. Sợi lụa có nguồn gốc tự nhiên dễ bị giòn và phai màu nếu tiếp xúc với nhiệt độ cao và ánh nắng trực tiếp quá lâu. Sử dụng túi vải bảo quản chuyên dụng và đặt nơi khô thoáng là phương án tối ưu.'
      ],
      highlights: [
        {
          bold: isEn ? 'Mulberry silk care' : 'Chăm sóc lụa tơ tằm',
          text: isEn 
            ? 'always wash with cold water and mild baby shampoo to keep the texture soft.' 
            : 'luôn giặt bằng nước lạnh và sữa tắm dịu nhẹ để giữ thớ vải luôn mềm mại.'
        },
        {
          bold: isEn ? 'Hand ironing guidelines' : 'Bí quyết ủi hơi nước',
          text: isEn
            ? 'iron from the reverse side at low heat settings to prevent sheen damage.'
            : 'ủi hơi nước từ mặt trái ở nhiệt độ thấp nhất để tránh làm bóng bề mặt vải.'
        },
        {
          bold: isEn ? 'Bespoke storage containers' : 'Bảo quản chống ẩm mốc',
          text: isEn
            ? 'store garments in acid-free paper wrapping or cotton bags, never plastic.'
            : 'bọc áo dài trong giấy chống ẩm hoặc túi cotton thoáng khí, tránh dùng túi nilon kín.'
        },
        {
          bold: isEn ? 'Hanger selection tips' : 'Lựa chọn móc treo',
          text: isEn
            ? 'use wide padded wooden hangers to retain the structural shoulder shapes.'
            : 'sử dụng móc gỗ bản rộng hoặc móc bọc vải để giữ phom vai áo không bị biến dạng.'
        }
      ]
    };
  }

  // Default Trends/Culture template matching mock image text exactly
  return {
    paragraphs: [
      isEn
        ? `Cultural movements have been a driving force behind societal change for centuries, but in today's globally connected world, their influence has grown stronger and more immediate. ${description} The growing awareness and advocacy surrounding these causes highlight a societal shift toward inclusivity, diversity, and sustainability principles that are increasingly guiding the evolution of modern society.`
        : `Các phong trào văn hóa luôn là động lực thúc đẩy sự thay đổi của xã hội qua nhiều thế kỷ, và trong thế giới kết nối toàn cầu ngày nay, sức ảnh hưởng này ngày càng mạnh mẽ và trực tiếp hơn. ${description} Sự nâng cao nhận thức và ủng hộ các giá trị này phản ánh một bước chuyển mình của xã hội hướng tới sự hòa nhập, đa dạng và các giá trị bền vững đang định hình phong cách sống hiện đại.`,
      isEn
        ? 'One of the most prominent cultural movements in recent years has been the call for social justice and equality. This movement has manifested in multiple forms, from the fight for gender equality and racial justice to the push for LGBTQ+ rights and workplace inclusivity. As a result, companies, organizations, and even governments have been compelled to reconsider their practices and policies.'
        : 'Một trong những phong trào nổi bật nhất trong những năm gần đây là lời kêu gọi bình đẳng và công lý xã hội. Phong trào này biểu hiện dưới nhiều hình thức, từ đấu tranh bình đẳng giới, sắc tộc đến thúc đẩy tính hòa nhập nơi công sở. Kết quả là các doanh nghiệp, tổ chức và các chính phủ đang buộc phải điều chỉnh lại các chính sách và quy tắc ứng xử của mình.',
      isEn
        ? 'Environmental movements are another powerful force reshaping contemporary society. From climate change activism to sustainable agriculture, people around the world are uniting to address serious environmental challenges. This push for sustainability is not apparent only in the corporate world but also in entertainment, education, and media, where diverse representation and authentic storytelling are now priorities.'
        : 'Các phong trào môi trường cũng là một động lực mạnh mẽ khác định hình xã hội đương đại. Từ các chiến dịch chống biến đổi khí hậu đến nông nghiệp bền vững, mọi người trên khắp thế giới đang đoàn kết ứng phó với thách thức sinh thái. Sự thúc đẩy này không chỉ diễn ra ở cấp độ doanh nghiệp mà còn lan tỏa mạnh mẽ sang văn hóa, giải trí, thời trang và giáo dục.'
    ],
    highlights: [
      {
        bold: isEn ? 'Social justice movements' : 'Phong trào bình đẳng xã hội',
        text: isEn
          ? 'are influencing business practices, encouraging inclusivity, fair representation, and equality in various sectors.'
          : 'đang tác động sâu sắc đến văn hóa doanh nghiệp, khuyến khích sự đa dạng, đại diện công bằng trong nhiều lĩnh vực.'
      },
      {
        bold: isEn ? 'Environmental activism' : 'Hoạt động bảo vệ môi trường',
        text: isEn
          ? 'is driving industries toward sustainable practices, emphasizing green energy, waste reduction, and climate-conscious mindset.'
          : 'thúc đẩy các ngành công nghiệp hướng tới thiết kế bền vững, năng lượng sạch và giảm thiểu rác thải thời trang.'
      },
      {
        bold: isEn ? 'Digital connectivity' : 'Kết nối kỹ thuật số toàn cầu',
        text: isEn
          ? 'has transformed how cultural movements spread, enabling individuals to participate in and support global causes through online platforms.'
          : 'đã thay đổi hoàn toàn cách truyền bá văn hóa, cho phép các cá nhân kết nối và lan tỏa thông điệp di sản qua internet.'
      },
      {
        bold: isEn ? 'Arts and media' : 'Nghệ thuật và truyền thông',
        text: isEn
          ? 'are increasingly highlighting diverse perspectives, using storytelling to address complex societal issues and foster empathy.'
          : 'đang ngày càng tôn vinh các góc nhìn đa chiều, sử dụng ngôn ngữ điện ảnh và thiết kế để khơi gợi sự thấu hiểu.'
      },
      {
        bold: isEn ? 'Educational reforms' : 'Cải cách giáo dục di sản',
        text: isEn
          ? 'are embedding critical social issues into curriculums, preparing future generations to approach the world with a socially and environmentally aware mindset.'
          : 'đang đưa văn hóa truyền thống vào chương trình giảng dạy, giúp thế hệ trẻ tiếp cận và giữ gìn các giá trị bền vững.'
      }
    ]
  };
}

export function useNewsDetail(article: MockArticle) {
  const locale = useLocale();

  const authorName = useMemo(() => getAuthor(article.id), [article.id]);

  const fullDate = useMemo(() => {
    const loc = locale === 'vi' ? 'vi' : 'en';
    return article.dateLong[loc];
  }, [article.dateLong, locale]);

  const content = useMemo(() => {
    const loc = locale === 'vi' ? 'vi' : 'en';
    return getArticleContent(
      article.category[loc],
      article.title[loc],
      article.description[loc],
      loc
    );
  }, [article, locale]);

  return {
    authorName,
    fullDate,
    content,
    locale,
  };
}
