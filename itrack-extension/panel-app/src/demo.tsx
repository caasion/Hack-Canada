import { OfferCarousel, type Offer } from "@/components/ui/offer-carousel";

const sampleOffers: Offer[] = [
  {
    id: 1,
    imageSrc:
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "International travel landmarks collage",
    title: "Up to $200 Off",
    description: "On selected international flights.",
    price: "$200",
    href: "#",
  },
  {
    id: 2,
    imageSrc:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "A delicious looking burger",
    title: "Snack more. Save more.",
    description: "Get $10 off orders above $40.",
    price: "$10",
    href: "#",
  },
  {
    id: 3,
    imageSrc:
      "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Streaming apps on a TV",
    title: "Streaming Bundle Deal",
    description: "Limited-time discounted annual plan.",
    price: "$25",
    href: "#",
  },
  {
    id: 4,
    imageSrc:
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Contactless payment at checkout",
    title: "10% Instant Cashback",
    description: "Eligible card transactions only.",
    price: "10%",
    href: "#",
  },
];

export default function OfferCarouselDemo() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <OfferCarousel title="Deals of the Day" offers={sampleOffers} />
      </div>
    </div>
  );
}
