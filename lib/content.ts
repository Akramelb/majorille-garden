import type { Locale } from "@/app/[lang]/dictionaries";

export type LocalizedString = Record<Locale, string>;
export type LocalizedRichText = Record<Locale, string[]>; // paragraphs

export type ServiceVariant = {
  label: LocalizedString;
  durationMin: number;
  priceCents: number;
};

export type Service = {
  slug: string;
  name: LocalizedString;
  tagline: LocalizedString;
  cardImage: string;
  heroImage: string;
  galleryImages: string[];
  intro: LocalizedRichText;
  sections: Array<{
    title: LocalizedString;
    body: LocalizedRichText;
    image?: string;
  }>;
  variants: ServiceVariant[];
  // Base Cal.com event-type slug (e.g. "warm-sand-bath"). The real event types are
  // per-audience: `<bookingSlug>-women` and `<bookingSlug>-men`, each attached to
  // the matching availability schedule (Women vs Men hours).
  bookingSlug: string;
  closingQuote?: LocalizedString;
};

export type Audience = "women" | "men";

export type Product = {
  slug: string;
  name: LocalizedString;
  shortDescription: LocalizedString;
  priceCents: number;
  compareAtCents?: number;
  image: string;
  inStock: boolean;
};

export type FAQ = {
  question: LocalizedString;
  answer: LocalizedString;
};

export type Testimonial = {
  quote: LocalizedString;
  author: string;
};

export const SITE = {
  name: "Majorille Garden",
  tagline: {
    nl: "Marokkaans geïnspireerde wellness in Amsterdam",
    en: "Moroccan-inspired wellness in Amsterdam",
  } as LocalizedString,
  address: {
    street: "Franz Zieglerstraat 201",
    postalCity: "1087 HN Amsterdam",
    country: { nl: "Nederland", en: "Netherlands" } as LocalizedString,
  },
  phone: "+31 6 4128 4643",
  phoneLink: "tel:+31641284643",
  whatsappLink: "https://wa.me/31641284643",
  email: "info@majorillegarden.nl",
  hours: {
    women: {
      label: { nl: "Vrouwen", en: "Women" } as LocalizedString,
      range: {
        nl: "Maandag t/m zondag: 10:00 – 20:00",
        en: "Monday – Sunday: 10:00 – 20:00",
      } as LocalizedString,
    },
    men: {
      label: { nl: "Mannen", en: "Men" } as LocalizedString,
      range: {
        nl: "Ma – wo: 09:00 – 20:00 · do – zo: 09:00 – 12:30",
        en: "Mon – Wed: 09:00 – 20:00 · Thu – Sun: 09:00 – 12:30",
      } as LocalizedString,
    },
  },
  // Cal.com username. Set NEXT_PUBLIC_CAL_USERNAME in your environment.
  calUsername: process.env.NEXT_PUBLIC_CAL_USERNAME ?? "",
  bookingConfigured: Boolean(process.env.NEXT_PUBLIC_CAL_USERNAME),
} as const;

/**
 * Build the Cal.com calLink for a treatment + audience — the value Cal.com's
 * embed expects, formatted as `<username>/<bookingSlug>-<audience>`. Event types
 * are named `<bookingSlug>-women` / `<bookingSlug>-men`, each attached to the
 * matching availability schedule (Women vs Men hours).
 */
export function calLinkForService(
  service: Pick<Service, "bookingSlug">,
  audience: Audience,
): string {
  return `${SITE.calUsername}/${service.bookingSlug}-${audience}`;
}

export const SERVICES: Service[] = [
  {
    slug: "warme-zandbad-therapie",
    name: { nl: "Warme Zandbad Therapie", en: "Warm Sand Bath Therapy" },
    tagline: {
      nl: "Gouden zandtherapie geïnspireerd op de Marokkaanse woestijn.",
      en: "Golden sand therapy inspired by the Moroccan desert.",
    },
    cardImage: "/images/services/warme-zandbad/card.jpg",
    heroImage: "/images/services/warme-zandbad/hero.jpg",
    galleryImages: [
      "/images/services/warme-zandbad/01.jpg",
      "/images/services/warme-zandbad/02.jpg",
    ],
    intro: {
      nl: [
        "Deze bijzondere, natuurlijke en traditionele behandeling wordt in de woestijn van Marokko gehouden. Bij Majorille Garden ervaart u dit ritueel in een luxe, comfortabel zandbad volgens een streng hygiëne- en reinigingsprotocol met onze eigen biologische producten.",
        "Het warme zand voelt aangenaam aan en heeft een duidelijke werking tegen reuma, hernia-klachten, ischias en spierstijfheid. Het stimuleert de doorbloeding en helpt vermoeidheidssymptomen verlichten.",
      ],
      en: [
        "An age-old natural therapy practiced in the Moroccan desert, now offered in our serene, hygienically prepared sand bath with our own organic products.",
        "The warm sand soothes the body, supports relief from rheumatic complaints, hernia and sciatica pain, and muscle stiffness. It stimulates circulation and helps relieve symptoms of fatigue.",
      ],
    },
    sections: [
      {
        title: { nl: "Onze zandbad", en: "Our sand bath" },
        body: {
          nl: [
            "U ligt in een speciaal ontworpen zandbad met verlichting, muziek en geur naar keuze in een woestijnsfeer, met een kop kruidenthee.",
            "Welkom bij de unieke Gouden Zandtherapie ervaring in Nederland. Onze gezuiverde, goudkleurige mineraalrijke zand omhult uw lichaam, stimuleert de bloedsomloop en biedt een diepe ontspanning die u nergens anders vindt.",
          ],
          en: [
            "You recline in a purpose-built sand bath with lighting, music, and fragrance of your choice — a desert atmosphere, served with a cup of herbal tea.",
            "Welcome to a one-of-a-kind golden sand therapy in the Netherlands. Our purified, mineral-rich golden sand envelops the body, stimulating circulation and offering a depth of relaxation you won't find elsewhere.",
          ],
        },
        image: "/images/services/warme-zandbad/01.jpg",
      },
      {
        title: {
          nl: "Voordelen van zandtherapie",
          en: "Benefits of sand therapy",
        },
        body: {
          nl: [
            "Onze holistische zandbehandeling is een effectieve, natuurlijke methode om uw welzijn te verbeteren:",
            "Pijnverlichting & spierontspanning — de droge warmte dringt diep door en helpt bij gewrichtspijn (reuma, artrose) en gespannen spieren.",
            "Diepe stressvermindering — het omhullende gevoel stimuleert de aanmaak van endorfine en brengt u in een diepe, meditatieve rust.",
            "Natuurlijke detox — de gelijkmatige warmte bevordert gezonde transpiratie waardoor het lichaam toxines afvoert.",
            "Huidverbetering — het fijne zand werkt als een zachte exfoliant en maakt uw huid zijdezacht.",
          ],
          en: [
            "Our holistic sand treatment is an effective, natural way to improve your wellbeing:",
            "Pain relief & muscle relaxation — dry heat penetrates deeply, easing joint pain (rheumatism, arthrosis) and tense muscles.",
            "Deep stress reduction — the enveloping warmth stimulates endorphins and brings you into a meditative calm.",
            "Natural detox — even warmth promotes healthy perspiration and supports the body's natural detox.",
            "Skin renewal — the fine sand acts as a gentle exfoliant, leaving skin silky.",
          ],
        },
        image: "/images/services/warme-zandbad/02.jpg",
      },
    ],
    variants: [
      {
        label: { nl: "Gouden zandbad", en: "Golden sand bath" },
        durationMin: 45,
        priceCents: 5500,
      },
    ],
    bookingSlug: "warm-sand-bath",
    closingQuote: {
      nl: "Verwen uw lichaam met de kracht van zand. Boek nu uw therapeutisch moment.",
      en: "Treat your body to the healing power of sand. Book your therapeutic moment.",
    },
  },
  {
    slug: "traditionele-massage",
    name: { nl: "Traditionele Massage", en: "Traditional Massage" },
    tagline: {
      nl: "Een reis naar ontspanning en balans.",
      en: "A journey to relaxation and balance.",
    },
    cardImage: "/images/services/traditionele-massage/card.webp",
    heroImage: "/images/services/traditionele-massage/hero.webp",
    galleryImages: [
      "/images/services/traditionele-massage/01.jpg",
      "/images/services/traditionele-massage/02.jpg",
    ],
    intro: {
      nl: [
        "Gun jezelf een moment van pure rust en herontdek de harmonie tussen lichaam en geest. Onze traditionele massage combineert authentieke technieken met een rustgevende sfeer om stress los te laten en uw welzijn te versterken.",
      ],
      en: [
        "Give yourself a moment of pure rest and rediscover the harmony between body and mind. Our traditional massage combines authentic techniques with a calming atmosphere to release stress and restore your wellbeing.",
      ],
    },
    sections: [
      {
        title: {
          nl: "Een moment van pure ontspanning",
          en: "A moment of pure relaxation",
        },
        body: {
          nl: [
            "De traditionele massage is een uitnodiging om even te ontsnappen aan de drukte van het dagelijks leven. Deze eeuwenoude technieken brengen lichaam en geest opnieuw in evenwicht. Vanaf het eerste moment ervaart u een diep gevoel van rust, terwijl stress plaatsmaakt voor comfort.",
          ],
          en: [
            "An invitation to step away from the noise of daily life. Centuries-old techniques bring body and mind back into balance — from the first minute you feel stress softening into comfort.",
          ],
        },
        image: "/images/services/traditionele-massage/01.jpg",
      },
      {
        title: { nl: "Herstel, energie en welzijn", en: "Recovery, energy, and wellbeing" },
        body: {
          nl: [
            "Met gerichte kneed-, druk- en strijktechnieken laat de massage spierspanning los en stimuleert de bloedsomloop. De behandeling bevordert lichamelijk herstel én mentale ontspanning, en het resultaat is een soepel lichaam en een kalme, vernieuwde geest.",
          ],
          en: [
            "Targeted kneading, pressure, and gliding strokes release muscle tension and stimulate circulation. The treatment supports physical recovery and mental ease — leaving a supple body and a quietly renewed mind.",
          ],
        },
        image: "/images/services/traditionele-massage/02.jpg",
      },
    ],
    variants: [
      {
        label: { nl: "Korte sessie", en: "Short session" },
        durationMin: 30,
        priceCents: 5500,
      },
      {
        label: { nl: "Volledige sessie", en: "Full session" },
        durationMin: 60,
        priceCents: 9100,
      },
    ],
    bookingSlug: "traditional-massage",
    closingQuote: {
      nl: "Traditionele massage is de kunst om het lichaam te ontspannen en de geest tot rust te brengen.",
      en: "Traditional massage is the art of relaxing the body and quieting the mind.",
    },
  },
  {
    slug: "bio-head-spa",
    name: { nl: "Bio Head Spa", en: "Bio Head Spa" },
    tagline: {
      nl: "Een exclusief reisritueel voor hoofdhuid en haar.",
      en: "An exclusive ritual for scalp and hair.",
    },
    cardImage: "/images/services/bio-head-spa/card.jpg",
    heroImage: "/images/services/bio-head-spa/hero.jpg",
    galleryImages: [
      "/images/services/bio-head-spa/01.jpg",
      "/images/services/bio-head-spa/argan.jpg",
      "/images/services/bio-head-spa/jojoba.jpg",
      "/images/services/bio-head-spa/herbs.jpg",
    ],
    intro: {
      nl: [
        "Bij Majorille Garden staat verfijning centraal. Onze private headspa is geworteld in de rust en tijdloze esthetiek van de tuinen aan de voet van het Atlasgebergte — een plek waar natuur, stilte en pure schoonheid samenkomen.",
      ],
      en: [
        "Refinement is the heart of Majorille Garden. Our private headspa is rooted in the calm and timeless aesthetic of the gardens at the foot of the Atlas mountains — where nature, silence, and pure beauty meet.",
      ],
    },
    sections: [
      {
        title: {
          nl: "Een oase van Marokkaanse sereniteit",
          en: "An oasis of Moroccan serenity",
        },
        body: {
          nl: [
            "Wij hebben deze unieke harmonie vertaald naar een exclusief verzorgingsritueel voor hoofdhuid en haar, uitgevoerd in een serene en discrete setting.",
          ],
          en: [
            "We've translated that harmony into an exclusive scalp and hair ritual, delivered in a serene, private setting.",
          ],
        },
        image: "/images/services/bio-head-spa/01.jpg",
      },
      {
        title: {
          nl: "Balans, expertise en natuurlijke schatten",
          en: "Balance, expertise, and natural treasures",
        },
        body: {
          nl: [
            "Ware schoonheid begint bij innerlijke en uiterlijke balans. Een gezonde, gevoede hoofdhuid is de basis voor sterk, glanzend en vitaal haar.",
            "Onze filosofie combineert jarenlange hoofdhuidexpertise met verfijnde massagetechnieken die de bloedsomloop stimuleren en spanning verlichten. We werken uitsluitend met kostbare biologische ingrediënten uit Marokko: handgeperste arganolie uit Souss-Massa en mineraalrijke rhassoul, beroemd om hun zuiverende, voedende en herstellende werking.",
          ],
          en: [
            "True beauty begins with inner and outer balance. A healthy, nourished scalp is the foundation for strong, vibrant hair.",
            "Years of scalp expertise meet refined massage techniques that stimulate circulation and ease tension. We use only Morocco's most precious organic ingredients: hand-pressed argan oil from Souss-Massa and mineral-rich rhassoul — celebrated for their purifying, deeply nourishing, and restorative effects.",
          ],
        },
      },
    ],
    variants: [
      {
        label: {
          nl: "Majorille Signature Headspa",
          en: "Majorille Signature Headspa",
        },
        durationMin: 60,
        priceCents: 5500,
      },
      {
        label: { nl: "Majorille Deluxe Ritual", en: "Majorille Deluxe Ritual" },
        durationMin: 90,
        priceCents: 9100,
      },
      {
        label: {
          nl: "Royal Garden Experience",
          en: "Royal Garden Experience",
        },
        durationMin: 120,
        priceCents: 10900,
      },
    ],
    bookingSlug: "bio-head-spa",
  },
  {
    slug: "hete-steen-massage",
    name: { nl: "Hete Steen Massage", en: "Hot Stone Massage" },
    tagline: {
      nl: "Warmte en weldaad voor lichaam en geest.",
      en: "Warmth and well-being for body and mind.",
    },
    cardImage: "/images/services/hete-steen-massage/card.jpg",
    heroImage: "/images/services/hete-steen-massage/hero.jpg",
    galleryImages: [
      "/images/services/hete-steen-massage/01.jpg",
      "/images/services/hete-steen-massage/02.jpg",
    ],
    intro: {
      nl: [
        "Stap binnen in een oase van rust en ervaar de diep ontspannende kracht van de hete steen massage. Gladde, verwarmde basaltstenen worden op specifieke punten van het lichaam geplaatst — de doordringende warmte verzacht de spieren, waardoor uw masseur dieper en effectiever kan werken.",
      ],
      en: [
        "Step into a calm where warm, smooth basalt stones rest on the body. The radiant warmth softens muscle tissue, letting your therapist work more deeply and effectively.",
      ],
    },
    sections: [
      {
        title: {
          nl: "Fysiek herstel en mentale balans",
          en: "Physical recovery, mental balance",
        },
        body: {
          nl: [
            "De combinatie van warmte en therapeutische massagebewegingen vermindert spanning, stress en stijfheid in nek, rug en schouders. Bovendien stimuleert deze behandeling de bloedsomloop en ondersteunt het lichaam bij het afvoeren van afvalstoffen.",
            "Na de sessie voelt u zich niet alleen fysiek ontspannen, maar ook mentaal verfrist en in balans.",
          ],
          en: [
            "Warmth and therapeutic strokes ease tension, stress, and stiffness in the neck, back, and shoulders. Circulation improves and the body's natural detox is supported.",
            "Afterwards you feel physically loose and mentally clear.",
          ],
        },
        image: "/images/services/hete-steen-massage/01.jpg",
      },
      {
        title: {
          nl: "De holistische ervaring",
          en: "The holistic experience",
        },
        body: {
          nl: [
            "We gebruiken uitsluitend natuurlijke, biologische oliën die passen bij uw huid en wensen. Meer dan een massage: een complete wellnesservaring die het zelfherstellende vermogen van uw lichaam activeert.",
          ],
          en: [
            "We use only natural, organic oils chosen for your skin and intentions. More than a massage — a complete wellness experience that activates your body's natural capacity to heal.",
          ],
        },
        image: "/images/services/hete-steen-massage/02.jpg",
      },
    ],
    variants: [
      {
        label: { nl: "Sessie", en: "Session" },
        durationMin: 30,
        priceCents: 4200,
      },
    ],
    bookingSlug: "hot-stone-massage",
    closingQuote: {
      nl: "Warmte ontspant niet alleen de spieren; het nodigt de geest uit los te laten en het lichaam opnieuw te verbinden met zijn eigen helende kracht.",
      en: "Warmth doesn't only relax the muscles; it invites the mind to let go and the body to reconnect with its own healing power.",
    },
  },
  {
    slug: "traditionele-kruidenstempel-massage",
    name: {
      nl: "Traditionele Kruidenstempel Massage",
      en: "Herbal Stamp Massage",
    },
    tagline: {
      nl: "Eeuwenoude warmtetherapie met warme kruidenstempels.",
      en: "Centuries-old warmth therapy with herbal poultices.",
    },
    cardImage: "/images/services/kruidenstempel/card.jpg",
    heroImage: "/images/services/kruidenstempel/hero.jpg",
    galleryImages: [
      "/images/services/kruidenstempel/01.png",
      "/images/services/kruidenstempel/02.png",
      "/images/services/kruidenstempel/03.png",
    ],
    intro: {
      nl: [
        "Ontdek een unieke wellnesservaring waarin eeuwenoude massagetechnieken worden gecombineerd met warme kruidenstempels en pure biologische oliën. Deze behandeling stimuleert diepe ontspanning, voedt de huid en brengt lichaam en geest opnieuw in balans.",
      ],
      en: [
        "A unique experience where centuries-old massage technique meets warm herbal poultices and pure organic oils. The treatment invites deep relaxation, nourishes the skin, and restores balance.",
      ],
    },
    sections: [
      {
        title: {
          nl: "Moxibustie — traditionele warmtetherapie",
          en: "Moxibustion — traditional heat therapy",
        },
        body: {
          nl: [
            "Moxibustie is een warmtetherapie uit de Chinese en Marokkaanse geneeskunde. Bijvoet (Artemisia / mugwort) wordt gebruikt om een diepe, therapeutische warmte op specifieke punten van het lichaam toe te passen. Deze warmte ondersteunt het natuurlijke evenwicht en helpt het lichaam ontspannen.",
          ],
          en: [
            "Moxibustion is a heat therapy with roots in Chinese and Moroccan medicine. Mugwort (Artemisia) provides a deep, therapeutic warmth applied to specific points on the body to support your natural equilibrium and invite relaxation.",
          ],
        },
        image: "/images/services/kruidenstempel/01.png",
      },
      {
        title: {
          nl: "Werking en voordelen",
          en: "Effects and benefits",
        },
        body: {
          nl: [
            "De warmte wordt opgewekt met moxastokjes, moxakegeltjes of warmtemoxa op punten die vergelijkbaar zijn met acupunctuurpunten. Dit stimuleert de energiestroom (Qi) en de bloedsomloop, en activeert het zelfherstellend vermogen.",
            "Moxibustie kan ondersteuning bieden bij spier- en gewrichtspijn, rugklachten, stijfheid, koude handen en voeten, spijsverteringsproblemen en het versterken van het immuunsysteem.",
          ],
          en: [
            "Warmth is applied with moxa sticks, cones, or thermal moxa on points similar to acupuncture points. This stimulates the flow of qi and circulation, activating the body's natural healing.",
            "Moxibustion may support muscle and joint pain, back complaints, stiffness, cold hands and feet, digestion, and immune resilience.",
          ],
        },
        image: "/images/services/kruidenstempel/02.png",
      },
      {
        title: {
          nl: "Veiligheid en advies",
          en: "Safety and guidance",
        },
        body: {
          nl: [
            "Moxibustie is veilig wanneer uitgevoerd door een ervaren therapeut. De behandeling wordt afgeraden bij koorts, acute ontstekingen en op bepaalde punten tijdens de zwangerschap.",
            "Benieuwd of moxibustie geschikt is voor u? Neem gerust contact op voor persoonlijk advies of een intakegesprek.",
          ],
          en: [
            "Moxibustion is safe when delivered by an experienced therapist. It's not advised during fever, acute inflammation, or at certain points during pregnancy.",
            "Wondering whether moxibustion is right for you? Get in touch for personal advice or an intake conversation.",
          ],
        },
        image: "/images/services/kruidenstempel/03.png",
      },
    ],
    variants: [
      {
        label: { nl: "Korte sessie", en: "Short session" },
        durationMin: 30,
        priceCents: 3700,
      },
      {
        label: { nl: "Volledige sessie", en: "Full session" },
        durationMin: 60,
        priceCents: 7300,
      },
    ],
    bookingSlug: "herbal-stamp-massage",
  },
  {
    slug: "lichaam-scrub",
    name: { nl: "Lichaamsscrub", en: "Body Scrub" },
    tagline: {
      nl: "Een traditionele scrub die de huid zuivert en doet stralen.",
      en: "A traditional scrub that purifies the skin and brings it back to life.",
    },
    cardImage: "/images/services/lichaam-scrub/card.jpg",
    heroImage: "/images/services/lichaam-scrub/hero.jpg",
    galleryImages: [
      "/images/services/lichaam-scrub/01.jpg",
      "/images/services/lichaam-scrub/02.jpg",
    ],
    intro: {
      nl: [
        "Bij Majorille Garden bieden we scrubs die zorgvuldig zijn samengesteld om uw huid te vernieuwen en te revitaliseren. Onze unieke formules combineren de kracht van de natuur met de expertise van traditionele schoonheidsrituelen.",
      ],
      en: [
        "Majorille Garden's scrubs are carefully composed to renew and revitalise the skin — natural ingredients meet centuries of beauty ritual.",
      ],
    },
    sections: [
      {
        title: { nl: "De kunst van exfoliatie", en: "The art of exfoliation" },
        body: {
          nl: [
            "Onze scrubs zijn een complete zintuiglijke ervaring. De zachte maar effectieve exfoliatie verwijdert dode huidcellen, stimuleert huidvernieuwing en onthult een zachtere, helderdere huid. De voedende ingrediënten laten een aangenaam, langdurig comfortabel gevoel achter.",
          ],
          en: [
            "A complete sensory experience. Gentle yet effective exfoliation lifts away dead cells, stimulates renewal, and reveals softer, brighter skin. The nourishing ingredients leave a lasting feeling of comfort.",
          ],
        },
        image: "/images/services/lichaam-scrub/01.jpg",
      },
      {
        title: { nl: "De kracht van de natuur", en: "The power of nature" },
        body: {
          nl: [
            "Onze scrubs bevatten een rijke mix van natuurlijke en biologische ingrediënten: voedende kokosolie, verzachtende honing, kalmerende lavendel en revitaliserend zeezout. Samen hydrateren, beschermen en herstellen ze de huid, terwijl een subtiele geur en zijdezachte textuur de behandeling tot een echte rustmoment maken.",
          ],
          en: [
            "A rich blend of natural, organic ingredients: nourishing coconut oil, soothing honey, calming lavender, and revitalising sea salt. Together they hydrate, protect, and restore — with a subtle scent and silky finish that turns the treatment into a true moment of pause.",
          ],
        },
        image: "/images/services/lichaam-scrub/02.jpg",
      },
    ],
    variants: [
      {
        label: { nl: "Traditionele scrub", en: "Traditional scrub" },
        durationMin: 60,
        priceCents: 6700,
      },
    ],
    bookingSlug: "body-scrub",
  },
  {
    slug: "dry-cupping",
    name: { nl: "Dry Cupping", en: "Dry Cupping" },
    tagline: {
      nl: "Diepgaande bindweefselstimulatie met biologische oliën.",
      en: "Deep connective-tissue stimulation with organic oils.",
    },
    cardImage: "/images/services/dry-cupping/card.jpg",
    heroImage: "/images/services/dry-cupping/hero.jpg",
    galleryImages: [
      "/images/services/dry-cupping/01.jpg",
      "/images/services/dry-cupping/02.jpg",
      "/images/services/dry-cupping/03.jpg",
    ],
    intro: {
      nl: [
        "Dry Cupping is een effectieve, traditionele therapie gericht op het mobiliseren en detoxificeren van het onderhuids bindweefsel. Door een lokaal vacuüm te creëren worden cups op de huid geplaatst en vervolgens bewogen — dit stimuleert de doorbloeding en lymfedrainage en helpt afvalstoffen efficiënt af te voeren.",
      ],
      en: [
        "Dry Cupping is an effective traditional therapy that mobilises and detoxifies the connective tissue beneath the skin. A local vacuum lifts the tissue and the cups are moved across — stimulating circulation and lymphatic drainage to flush out built-up waste.",
      ],
    },
    sections: [
      {
        title: {
          nl: "De meerwaarde van biologische oliën",
          en: "Why we use organic oils",
        },
        body: {
          nl: [
            "We gebruiken uitsluitend hoogwaardige biologische oliën — koudgeperste arganolie of jojoba — die voorkomen dat de huid geïrriteerd raakt en zorgen voor een soepele beweging van de cups. Deze oliën hebben van nature voedende en hydraterende eigenschappen, en kunnen worden verrijkt met etherische oliën voor extra effect.",
          ],
          en: [
            "Only high-quality cold-pressed organic oils — argan or jojoba — prevent irritation and let the cups glide smoothly. They nourish and hydrate the skin, and can be enriched with pure essential oils when extra therapeutic effect is desired.",
          ],
        },
        image: "/images/services/dry-cupping/01.jpg",
      },
      {
        title: {
          nl: "Een holistische aanpak",
          en: "A holistic approach",
        },
        body: {
          nl: [
            "De combinatie van mechanische vacuümwerking en voedende oliën levert een tweeledig voordeel: het lichaam ontspant diep, terwijl huid en bindweefsel worden gestimuleerd tot regeneratie. Lichte tijdelijke verkleuringen zijn normaal; het resultaat is een duurzaam gevoel van energie en soepelheid.",
          ],
          en: [
            "The combination of vacuum action and nourishing oils brings a dual benefit: deep bodily relaxation while the skin and connective tissue are stimulated to regenerate. Light, temporary marks are normal — the lasting impression is one of energy and ease.",
          ],
        },
        image: "/images/services/dry-cupping/02.jpg",
      },
    ],
    variants: [
      {
        label: { nl: "Sessie", en: "Session" },
        durationMin: 60,
        priceCents: 5500,
      },
    ],
    bookingSlug: "dry-cupping",
    closingQuote: {
      nl: "Waar er stagnatie is, is er pijn. Cupping brengt beweging, herstelt de doorstroming en brengt het lichaam terug in balans.",
      en: "Where there is stagnation, there is pain. Cupping brings movement, restores flow, and returns the body to balance.",
    },
  },
  {
    slug: "voedingsadvies",
    name: { nl: "Voedingsadvies", en: "Nutritional Advice" },
    tagline: {
      nl: "Persoonlijk advies voor een duurzaam gezonde levensstijl.",
      en: "Personalised guidance toward a lasting healthy lifestyle.",
    },
    cardImage: "/images/services/voedingsadvies/card.jpg",
    heroImage: "/images/services/voedingsadvies/hero.jpg",
    galleryImages: [
      "/images/services/voedingsadvies/01.jpg",
      "/images/services/voedingsadvies/02.jpg",
    ],
    intro: {
      nl: [
        "Bij Majorille Garden geloven we dat ware schoonheid en gezondheid van binnenuit komen. Onze voedingsadvies-sessies helpen u een gezond eetpatroon op te bouwen dat uw lichaam voedt en op natuurlijke wijze ondersteunt.",
      ],
      en: [
        "At Majorille Garden we believe true beauty and health start from within. Our nutritional sessions help you build an eating pattern that nourishes your body naturally.",
      ],
    },
    sections: [
      {
        title: {
          nl: "Persoonlijk advies, natuurlijke producten",
          en: "Personal advice, natural ingredients",
        },
        body: {
          nl: [
            "Onze adviseurs werken vanuit een holistische visie — geen standaard dieetlijst, maar persoonlijk advies dat rekening houdt met uw unieke constitutie. We richten ons op natuurlijke, onbewerkte en biologische producten die de basis vormen van de Majorille Garden filosofie.",
            "Of u nu uw haar en huid wilt versterken, uw energie wilt verbeteren of uw spijsvertering wilt ondersteunen: een plan op maat legt de fundering voor een gezonde levensstijl.",
          ],
          en: [
            "Our advisors work holistically — no generic diet list, but personalised guidance tuned to your constitution. We focus on natural, unprocessed, organic ingredients that sit at the heart of Majorille Garden's philosophy.",
            "Whether you want stronger hair and skin, more energy, or better digestion — a plan made for you lays the foundation for a durable healthy lifestyle.",
          ],
        },
        image: "/images/services/voedingsadvies/01.jpg",
      },
      {
        title: { nl: "Verbeter uw welzijn", en: "Improve your wellbeing" },
        body: {
          nl: [
            "Een evenwichtig dieet is de krachtigste stap die u kunt zetten naar beter welzijn. De resultaten gaan veel verder dan gewicht: betere focus, een sterkere weerstand en een stralende huid.",
          ],
          en: [
            "A balanced diet is the most powerful step you can take toward better wellbeing. The results reach far beyond weight: sharper focus, stronger resilience, a clearer complexion.",
          ],
        },
        image: "/images/services/voedingsadvies/02.jpg",
      },
    ],
    variants: [
      {
        label: { nl: "Intakegesprek", en: "Intake consultation" },
        durationMin: 60,
        priceCents: 5500,
      },
    ],
    bookingSlug: "nutritional-advice",
    closingQuote: {
      nl: "Gezondheid is geen bestemming, maar een reis die begint met de dagelijkse, bewuste keuzes die je op je bord maakt.",
      en: "Health is not a destination but a journey that begins with the conscious choices you make on your plate every day.",
    },
  },
];

export const PRODUCTS: Product[] = [
  {
    slug: "argan-oil",
    name: { nl: "Arganolie", en: "Argan Oil" },
    shortDescription: {
      nl: "Handgeperste arganolie uit Souss-Massa.",
      en: "Hand-pressed argan oil from Souss-Massa.",
    },
    priceCents: 2495,
    compareAtCents: 3400,
    image: "/images/products/argan-oil.jpg",
    inStock: true,
  },
  {
    slug: "nila-poeder",
    name: { nl: "Nila Poeder", en: "Nila Powder" },
    shortDescription: {
      nl: "Traditioneel zuiverend poeder voor huid en haar.",
      en: "Traditional purifying powder for skin and hair.",
    },
    priceCents: 500,
    image: "/images/products/nila-poeder.jpg",
    inStock: true,
  },
  {
    slug: "jojoba-olie",
    name: { nl: "Jojoba-olie", en: "Jojoba Oil" },
    shortDescription: {
      nl: "Koudgeperste jojoba-olie, hydraterend en voedend.",
      en: "Cold-pressed jojoba oil, hydrating and nourishing.",
    },
    priceCents: 1295,
    image: "/images/products/jojoba-olie.jpg",
    inStock: true,
  },
  {
    slug: "arganolie-zeep",
    name: { nl: "Arganolie zeep", en: "Argan Oil Soap" },
    shortDescription: {
      nl: "Verfijnde gourmetzeep met arganolie van een Marokkaanse vrouwencoöperatie, voor een zijdezacht, luxueus schuim.",
      en: "Refined gourmet soap with argan oil from a Moroccan women's cooperative, for a silky, luxurious lather.",
    },
    priceCents: 895,
    image: "/images/products/argan-zeep.jpg",
    inStock: true,
  },
  {
    slug: "body-conditioner",
    name: { nl: "Body conditioner", en: "Body Conditioner" },
    shortDescription: {
      nl: "Marokkaanse arganolie en Roos Absolue, vermengd met verzorgende kruiden.",
      en: "Moroccan argan oil and Rose Absolue, blended with nourishing herbs.",
    },
    priceCents: 1695,
    image: "/images/products/body-conditioner.jpg",
    inStock: true,
  },
];

export const FAQS: FAQ[] = [
  {
    question: {
      nl: "Wat voor behandelingen bieden jullie aan?",
      en: "What kinds of treatments do you offer?",
    },
    answer: {
      nl: "Wij combineren traditionele Marokkaanse rituelen met biologische producten — onder andere warme zandbad-therapie, traditionele massage, bio head spa, hete steen massage, kruidenstempel massage, lichaamsscrub, dry cupping en voedingsadvies.",
      en: "We combine traditional Moroccan rituals with organic products — including warm sand bath therapy, traditional massage, bio head spa, hot stone, herbal stamp, body scrub, dry cupping and nutritional advice.",
    },
  },
  {
    question: {
      nl: "Zijn jullie biologische producten gecertificeerd?",
      en: "Are your organic products certified?",
    },
    answer: {
      nl: "Ja — al onze biologische producten zijn gecertificeerd en duurzaam geproduceerd, vaak in samenwerking met Berbervrouwen die hun eeuwenoude kennis met ons delen.",
      en: "Yes — all of our organic products are certified and sustainably produced, often in partnership with Berber women who share their centuries-old knowledge.",
    },
  },
  {
    question: {
      nl: "Hoe maak ik een afspraak?",
      en: "How do I make an appointment?",
    },
    answer: {
      nl: "Reserveer eenvoudig via onze boekingspagina, of neem contact op via telefoon (+31 6 4128 4643) of e-mail (info@majorillegarden.nl). Behandelingen zijn op afspraak — men-to-men en woman-to-woman.",
      en: "Book directly via our booking page, or get in touch by phone (+31 6 4128 4643) or email (info@majorillegarden.nl). Treatments are by appointment — men-to-men and woman-to-woman.",
    },
  },
];

export const TESTIMONIAL: Testimonial = {
  quote: {
    nl: "Ik ben zo dankbaar voor de geweldige ervaring die ik heb gehad bij Majorille Garden. De natuurlijke behandelingen hebben mijn gezondheid echt verbeterd en ik voel me herboren.",
    en: "I'm so grateful for the wonderful experience I had at Majorille Garden. The natural treatments truly improved my health — I feel reborn.",
  },
  author: "Jan Jansen",
};

export const ABOUT = {
  hero: {
    nl: [
      "Bij Majorille Garden geloven we in de kracht van de natuur en in eerlijke handel. Onze missie is om de authentieke geheimen van de Marokkaanse natuur toegankelijk te maken — voor uw welzijn, en in directe samenwerking met de gemeenschappen die deze kennis al eeuwen bewaren.",
    ],
    en: [
      "At Majorille Garden we believe in the power of nature and in fair trade. Our mission is to make Morocco's authentic natural secrets accessible — for your wellbeing, and in direct partnership with the communities that have safeguarded this knowledge for centuries.",
    ],
  } as LocalizedRichText,
  sections: [
    {
      title: { nl: "Onze producten", en: "Our products" } as LocalizedString,
      body: {
        nl: [
          "Onze producten zijn biologisch en vrij van chemicaliën. Ze worden op traditionele wijze met de hand gemaakt, recht uit de bron. Ons doel is om iedereen toegang te geven tot echte biologische producten — zoals arganolie die zorgt voor een duurzame huid en haar. We bieden natuurlijke behandelingen met onze producten, recepten en advies aan in onze winkel.",
        ],
        en: [
          "Our products are organic and free from chemicals — made traditionally and by hand, straight from the source. We want everyone to have access to truly organic essentials, like argan oil that nurtures lasting skin and hair. In our shop we offer natural treatments alongside the products, recipes, and the guidance to use them well.",
        ],
      } as LocalizedRichText,
      image: "/images/about/diensten.jpg",
    },
    {
      title: { nl: "Onze diensten", en: "Our treatments" } as LocalizedString,
      body: {
        nl: [
          "Deze bijzondere, natuurlijke en traditionele behandelingen worden van oudsher in de woestijnen van Marokko gehouden. Bij Majorille Garden brengen wij dezelfde ritmes en rituelen naar Amsterdam — uitgevoerd met onze eigen biologische producten in een luxe, comfortabele setting. Een eerbetoon aan de traditionele Marokkaanse rituelen, ontworpen om lichaam en geest in perfecte harmonie te brengen.",
        ],
        en: [
          "These natural, traditional treatments are rooted in the deserts of Morocco. At Majorille Garden we bring the same rhythms and rituals to Amsterdam — performed with our own organic products in a luxurious, comfortable setting. A tribute to traditional Moroccan rituals, designed to bring body and mind into harmony.",
        ],
      } as LocalizedRichText,
      image: "/images/about/filosofie.jpg",
    },
    {
      title: { nl: "Onze filosofie", en: "Our philosophy" } as LocalizedString,
      body: {
        nl: [
          "Wij geloven in de kracht van de natuur en in eerlijke handel. Door uitsluitend te werken met fair-trade en ethisch verantwoorde ingrediënten garanderen we niet alleen de hoogste kwaliteit, maar ondersteunen we ook de lokale gemeenschappen — vooral de Berbervrouwen die hun eeuwenoude kennis over het oogsten en verwerken van arganolie met ons delen.",
          "Bij Majorille Garden koopt u niet enkel een product. U investeert in zuiverheid, traditie, en een gezondere toekomst.",
        ],
        en: [
          "We believe in the power of nature and in fair trade. By working exclusively with fair-trade and ethically sourced ingredients we guarantee the highest quality and support the communities that share their craft — particularly the Berber women whose centuries-old knowledge of harvesting and pressing argan oil makes our work possible.",
          "At Majorille Garden, you don't just buy a product — you invest in purity, tradition, and a healthier future.",
        ],
      } as LocalizedRichText,
      image: "/images/about/footer.jpg",
    },
  ],
};

export function formatPriceEUR(cents: number, locale: Locale): string {
  const formatter = new Intl.NumberFormat(
    locale === "nl" ? "nl-NL" : "en-IE",
    { style: "currency", currency: "EUR" },
  );
  return formatter.format(cents / 100);
}

export function localized<T>(value: Record<Locale, T>, locale: Locale): T {
  return value[locale];
}

export function getServiceBySlug(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
