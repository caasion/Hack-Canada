import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Offer {
  id: string | number;
  imageSrc: string;
  imageAlt: string;
  title: string;
  description?: string;
  price?: string;
  href: string;
  kind?: string;
}

interface OfferCardProps {
  offer: Offer;
}

const OfferCard = React.forwardRef<HTMLAnchorElement, OfferCardProps>(({ offer }, ref) => (
  <motion.a
    ref={ref}
    href={offer.href}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "itrack-card relative flex-shrink-0 w-[188px] h-[154px] rounded-2xl overflow-hidden group snap-start focus:outline-none",
      "bg-transparent text-card-foreground border-0",
    )}
    whileHover={{ y: -4 }}
    transition={{ type: "spring", stiffness: 300, damping: 22 }}
    data-product-id={String(offer.id)}
    data-product-name={offer.title}
    data-product-url={offer.href}
    data-product-price={offer.price ?? ""}
    data-product-kind={offer.kind ?? ""}
    aria-label={offer.title}
  >
    <img
      src={offer.imageSrc}
      alt={offer.imageAlt}
      className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      loading="lazy"
    />

    <div className="pointer-events-none absolute inset-0 z-[4] bg-gradient-to-t from-black/70 via-black/35 to-black/5" />

    {offer.price && (
      <span className="itrack-card-price absolute right-2 top-2 z-[6] rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white">
        {offer.price}
      </span>
    )}

    <div className="absolute bottom-0 left-0 right-0 z-[6] p-2.5">
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h3 className="itrack-card-name line-clamp-2 text-[14px] font-semibold leading-tight text-white">
            {offer.title}
          </h3>
          {offer.description ? (
            <p className="mt-1 line-clamp-1 text-[11px] text-white/80">{offer.description}</p>
          ) : null}
        </div>
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/22 text-white transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  </motion.a>
));
OfferCard.displayName = "OfferCard";

export interface OfferCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  offers: Offer[];
  title: string;
}

const OfferCarousel = React.forwardRef<HTMLDivElement, OfferCarouselProps>(
  ({ offers, title, className, ...props }, ref) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
      const current = scrollContainerRef.current;
      if (!current) return;
      const scrollAmount = current.clientWidth * 0.8;
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    };

    return (
      <section className="itrack-section-row">
        <h1 className="itrack-section-title">{title}</h1>
        <div ref={ref} className={cn("relative w-full group", className)} {...props}>
          <button
            type="button"
            onClick={() => scroll("left")}
            className={cn(
              "absolute left-0 top-1/2 z-10 -translate-y-1/2",
              "hidden h-8 w-8 items-center justify-center rounded-full",
              "border border-border bg-background/75 text-foreground backdrop-blur-sm",
              "opacity-0 transition-opacity duration-300 hover:bg-background/90",
              "group-hover:flex group-hover:opacity-100",
            )}
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            ref={scrollContainerRef}
            className={cn(
              "itrack-cards-row flex gap-2 overflow-x-auto pb-2",
              "snap-x snap-mandatory scrollbar-hide",
            )}
          >
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll("right")}
            className={cn(
              "absolute right-0 top-1/2 z-10 -translate-y-1/2",
              "hidden h-8 w-8 items-center justify-center rounded-full",
              "border border-border bg-background/75 text-foreground backdrop-blur-sm",
              "opacity-0 transition-opacity duration-300 hover:bg-background/90",
              "group-hover:flex group-hover:opacity-100",
            )}
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    );
  },
);
OfferCarousel.displayName = "OfferCarousel";

export { OfferCarousel, OfferCard };
