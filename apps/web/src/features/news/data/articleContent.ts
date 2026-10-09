/**
 * Nội dung thân bài mock theo danh mục — thay bằng nội dung từ CMS khi có module bài viết ở Backend.
 * Mỗi bài gồm: đoạn mở đầu (chèn mô tả bài), các mục có tiêu đề (dùng cho mục lục), một lời trích và lời kêu gọi hành động.
 */

export type ArticleCategoryKey = "guide" | "tips" | "culture" | "trends" | "tailoring";

export interface ArticleSection {
  /** Mã neo cố định (không đổi theo ngôn ngữ) — dùng cho mục lục `#id` */
  id: string;
  heading: string;
  paragraphs: string[];
  highlights?: Array<{ bold: string; text: string }>;
}

export interface ArticleContent {
  intro: string;
  sections: ArticleSection[];
  quote: { text: string; author: string };
}

type Localized<T> = { vi: T; en: T };

/** Danh mục -> nội dung (hai ngôn ngữ). `{description}` được thay bằng mô tả của bài */
const CONTENT: Record<ArticleCategoryKey, Localized<ArticleContent>> = {
  guide: {
    vi: {
      intro:
        "Một tà áo dài đẹp không chỉ nằm ở đường cắt may mà còn ở cách người mặc nâng niu nó sau mỗi lần diện. {description}",
      sections: [
        {
          id: "fabric",
          heading: "Hiểu chất liệu trước khi giặt",
          paragraphs: [
            "Lụa tơ tằm, gấm, nhung và voan có cấu trúc sợi rất khác nhau. Lụa tơ tằm là sợi protein tự nhiên nên kỵ xà phòng có tính kiềm; gấm và nhung có bề mặt dệt nổi dễ xù nếu bị chà xát; voan mỏng nhẹ dễ co rút khi gặp nhiệt.",
            "Vì vậy, trước khi giặt hãy xem nhãn chất liệu trên áo. Với những mẫu thêu tay hoặc đính cườm, ưu tiên giặt hấp tại tiệm chuyên dụng để giữ nguyên đường thêu.",
          ],
        },
        {
          id: "washing",
          heading: "Giặt và ủi đúng cách",
          paragraphs: [
            "Giặt tay bằng nước lạnh hoặc nước ấm dưới 30°C, ngâm tối đa 5 phút với sữa tắm dịu nhẹ, tuyệt đối không vắt xoắn. Phơi trong bóng râm, lộn mặt trái để giữ màu.",
          ],
          highlights: [
            { bold: "Lụa tơ tằm:", text: "giặt nước lạnh, không dùng nước xả có hương liệu mạnh." },
            { bold: "Gấm và nhung:", text: "giặt hấp hoặc chỉ làm sạch cục bộ vết bẩn." },
            { bold: "Ủi hơi nước:", text: "ủi mặt trái ở nhiệt độ thấp nhất, lót một lớp vải cotton mỏng." },
            { bold: "Áo thêu tay:", text: "không ủi trực tiếp lên đường thêu để tránh bóng chỉ." },
          ],
        },
        {
          id: "storage",
          heading: "Cất giữ áo dài qua mùa",
          paragraphs: [
            "Treo áo bằng móc gỗ bản rộng để giữ phom vai, bọc trong túi vải cotton thoáng khí thay vì túi nilon. Đặt vài túi hút ẩm hoặc gói long não nhỏ trong tủ, nhất là vào mùa nồm.",
            "Mỗi vài tháng, hãy lấy áo ra hong gió để sợi vải 'thở' và kiểm tra các đường may, khuy bấm trước những dịp quan trọng.",
          ],
        },
      ],
      quote: {
        text: "Áo dài giữ được bao lâu là do người mặc thương nó đến đâu.",
        author: "Nghệ nhân may đo AODAI",
      },
    },
    en: {
      intro:
        "A beautiful Ao Dai is not only about its cut, but also about how its owner cares for it after every wear. {description}",
      sections: [
        {
          id: "fabric",
          heading: "Know your fabric before washing",
          paragraphs: [
            "Mulberry silk, brocade, velvet and chiffon have very different fibre structures. Silk is a natural protein fibre that dislikes alkaline soap; brocade and velvet have raised weaves that pill when rubbed; chiffon is light and can shrink under heat.",
            "Always check the care label first. For hand-embroidered or beaded pieces, choose professional dry cleaning to protect the embroidery.",
          ],
        },
        {
          id: "washing",
          heading: "Washing and ironing the right way",
          paragraphs: [
            "Hand-wash in cold or lukewarm water below 30°C, soak for no more than 5 minutes with a gentle wash and never wring. Dry in the shade, inside out, to protect the colour.",
          ],
          highlights: [
            { bold: "Mulberry silk:", text: "cold water only, avoid heavily scented softeners." },
            { bold: "Brocade and velvet:", text: "dry clean or spot-clean stains only." },
            { bold: "Steam ironing:", text: "iron inside out on the lowest setting with a thin cotton cloth." },
            { bold: "Hand embroidery:", text: "never iron directly over the stitches." },
          ],
        },
        {
          id: "storage",
          heading: "Storing your Ao Dai between seasons",
          paragraphs: [
            "Hang it on a wide wooden hanger to keep the shoulders in shape and cover it with a breathable cotton bag instead of plastic. Add silica packs to the wardrobe, especially in humid months.",
            "Every few months, air the garment out and check the seams and snaps before an important occasion.",
          ],
        },
      ],
      quote: {
        text: "How long an Ao Dai lasts depends on how lovingly it is kept.",
        author: "AODAI master tailor",
      },
    },
  },
  tips: {
    vi: {
      intro: "Chọn đúng một tà áo dài là chọn cả chất liệu, phom dáng và màu sắc hợp với bạn và dịp bạn sẽ mặc. {description}",
      sections: [
        {
          id: "occasion",
          heading: "Bắt đầu từ dịp bạn sẽ mặc",
          paragraphs: [
            "Lễ cưới, ăn hỏi cần chất liệu đứng phom như gấm, nhung với gam đỏ đô, vàng; dịp Tết hợp lụa in hoa và màu tươi; công sở nên chọn lụa trơn, voan hai lớp với màu trầm nhã nhặn.",
          ],
        },
        {
          id: "silhouette",
          heading: "Chọn phom dáng tôn vóc người",
          paragraphs: [
            "Người nhỏ nhắn nên chọn tà dài vừa phải và cổ cao 3–4 cm để kéo dài cổ; người đầy đặn hợp chất liệu rủ mềm, màu trầm và đường chiết eo rõ. Áo cách tân tay lỡ phù hợp những buổi dạo phố, chụp ảnh.",
          ],
          highlights: [
            { bold: "Dáng nhỏ:", text: "tà áo chạm mắt cá, quần ống suông cùng tông để hack chiều cao." },
            { bold: "Dáng đầy đặn:", text: "lụa tơ tằm hoặc voan rủ, tránh gấm dày cứng." },
            { bold: "Vai rộng:", text: "chọn cổ thuyền hoặc cổ tim cách tân thay cho cổ cao truyền thống." },
          ],
        },
        {
          id: "size",
          heading: "Size may sẵn hay may đo?",
          paragraphs: [
            "Nếu số đo nằm trọn trong bảng size, áo may sẵn là lựa chọn nhanh và tiết kiệm. Nếu chênh lệch vòng ngực và vòng eo lớn, hoặc cần áo cho dịp quan trọng, hãy chọn may đo để áo ôm đúng dáng.",
          ],
        },
      ],
      quote: { text: "Áo đẹp nhất là chiếc áo khiến bạn quên mình đang mặc nó.", author: "Stylist AODAI" },
    },
    en: {
      intro: "Choosing the right Ao Dai means matching fabric, silhouette and colour to you and to the occasion. {description}",
      sections: [
        {
          id: "occasion",
          heading: "Start with the occasion",
          paragraphs: [
            "Weddings and engagement ceremonies call for structured brocade or velvet in burgundy and gold; Tet suits printed silk in vivid colours; for the office, choose plain silk or double-layer chiffon in muted tones.",
          ],
        },
        {
          id: "silhouette",
          heading: "Pick a silhouette that flatters you",
          paragraphs: [
            "Petite figures look best with a moderate hem and a 3–4 cm collar to lengthen the neck; fuller figures suit soft, draping fabrics, deeper colours and a defined waist. Modern short-sleeve styles are great for photos and city strolls.",
          ],
          highlights: [
            { bold: "Petite:", text: "ankle-length panels with same-tone trousers to add height." },
            { bold: "Fuller figure:", text: "mulberry silk or draping chiffon, avoid stiff heavy brocade." },
            { bold: "Broad shoulders:", text: "a boat neck or modern V-neck instead of a high collar." },
          ],
        },
        {
          id: "size",
          heading: "Ready-made size or custom tailoring?",
          paragraphs: [
            "If your measurements fit the size chart, ready-to-wear is quick and affordable. If your bust and waist differ significantly, or the occasion matters a lot, custom tailoring gives a perfect fit.",
          ],
        },
      ],
      quote: { text: "The best Ao Dai is the one you forget you are wearing.", author: "AODAI stylist" },
    },
  },
  culture: {
    vi: {
      intro: "Hơn ba thế kỷ, tà áo dài đã đi cùng người Việt qua bao thăng trầm và trở thành biểu tượng của nét duyên dáng Việt Nam. {description}",
      sections: [
        {
          id: "origin",
          heading: "Từ áo ngũ thân đến áo dài tân thời",
          paragraphs: [
            "Tiền thân của áo dài là áo ngũ thân thời chúa Nguyễn với năm vạt tượng trưng cho cha mẹ, vợ chồng và bản thân. Đầu thế kỷ XX, các họa sĩ Cát Tường và Lê Phổ đã cách tân phom áo ôm sát hơn, tạo nên dáng áo dài mà ta thấy ngày nay.",
          ],
        },
        {
          id: "motifs",
          heading: "Ý nghĩa những họa tiết quen thuộc",
          paragraphs: ["Mỗi họa tiết thêu trên áo đều mang một lời chúc gửi người mặc."],
          highlights: [
            { bold: "Hoa sen:", text: "thanh khiết, gắn với tâm hồn người Việt." },
            { bold: "Chim hạc:", text: "trường thọ, thường xuất hiện trên áo dài mừng thọ." },
            { bold: "Song hỷ, long phượng:", text: "hạnh phúc lứa đôi, dành cho áo dài cưới." },
            { bold: "Hoa mai, hoa đào:", text: "may mắn, khởi đầu mới trong dịp Tết." },
          ],
        },
        {
          id: "today",
          heading: "Áo dài trong đời sống hôm nay",
          paragraphs: [
            "Áo dài không chỉ là trang phục lễ hội mà còn hiện diện ở trường học, công sở và trên các sàn diễn quốc tế. Mỗi lần khoác lên tà áo, người mặc lại tiếp nối một phần câu chuyện văn hóa ấy.",
          ],
        },
      ],
      quote: { text: "Áo dài là tà áo mà mỗi đường kim đều kể chuyện quê hương.", author: "Nghệ nhân thêu tay AODAI" },
    },
    en: {
      intro: "For more than three centuries the Ao Dai has accompanied the Vietnamese through history and become a symbol of national grace. {description}",
      sections: [
        {
          id: "origin",
          heading: "From the five-panel gown to the modern Ao Dai",
          paragraphs: [
            "The Ao Dai descends from the five-panel gown of the Nguyen lords, whose panels symbolised parents, spouses and oneself. In the early 20th century, painters Cat Tuong and Le Pho reshaped it into the fitted silhouette we know today.",
          ],
        },
        {
          id: "motifs",
          heading: "The meaning of familiar motifs",
          paragraphs: ["Every embroidered motif carries a wish for the wearer."],
          highlights: [
            { bold: "Lotus:", text: "purity, closely tied to the Vietnamese spirit." },
            { bold: "Crane:", text: "longevity, often seen on Ao Dai for longevity celebrations." },
            { bold: "Double happiness, dragon and phoenix:", text: "marital bliss, for wedding Ao Dai." },
            { bold: "Apricot and peach blossoms:", text: "good fortune and new beginnings at Tet." },
          ],
        },
        {
          id: "today",
          heading: "The Ao Dai in everyday life",
          paragraphs: [
            "Today the Ao Dai is worn not only at festivals but also at schools, offices and on international runways. Each time it is worn, the wearer continues part of that cultural story.",
          ],
        },
      ],
      quote: { text: "In an Ao Dai, every stitch tells a story of home.", author: "AODAI embroidery artisan" },
    },
  },
  trends: {
    vi: {
      intro: "Xu hướng áo dài mỗi mùa là cuộc đối thoại giữa nét truyền thống và nhịp sống hiện đại. {description}",
      sections: [
        {
          id: "colors",
          heading: "Gam màu dẫn đầu mùa này",
          paragraphs: [
            "Đỏ đô, vàng nghệ và xanh ngọc tiếp tục được ưa chuộng cho dịp lễ Tết; trong khi các tông pastel như hồng đất, xanh rêu nhạt phù hợp những buổi chụp ảnh ngoài trời.",
          ],
        },
        {
          id: "details",
          heading: "Chi tiết cách tân được yêu thích",
          paragraphs: ["Những điểm nhấn nhỏ giúp áo dài trẻ trung mà vẫn giữ được hồn cốt."],
          highlights: [
            { bold: "Tay lỡ, tay phồng nhẹ:", text: "thoải mái hơn khi di chuyển, hợp dạo phố." },
            { bold: "Cổ thuyền, cổ tim:", text: "mềm mại, tôn xương quai xanh." },
            { bold: "Thêu tay điểm xuyết:", text: "họa tiết nhỏ ở vạt áo thay cho thêu kín thân." },
            { bold: "Chất liệu bền vững:", text: "lụa tơ tằm tự nhiên, nhuộm màu thực vật." },
          ],
        },
        {
          id: "styling",
          heading: "Phối áo dài cho nhịp sống hiện đại",
          paragraphs: [
            "Áo dài cách tân có thể phối cùng quần ống rộng, chân váy suông hoặc thậm chí giày sneaker trắng. Phụ kiện tối giản như túi cói, khuyên tai ngọc trai giúp tổng thể nhẹ nhàng, tinh tế.",
          ],
        },
      ],
      quote: { text: "Cách tân là để áo dài sống cùng thời đại, không phải để quên đi gốc rễ.", author: "Nhà thiết kế AODAI" },
    },
    en: {
      intro: "Each season, Ao Dai trends are a conversation between tradition and modern life. {description}",
      sections: [
        {
          id: "colors",
          heading: "This season's leading colours",
          paragraphs: [
            "Burgundy, turmeric yellow and jade remain favourites for festivals, while pastels such as dusty rose and soft moss green suit outdoor photo shoots.",
          ],
        },
        {
          id: "details",
          heading: "Popular modern details",
          paragraphs: ["Small touches keep the Ao Dai youthful while preserving its soul."],
          highlights: [
            { bold: "Elbow or soft puff sleeves:", text: "easier to move in, great for city wear." },
            { bold: "Boat or V-neck:", text: "softer lines that flatter the collarbone." },
            { bold: "Accent embroidery:", text: "small motifs on the panel instead of full embroidery." },
            { bold: "Sustainable fabrics:", text: "natural mulberry silk with plant-based dyes." },
          ],
        },
        {
          id: "styling",
          heading: "Styling the Ao Dai for modern life",
          paragraphs: [
            "Modern Ao Dai pair well with wide-leg trousers, straight skirts or even white sneakers. Minimal accessories such as a rattan bag or pearl earrings keep the look light and refined.",
          ],
        },
      ],
      quote: { text: "Modernising the Ao Dai lets it live with our times without forgetting its roots.", author: "AODAI designer" },
    },
  },
  tailoring: {
    vi: {
      intro: "Một chiếc áo dài may đo vừa vặn là kết quả của số đo chính xác và nhiều buổi thử áo tỉ mỉ. {description}",
      sections: [
        {
          id: "measure",
          heading: "Những số đo cần có",
          paragraphs: ["Để áo ôm dáng mà vẫn thoải mái, thợ may cần tối thiểu các số đo sau (đơn vị cm):"],
          highlights: [
            { bold: "Vòng 1, 2, 3:", text: "đo sát người, thước dây song song mặt đất." },
            { bold: "Hạ ngực, hạ eo:", text: "từ đỉnh vai xuống điểm cao nhất của ngực và eo." },
            { bold: "Dài áo:", text: "từ đỉnh vai đến vị trí tà áo mong muốn (thường qua gối 10–20 cm)." },
            { bold: "Dài tay, vòng nách:", text: "đo khi tay thả lỏng tự nhiên." },
          ],
        },
        {
          id: "process",
          heading: "Quy trình may đo tại AODAI",
          paragraphs: [
            "Sau khi nhận số đo, nghệ nhân cắt rập riêng và may thô để thử lần đầu. Áo được chỉnh sửa theo dáng thực tế rồi mới hoàn thiện đường viền, khuy bấm và thêu (nếu có). Toàn bộ quy trình mất khoảng 7–10 ngày.",
          ],
        },
        {
          id: "notes",
          heading: "Lưu ý trước khi đặt may",
          paragraphs: [
            "Hãy đo vào buổi sáng, mặc đồ lót bạn sẽ dùng với áo dài và giữ tư thế đứng thẳng tự nhiên. Áo may đo theo số đo riêng không áp dụng đổi trả, trừ trường hợp lỗi kỹ thuật, vì vậy đừng ngại hỏi thợ may khi chưa chắc chắn.",
          ],
        },
      ],
      quote: { text: "Một tấc vải vừa người hơn mười thước vải đẹp.", author: "Thợ cả AODAI" },
    },
    en: {
      intro: "A perfectly fitted bespoke Ao Dai is the result of accurate measurements and careful fittings. {description}",
      sections: [
        {
          id: "measure",
          heading: "Measurements you will need",
          paragraphs: ["To fit closely yet comfortably, the tailor needs at least these measurements (in cm):"],
          highlights: [
            { bold: "Bust, waist, hips:", text: "measure snugly with the tape parallel to the floor." },
            { bold: "Bust and waist depth:", text: "from the top of the shoulder to the bust point and waist." },
            { bold: "Length:", text: "from the shoulder to the desired hem (usually 10–20 cm below the knee)." },
            { bold: "Sleeve and armhole:", text: "measured with arms relaxed." },
          ],
        },
        {
          id: "process",
          heading: "Our tailoring process",
          paragraphs: [
            "Once we receive your measurements, our artisans draft a personal pattern and sew a first fitting. The garment is adjusted to your real figure before the hems, snaps and embroidery (if any) are finished. The whole process takes about 7–10 days.",
          ],
        },
        {
          id: "notes",
          heading: "Before you order",
          paragraphs: [
            "Measure in the morning, wear the underwear you plan to wear with the Ao Dai and stand naturally straight. Bespoke pieces are not eligible for return except for manufacturing defects, so do ask our tailors if you are unsure.",
          ],
        },
      ],
      quote: { text: "An inch of cloth that fits beats ten metres of beautiful fabric.", author: "AODAI head tailor" },
    },
  },
};

const CATEGORY_ALIASES: Record<string, ArticleCategoryKey> = {
  guide: "guide",
  tips: "tips",
  culture: "culture",
  trends: "trends",
  tailoring: "tailoring",
};

/** Suy ra khóa danh mục từ tên danh mục tiếng Anh của bài (mặc định: cẩm nang) */
export function getArticleCategoryKey(categoryEn: string): ArticleCategoryKey {
  return CATEGORY_ALIASES[categoryEn.trim().toLowerCase()] ?? "guide";
}

export function getArticleContent(categoryKey: ArticleCategoryKey, description: string, locale: "vi" | "en"): ArticleContent {
  const content = CONTENT[categoryKey][locale];
  return { ...content, intro: content.intro.replace("{description}", description) };
}
