import { type AdminCategoryNode } from "../types/categories.types";

/** Danh sách anh em cùng cha (null = nhóm gốc) */
export function getSiblings(tree: AdminCategoryNode[], parentId: string | null): AdminCategoryNode[] {
  if (parentId === null) return tree;
  return tree.find((root) => root.id === parentId)?.children ?? [];
}

/** Thay danh sách anh em sau khi sắp xếp lại, giữ nguyên phần còn lại của cây */
export function replaceSiblings(
  tree: AdminCategoryNode[],
  parentId: string | null,
  siblings: AdminCategoryNode[]
): AdminCategoryNode[] {
  const reindexed = siblings.map((node, position) => ({ ...node, position }));
  if (parentId === null) return reindexed;
  return tree.map((root) => (root.id === parentId ? { ...root, children: reindexed } : root));
}

/** Di chuyển `id` tới vị trí của `targetId` (trước hoặc sau) trong cùng danh sách */
export function moveSibling(
  siblings: AdminCategoryNode[],
  id: string,
  targetId: string,
  placement: "before" | "after"
): AdminCategoryNode[] {
  const moving = siblings.find((node) => node.id === id);
  if (!moving || id === targetId) return siblings;
  const rest = siblings.filter((node) => node.id !== id);
  const targetIndex = rest.findIndex((node) => node.id === targetId);
  if (targetIndex < 0) return siblings;
  rest.splice(placement === "before" ? targetIndex : targetIndex + 1, 0, moving);
  return rest;
}

/** Tìm nút theo id ở cả hai cấp */
export function findCategory(tree: AdminCategoryNode[], id: string): AdminCategoryNode | undefined {
  for (const root of tree) {
    if (root.id === id) return root;
    const child = root.children.find((node) => node.id === id);
    if (child) return child;
  }
  return undefined;
}

/** Lọc cây theo từ khóa: giữ nhóm gốc nếu chính nó hoặc một loại con khớp */
export function filterTree(tree: AdminCategoryNode[], keyword: string): AdminCategoryNode[] {
  const query = keyword.trim().toLowerCase();
  if (!query) return tree;
  const matches = (node: AdminCategoryNode) =>
    [node.name, node.nameEn ?? "", node.slug].some((value) => value.toLowerCase().includes(query));
  return tree.flatMap((root) => {
    if (matches(root)) return [root];
    const children = root.children.filter(matches);
    return children.length > 0 ? [{ ...root, children }] : [];
  });
}

/** Lọc cây theo nhóm hàng: giữ nhóm gốc khớp hoặc có loại con khớp; loại con chỉ giữ những cái khớp */
export function filterTreeByGroup(
  tree: AdminCategoryNode[],
  group: AdminCategoryNode["group"] | "ALL"
): AdminCategoryNode[] {
  if (group === "ALL") return tree;
  return tree.flatMap((root) => {
    const children = root.children.filter((child) => child.group === group);
    return root.group === group || children.length > 0 ? [{ ...root, children }] : [];
  });
}
