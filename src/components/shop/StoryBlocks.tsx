"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type StoryBlock = {
  tab: string;
  title: string;
  paragraphs: string[];
  imageUrl?: string;
  imageAlt?: string;
};

const STORY_BLOCKS: StoryBlock[] = [
  {
    tab: "Exchange",
    title: "FedorPharm - гарантия высокого качества!",
    imageUrl: "/story/1.png",
    imageAlt: "FedorPharm - гарантия качества",
    paragraphs: [
      "FedorPharm - молодая и амбициозная компания, основная цель которой заключается в поставке качественных стероидов по умеренным ценам.",
      "Наш каталог продукции включает широкий ассортимент препаратов от самых известных мировых производителей, что позволяет абсолютно каждому подобрать подходящий курс для себя.",
      "FedorPharm: Ваш надежный проводник в мире спортивной фармакологии",
      "Интернет-магазин FedorPharm предлагает оригинальные препараты спортивной фармакологии премиального качества. Если вы ищете, где приобрести сертифицированные стероиды, добро пожаловать на наш портал. У нас вы найдете продукцию, произведенную в строгом соответствии с международными стандартами и требованиями фармацевтической индустрии.",
    ],
  },
  {
    tab: "Send",
    title: "Разрушаем мифы о стероидах",
    imageUrl: "/story/2.png",
    imageAlt: "Разрушаем мифы о стероидах",
    paragraphs: [
      "Вокруг анаболических стероидов сложилось множество мифов - от историй, рассказанных знакомыми, до материалов из телевизионных передач. Часто можно услышать о вреде для внутренних органов, угнетении собственных гормонов и прочих ужасах. Важно понимать: критические последствия для здоровья чаще всего наступают не от самих стероидов, а от их бесконтрольного применения в диких дозировках, замешанного на незнании фармакологии.",
      "Анаболики - это серьезный инструмент, требующий осознанного подхода. Прежде чем бежать за курсом, основываясь на советах \"бывалых\" из тренажерного зала, необходимо самостоятельно изучить вопрос, понять принципы действия и возможные риски. Только при грамотном подходе ваш организм отреагирует положительно, позволяя чувствовать себя превосходно как физически, так и эстетически. Купить анаболические стероиды имеет смысл только тогда, когда вы полностью разобрались в этой теме.",
    ],
  },
  {
    tab: "Top up",
    title: "О нашей продукции",
    imageUrl: "/story/3.png",
    imageAlt: "О нашей продукции",
    paragraphs: [
      "Анаболические стероиды - это соединения, которые позволяют спортсмену выйти на новый уровень, ускоряя синтез белка и способствуя быстрому набору качественной мышечной массы. Результат их применения - не только эстетичное, рельефное тело, но и взрывной рост силовых показателей и выносливости.",
      "Современная фармакология позволяет добиться впечатляющих результатов в сжатые сроки. Вам больше не нужно проводить долгие годы в \"застое\", чтобы обрести фигуру мечты или избавиться от лишнего жира. Достаточно составить грамотный, эффективный курс, подкрепить его интенсивным тренингом и сбалансированным питанием - и прогресс не заставит себя ждать.",
    ],
  },
  {
    tab: "Convert",
    title: "Наш ассортимент и преимущества",
    imageUrl: "/story/4.png",
    imageAlt: "Наш ассортимент и преимущества",
    paragraphs: [
      "В каталоге FedorPharm представлен обширный выбор препаратов как для профессиональных атлетов, так и для новичков. Мы сотрудничаем исключительно с проверенными производителями (SP Laboratories, Pharmacom, ERGO, Balkan Pharmaceuticals, ZPHC и др.). Мы гарантируем, что вся продукция является оригинальной, имеет сертификаты качества и уникальные коды проверки. У нас можно купить стероиды по цене, которая вас приятно удивит.",
    ],
  },
  {
    tab: "Benefits",
    title: "Почему выбирают FedorPharm?",
    imageUrl: "/story/5.png",
    imageAlt: "Почему выбирают FedorPharm",
    paragraphs: [
      "Наш магазин молод, но мы уже зарекомендовали себя как надежный партнер среди всех проверенных площадок России. Мы строим работу на качестве и индивидуальном подходе, поэтому недовольных клиентов у нас не бывает. Обращаясь к нам, вы получаете:",
      "Широкий выбор высокоэффективных препаратов.",
      "Удобство оформления и гибкие способы оплаты.",
      "Оперативную доставку и бережное отношение к грузу.",
      "100% гарантию качества на весь перечень товаров.",
      "Профессиональную консультацию по составлению безопасных и результативных курсов.",
      "С каждым днем все больше атлетов принимают решение купить стероиды именно у нас. Мы ценим доверие и предоставляем лучшие условия сотрудничества. Наши специалисты на связи 24/7, чтобы помочь вам с выбором и дать рекомендации по приему. Помимо стероидов, у нас можно приобрести пептиды и все необходимое для качественной послекурсовой терапии (ПКТ).",
      "Здоровье клиентов - наш приоритет. Вся продукция проходит тщательный контроль, мы гарантируем полную конфиденциальность и быструю связь. Именно поэтому, если вам нужно купить стероиды в Москве или любом другом регионе России, ваш выбор - FedorPharm!",
    ],
  },
];

export function StoryBlocks() {
  const [progress, setProgress] = useState(0);
  const markerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const maxIndex = STORY_BLOCKS.length - 1;

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const markers = markerRefs.current.filter(Boolean) as HTMLDivElement[];
      if (markers.length < 2) return;

      const firstY = window.scrollY + markers[0].getBoundingClientRect().top;
      const lastY = window.scrollY + markers[markers.length - 1].getBoundingClientRect().top;
      const total = Math.max(1, lastY - firstY);
      const focus = window.scrollY + window.innerHeight * 0.52;

      const raw = ((focus - firstY) / total) * (STORY_BLOCKS.length - 1);
      const clamped = Math.max(0, Math.min(maxIndex, raw));
      setProgress(clamped);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const renderFeatureCard = (block: StoryBlock, idx: number) => {
    return (
      <div className="grid h-full grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] overflow-hidden rounded-[28px] border border-brand/10 bg-white shadow-[0_16px_36px_-24px_rgba(7,26,54,0.45)]">
        <div className="p-5 pr-4">
          <div className="space-y-2 text-[13px] leading-[1.32] text-brand-muted">
            {block.paragraphs.map((paragraph, paragraphIdx) => (
              <p key={`${idx}-${paragraphIdx}`}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div
          className={
            block.imageUrl
              ? "relative overflow-hidden border-l border-brand/10 bg-gradient-to-br from-[#fbfdff] to-[#ecf5ff]"
              : "relative border-l border-brand/10 bg-gradient-to-br from-[#fbfdff] to-[#ecf5ff] p-5"
          }
        >
          <div className="absolute right-4 top-3 z-20 text-6xl font-black leading-none text-brand/10">{idx + 1}</div>
          {block.imageUrl ? (
            <>
              <Image
                src={block.imageUrl}
                alt={block.imageAlt || block.title}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 280px, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
            </>
          ) : (
            <>
              <div className="relative mt-8 rounded-xl border border-brand/25 bg-white p-3 shadow-sm">
                <div className="h-3 w-16 rounded-full bg-brand/25" />
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-full rounded-full bg-brand/10" />
                  <div className="h-2 w-5/6 rounded-full bg-brand/10" />
                  <div className="h-2 w-3/4 rounded-full bg-brand/10" />
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-brand/15 bg-white p-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-16 rounded-md bg-brand/8" />
                  <div className="h-16 rounded-md bg-brand/8" />
                  <div className="col-span-2 h-20 rounded-md bg-brand/10" />
                </div>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-brand/10" />
              <div className="mt-2 h-2 w-4/5 rounded-full bg-brand/10" />
            </>
          )}
        </div>
      </div>
    );
  };

  const stackLayersCount = Math.min(
    maxIndex,
    Math.max(0, Math.floor(progress + (progress > maxIndex - 0.28 ? 0.28 : 0))),
  );
  const activeIndex = Math.max(0, Math.min(maxIndex, Math.floor(progress + 0.15)));
  const activeBlock = STORY_BLOCKS[activeIndex];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="hidden lg:block">
        <div className="relative">
          <div className="sticky top-[112px]">
            <div className="pointer-events-none absolute left-[72px] top-2 z-40 rounded-full border border-brand/20 bg-white/90 px-4 py-1 text-xs font-semibold tracking-wide text-brand-muted shadow-sm backdrop-blur">
              {activeBlock.title}
            </div>
            <div className="relative min-h-[55vh] overflow-hidden">
              <div className="pointer-events-none absolute inset-0 z-0">
                {Array.from({ length: stackLayersCount }).map((_, layer) => (
                  <div
                    key={`stack-layer-${layer}`}
                    className="stack-card rounded-[28px] border border-brand/10 bg-white shadow-[0_12px_28px_-22px_rgba(7,26,54,0.32)]"
                    style={{
                      transform: `translateY(${(layer + 1) * 15}px) scale(${1 - (layer + 1) * 0.013})`,
                      opacity: 0.9 - layer * 0.08,
                    }}
                  />
                ))}
              </div>

              {STORY_BLOCKS.map((block, idx) => {
                const rel = idx - progress;
                if (rel < -1.2 || rel > 1.2) return null;

                const below = rel >= 0;
                const relAbs = Math.min(1, Math.abs(rel));
                const eased = relAbs * relAbs * (3 - 2 * relAbs);
                const outgoingProgress = Math.min(1, Math.max(0, -rel));
                const y = below
                  ? 120 - 120 * (1 - relAbs)
                  : -52 * outgoingProgress;
                const lastActiveDrop =
                  idx === maxIndex ? 2 * Math.max(0, 1 - Math.min(1, Math.abs(rel) / 0.22)) : 0;
                const scale = below
                  ? 0.68 + (1 - relAbs) * 0.32
                  : 1 - 0.18 * outgoingProgress;
                const opacity = below
                  ? rel > 0.9
                    ? 0
                    : 1 - Math.max(0, rel - 0.45) / 0.45
                  : 1 - outgoingProgress;

                return (
                  <div
                    key={`card-${block.tab}`}
                    className="slide-card"
                    style={{
                      transform: `translateY(${y + lastActiveDrop}%) scale(${scale})`,
                      opacity: Math.max(0, Math.min(1, opacity)),
                      zIndex: below ? 30 : 20,
                    }}
                  >
                    {renderFeatureCard(block, idx)}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pointer-events-none opacity-0">
            {STORY_BLOCKS.map((block, idx) => (
              <div
                key={`marker-${block.tab}`}
                ref={(el) => {
                  markerRefs.current[idx] = el;
                }}
                data-idx={idx}
                className="h-[62vh]"
              />
            ))}
            <div className="h-[58vh]" />
          </div>
        </div>
      </div>

      <div className="space-y-5 lg:hidden">
        {STORY_BLOCKS.map((block) => (
          <div key={block.title} className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-sm">
            <div className="space-y-3 text-sm leading-relaxed text-brand-muted">
              {block.paragraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .slide-card {
          position: absolute;
          left: 90px;
          right: 90px;
          top: 80px;
          bottom: 12px;
        }

        .stack-card {
          position: absolute;
          left: 60px;
          right: 60px;
          top: 2px;
          bottom: 56px;
        }
      `}</style>
    </section>
  );
}
