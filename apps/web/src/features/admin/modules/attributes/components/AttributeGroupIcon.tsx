import { createElement } from "react";
import { type LucideProps } from "lucide-react";
import { ATTRIBUTE_GROUP_ICONS, DEFAULT_GROUP_ICON } from "../utils/attributeMeta";

/** Icon của nhóm thuộc tính theo mã — nhóm admin tự thêm dùng icon nhãn chung */
export function AttributeGroupIcon({ code, ...props }: { code: string } & LucideProps) {
  return createElement(ATTRIBUTE_GROUP_ICONS[code] ?? DEFAULT_GROUP_ICON, props);
}
