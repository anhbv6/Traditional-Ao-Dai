import React from 'react'

type SectionHeadingProps = {
    eyebrow: string;
    title: string;
    description?: string;
}

function SectionHeading({
    eyebrow,
    title,
    description,
}: SectionHeadingProps) {
    return (
        <div className="mx-auto mb-7 max-w-3xl text-center sm:mb-9">
            <p className="text-xs font-semibold uppercase tracking-[2.5px] text-[#800020]">{eyebrow}</p>
            <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#800020] sm:text-4xl">
                {title}
            </h2>
            {description ? <p className="mt-3 text-sm leading-7 text-[#706565] sm:text-base">{description}</p> : null}
        </div>
    )
}

export default SectionHeading