import { ChevronDown } from 'lucide-react';
import React, { ReactNode } from 'react'

type FilterSectionProps = {
    title: string; 
    children: ReactNode;
}

function FilterSection({
    title, 
    children
}: FilterSectionProps) {
  return (
    <section className="border-t border-[var(--bg-secondary)] py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--text-main)]">{title}</h3>
        <ChevronDown size={16} className="text-[var(--text-light)]" />
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export default FilterSection