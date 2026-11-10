"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, EyeOff, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_DIALOG_DANGER_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_ROW_ICON_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminField,
  AdminFilterSelect,
  AdminLangSwitch,
  AdminSwitch,
  AdminTextArea,
  AdminTextField,
  AdminTooltip,
  type AdminContentLang,
} from "@/features/admin/core/ui";
import { createFaqAction, deleteFaqAction, reorderFaqsAction, toggleFaqActiveAction, updateFaqAction } from "../../actions/cms.actions";
import { type AdminFaq, type FaqFormValues } from "../../types/cms.types";
import { CMS_FAQ_TOPICS, FAQ_LIMITS, isFaqTopic, type CmsFaqTopic } from "../../utils/cmsRules";

type TopicFilter = "ALL" | CmsFaqTopic | "NONE";
const NEW = "__new__";

/**
 * Bàn soạn FAQ hai khung: trái là câu hỏi gom theo chủ đề đúng thứ tự trang FAQs (↑↓ đổi thứ tự, chấm báo ẩn / thiếu EN),
 * phải là khung soạn của câu đang chọn kèm xem trước dạng accordion như khách thấy. Vùng hẹp: khung soạn thay chỗ danh sách.
 */
export function FaqDesk({ faqs, search, topic }: { faqs: AdminFaq[]; search: string; topic: TopicFilter }) {
  const t = useTranslations("AdminPage.cms");
  const notify = useNotify();
  const router = useRouter();
  const [items, setItems] = useState(faqs);
  const [syncedFrom, setSyncedFrom] = useState(faqs);
  const [selectedId, setSelectedId] = useState<string | null>(faqs[0]?.id ?? null);

  // Server trả dữ liệu mới (router.refresh) → lấy lại danh sách; điều chỉnh state trong render thay vì useEffect
  if (syncedFrom !== faqs) {
    setSyncedFrom(faqs);
    setItems(faqs);
  }

  const keyword = search.trim().toLowerCase();
  const matches = (faq: AdminFaq) =>
    (!keyword || `${faq.question} ${faq.answer} ${faq.questionEn ?? ""}`.toLowerCase().includes(keyword)) &&
    (topic === "ALL" || (topic === "NONE" ? !isFaqTopic(faq.category) : faq.category === topic));
  const groups = [...CMS_FAQ_TOPICS.map((code) => ({ code: code as string | null, items: items.filter((faq) => faq.category === code) })), { code: null, items: items.filter((faq) => !isFaqTopic(faq.category)) }]
    .map((group) => ({ ...group, items: group.items.sort((a, b) => a.order - b.order) }))
    .filter((group) => group.items.some(matches));
  const selected = selectedId === NEW ? null : (items.find((faq) => faq.id === selectedId) ?? null);
  const editing = selectedId !== null;

  const reorder = useMutation({
    mutationFn: (input: { category: string; ids: string[] }) => reorderFaqsAction(input),
    onSuccess: (res) => (res.success ? router.refresh() : notify.error(res.error, "FAQ_REORDER_FAILED")),
    onError: () => notify.error("FAQ_REORDER_FAILED"),
  });
  const toggle = useMutation({
    mutationFn: (faq: AdminFaq) => toggleFaqActiveAction({ faqId: faq.id, isActive: !faq.isActive }),
    onSuccess: (res) => {
      if (!res.success) return notify.error(res.error, "FAQ_UPDATE_FAILED");
      setItems((list) => list.map((faq) => (faq.id === res.data.id ? res.data : faq)));
      notify.success(res.data.isActive ? t("toast.faqShown") : t("toast.faqHidden"));
      router.refresh();
    },
    onError: () => notify.error("FAQ_UPDATE_FAILED"),
  });

  const move = (group: { code: string | null; items: AdminFaq[] }, index: number, delta: number) => {
    if (!group.code) return;
    const ids = group.items.map((faq) => faq.id);
    const [id] = ids.splice(index, 1);
    ids.splice(index + delta, 0, id!);
    // Áp ngay ở client rồi mới gửi — danh sách không nhảy chờ server
    setItems((list) => list.map((faq) => (ids.includes(faq.id) ? { ...faq, order: ids.indexOf(faq.id) } : faq)));
    reorder.mutate({ category: group.code, ids });
  };

  const list = (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-[#E4E4E7] px-4 py-3">
        <p className="text-sm text-[#71717A]">{t("faqs.count", { shown: groups.reduce((sum, group) => sum + group.items.filter(matches).length, 0), total: items.length })}</p>
        <button type="button" onClick={() => setSelectedId(NEW)} className={ADMIN_SECONDARY_BUTTON_CLASS}>
          <Plus size={15} aria-hidden /> {t("faqs.add")}
        </button>
      </div>
      {groups.length === 0 ? (
        <p className="px-4 py-16 text-center text-sm text-[#71717A]">{items.length === 0 ? t("faqs.empty") : t("faqs.noMatch")}</p>
      ) : (
        <div className="divide-y divide-dashed divide-[#E4E4E7]">
          {groups.map((group) => (
            <section key={group.code ?? "none"} className="py-2">
              <h3 className="flex items-center justify-between px-4 py-1.5 text-body font-semibold text-[#09090B]">
                {group.code ? t(`topics.${group.code}`) : t("topics.none")}
                <span className="font-mono text-xs font-normal text-[#A1A1AA]">{group.items.length}</span>
              </h3>
              <ol>
                {group.items.map((faq, index) =>
                  !matches(faq) ? null : (
                    <li key={faq.id} className={cn("group flex items-start gap-2 px-2", selectedId === faq.id && "bg-[#F4F4F5]")}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(faq.id)}
                        aria-current={selectedId === faq.id || undefined}
                        className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2.5 text-left"
                      >
                        <span className="mt-0.5 w-5 shrink-0 text-right font-mono text-xs text-[#A1A1AA]">{index + 1}</span>
                        <span className="min-w-0">
                          <span className={cn("line-clamp-2 text-sm", faq.isActive ? "text-[#09090B]" : "text-[#A1A1AA]")}>{faq.question}</span>
                          <span className="mt-0.5 flex flex-wrap gap-x-2 text-2xs">
                            {!faq.isActive && <span className="text-[#71717A]">{t("faqs.hidden")}</span>}
                            {!(faq.questionEn && faq.answerEn) && <span className="text-amber-700">{t("faqs.noEn")}</span>}
                          </span>
                        </span>
                      </button>
                      {group.code && !keyword && (
                        <span className="flex shrink-0 flex-col py-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                          <button type="button" disabled={index === 0 || reorder.isPending} onClick={() => move(group, index, -1)} aria-label={t("faqs.up")} className={cn(ADMIN_ROW_ICON_BUTTON_CLASS, "size-6")}>
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={index === group.items.length - 1 || reorder.isPending}
                            onClick={() => move(group, index, 1)}
                            aria-label={t("faqs.down")}
                            className={cn(ADMIN_ROW_ICON_BUTTON_CLASS, "size-6")}
                          >
                            <ArrowDown size={13} />
                          </button>
                        </span>
                      )}
                    </li>
                  )
                )}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={cn(ADMIN_CARD_CLASS, "@container overflow-hidden")}>
      <div className="grid @3xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] @3xl:divide-x @3xl:divide-dashed @3xl:divide-[#E4E4E7]">
        <div className={cn(editing && "hidden @3xl:block")}>{list}</div>
        <div className={cn(!editing && "hidden @3xl:block")}>
          {editing ? (
            <FaqEditor
              key={selectedId}
              faq={selected}
              defaultTopic={topic !== "ALL" && topic !== "NONE" ? topic : CMS_FAQ_TOPICS[0]}
              onBack={() => setSelectedId(null)}
              onToggle={(faq) => toggle.mutate(faq)}
              onSaved={(faq) => {
                setItems((list) => (list.some((item) => item.id === faq.id) ? list.map((item) => (item.id === faq.id ? faq : item)) : [...list, faq]));
                setSelectedId(faq.id);
                router.refresh();
              }}
              onDeleted={(id) => {
                setItems((list) => list.filter((faq) => faq.id !== id));
                setSelectedId(null);
                router.refresh();
              }}
            />
          ) : (
            <p className="grid h-full min-h-60 place-items-center px-6 text-center text-sm text-[#A1A1AA]">{t("faqs.pick")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FaqEditor({
  faq,
  defaultTopic,
  onBack,
  onToggle,
  onSaved,
  onDeleted,
}: {
  faq: AdminFaq | null;
  defaultTopic: CmsFaqTopic;
  onBack: () => void;
  onToggle: (faq: AdminFaq) => void;
  onSaved: (faq: AdminFaq) => void;
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("AdminPage.cms");
  const notify = useNotify();
  const [lang, setLang] = useState<AdminContentLang>("vi");
  const [values, setValues] = useState<FaqFormValues>({
    question: faq?.question ?? "",
    questionEn: faq?.questionEn ?? "",
    answer: faq?.answer ?? "",
    answerEn: faq?.answerEn ?? "",
    category: isFaqTopic(faq?.category) ? faq!.category! : defaultTopic,
    isActive: faq?.isActive ?? true,
  });
  const [initial] = useState(values);
  const [showErrors, setShowErrors] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const errors = {
    question: !values.question.trim() ? t("faqs.errors.question") : null,
    answer: !values.answer.trim() ? t("faqs.errors.answer") : null,
  };
  const field = (vi: "question" | "answer") => (lang === "vi" ? vi : (`${vi}En` as const));
  const set = (key: keyof FaqFormValues, value: string | boolean) => setValues((current) => ({ ...current, [key]: value }));

  const save = useMutation({
    mutationFn: () => (faq ? updateFaqAction({ faqId: faq.id, values }) : createFaqAction(values)),
    onSuccess: (res) => {
      if (!res.success) return notify.error(res.error, faq ? "FAQ_UPDATE_FAILED" : "FAQ_CREATE_FAILED");
      notify.success(faq ? t("toast.faqSaved") : t("toast.faqCreated"));
      onSaved(res.data);
    },
    onError: () => notify.error(faq ? "FAQ_UPDATE_FAILED" : "FAQ_CREATE_FAILED"),
  });
  const remove = useMutation({
    mutationFn: () => deleteFaqAction({ faqId: faq!.id }),
    onSuccess: (res) => {
      if (!res.success) return notify.error(res.error, "FAQ_DELETE_FAILED");
      notify.success(t("toast.faqDeleted"));
      onDeleted(res.data.id);
    },
    onError: () => notify.error("FAQ_DELETE_FAILED"),
  });

  const submit = () => {
    setShowErrors(true);
    if (errors.question || errors.answer) {
      setLang("vi");
      return;
    }
    save.mutate();
  };

  const previewQuestion = (lang === "en" && values.questionEn) || values.question;
  const previewAnswer = (lang === "en" && values.answerEn) || values.answer;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-dashed border-[#E4E4E7] px-4 py-3">
        <button type="button" onClick={onBack} aria-label={t("faqs.back")} className={cn(ADMIN_ROW_ICON_BUTTON_CLASS, "@3xl:hidden")}>
          <ArrowLeft size={16} />
        </button>
        <h3 className="min-w-0 flex-1 truncate text-lg font-semibold text-[#09090B]">{faq ? t("faqs.editTitle") : t("faqs.newTitle")}</h3>
        {dirty && <span className="hidden text-xs text-amber-700 sm:inline">{t("unsaved")}</span>}
        <AdminLangSwitch
          value={lang}
          onChange={setLang}
          label={t("lang")}
          hint={t("faqs.langHint")}
          status={{ en: !values.questionEn.trim() || !values.answerEn.trim() ? "missing" : undefined }}
          missingLabel={t("missing")}
        />
      </div>

      <div className="flex-1 space-y-4 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <AdminField label={t("faqs.field.topic")} required>
            <AdminFilterSelect
              label={t("faqs.field.topicShort")}
              value={values.category}
              onChange={(category) => set("category", category)}
              options={CMS_FAQ_TOPICS.map((code) => ({ value: code, label: t(`topics.${code}`) }))}
              className="h-10 w-full"
            />
          </AdminField>
          <AdminField label={t("faqs.field.active")} hint={t("faqs.field.activeHint")}>
            <div className="flex h-10 items-center gap-3">
              <AdminSwitch checked={values.isActive} onChange={(isActive) => set("isActive", isActive)} label={t("faqs.field.active")} />
              <span className="text-sm text-[#52525B]">{values.isActive ? t("faqs.visible") : t("faqs.hidden")}</span>
            </div>
          </AdminField>
        </div>
        <AdminTextField
          key={`q-${lang}`}
          required={lang === "vi"}
          label={t("faqs.field.question")}
          value={values[field("question")]}
          onValueChange={(next) => set(field("question"), next.slice(0, FAQ_LIMITS.question))}
          placeholder={lang === "vi" ? t("faqs.placeholder.question") : values.question || t("faqs.placeholder.question")}
          error={lang === "vi" && showErrors ? (errors.question ?? undefined) : undefined}
        />
        <AdminTextArea
          key={`a-${lang}`}
          required={lang === "vi"}
          label={t("faqs.field.answer")}
          hint={t("faqs.field.answerHint")}
          rows={7}
          value={values[field("answer")]}
          onChange={(event) => set(field("answer"), event.target.value.slice(0, FAQ_LIMITS.answer))}
          placeholder={lang === "vi" ? t("faqs.placeholder.answer") : values.answer || t("faqs.placeholder.answer")}
          error={lang === "vi" && showErrors ? (errors.answer ?? undefined) : undefined}
        />
        <p className="-mt-2 text-right font-mono text-2xs text-[#A1A1AA]">
          {values[field("answer")].length}/{FAQ_LIMITS.answer}
        </p>

        {/* Xem trước một dòng accordion như trang FAQs (đơn giản hóa — không dùng font / màu storefront ngoài token) */}
        {previewQuestion && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-[#71717A]">{t("faqs.preview")}</p>
            <div className="rounded-xl border border-[#E4E4E7] bg-(--bg-main) text-(--text-main)">
              <button type="button" onClick={() => setPreviewOpen((open) => !open)} className="flex w-full cursor-pointer items-start justify-between gap-3 px-4 py-3 text-left">
                <span className="text-sm font-medium">{previewQuestion}</span>
                <ChevronDown size={16} className={cn("mt-0.5 shrink-0 transition-transform", previewOpen && "rotate-180")} aria-hidden />
              </button>
              {previewOpen && previewAnswer && <p className="whitespace-pre-line border-t border-[#E4E4E7] px-4 py-3 text-sm leading-relaxed text-(--text-light)">{previewAnswer}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-[#E4E4E7] px-4 py-3">
        {faq && (
          <>
            <AdminTooltip content={t("faqs.delete")}>
              <button type="button" onClick={() => setConfirmDelete(true)} aria-label={t("faqs.delete")} className={cn(ADMIN_ROW_ICON_BUTTON_CLASS, "hover:text-rose-600")}>
                <Trash2 size={16} />
              </button>
            </AdminTooltip>
            {!dirty && (
              <button type="button" onClick={() => onToggle(faq)} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                <EyeOff size={15} aria-hidden /> {faq.isActive ? t("faqs.hide") : t("faqs.show")}
              </button>
            )}
          </>
        )}
        <span className="mr-auto" />
        {dirty && (
          <button type="button" onClick={() => setValues(initial)} className={ADMIN_SECONDARY_BUTTON_CLASS}>
            {t("discard")}
          </button>
        )}
        <button type="button" disabled={save.isPending || (!dirty && Boolean(faq))} onClick={submit} className={ADMIN_PRIMARY_BUTTON_CLASS}>
          {save.isPending ? t("saving") : faq ? t("save") : t("faqs.create")}
        </button>
      </div>

      {confirmDelete && faq && (
        <AdminDialog
          open
          onOpenChange={(open) => !open && !remove.isPending && setConfirmDelete(false)}
          icon={Trash2}
          tone="danger"
          title={t("faqs.deleteDialog.title")}
          description={faq.question}
          footer={
            <>
              <button type="button" onClick={() => setConfirmDelete(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
                {t("cancel")}
              </button>
              <button type="button" disabled={remove.isPending} onClick={() => remove.mutate()} className={ADMIN_DIALOG_DANGER_BUTTON_CLASS}>
                {t("faqs.delete")}
              </button>
            </>
          }
        >
          <p className="text-sm text-[#3F3F46]">{t("faqs.deleteDialog.body")}</p>
        </AdminDialog>
      )}
    </div>
  );
}
