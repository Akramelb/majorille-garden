import type { Locale } from "@/app/[lang]/dictionaries";

type LegalSection = {
  heading: string;
  body: string[];
};

export const PRIVACY: Record<Locale, { title: string; updated: string; sections: LegalSection[] }> = {
  nl: {
    title: "Privacyverklaring",
    updated: "Laatst bijgewerkt: " + new Date().toLocaleDateString("nl-NL", { year: "numeric", month: "long" }),
    sections: [
      {
        heading: "Wie wij zijn",
        body: [
          "Majorille Garden is gevestigd aan Franz Zieglerstraat 201, 1087 HN Amsterdam. Voor vragen over deze privacyverklaring kunt u contact met ons opnemen via info@majorillegarden.nl of +31 6 4128 4643.",
        ],
      },
      {
        heading: "Welke gegevens wij verzamelen",
        body: [
          "Wij verzamelen alleen de gegevens die u zelf bij ons achterlaat: uw naam, e-mailadres, telefoonnummer en bericht via het contactformulier, en uw e-mailadres bij aanmelding voor onze nieuwsbrief. Reserveringen verlopen via Cal.com — Cal.com verwerkt de daar ingevulde gegevens conform haar eigen privacybeleid.",
        ],
      },
      {
        heading: "Waarvoor wij uw gegevens gebruiken",
        body: [
          "Wij gebruiken uw gegevens uitsluitend om u te beantwoorden, uw reservering te bevestigen, en u (indien aangemeld) onze nieuwsbrief te sturen. Wij verkopen of delen uw gegevens niet met derden voor marketingdoeleinden.",
        ],
      },
      {
        heading: "Hoe lang wij uw gegevens bewaren",
        body: [
          "Contactberichten worden bewaard zolang dit relevant is voor de behandeling van uw vraag, met een maximum van 24 maanden. Nieuwsbriefinschrijvingen worden bewaard totdat u zich afmeldt.",
        ],
      },
      {
        heading: "Uw rechten",
        body: [
          "U heeft het recht om uw gegevens in te zien, te corrigeren of te laten verwijderen. Stuur hiervoor een e-mail naar info@majorillegarden.nl. U heeft ook het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).",
        ],
      },
      {
        heading: "Cookies",
        body: [
          "Wij plaatsen alleen technische cookies die noodzakelijk zijn voor het functioneren van de website. Wij gebruiken geen tracking- of marketingcookies.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy policy",
    updated: "Last updated: " + new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long" }),
    sections: [
      {
        heading: "Who we are",
        body: [
          "Majorille Garden is based at Franz Zieglerstraat 201, 1087 HN Amsterdam. For questions about this policy, contact us at info@majorillegarden.nl or +31 6 4128 4643.",
        ],
      },
      {
        heading: "Information we collect",
        body: [
          "We only collect information you provide directly: your name, email, phone, and message through the contact form, and your email when you sign up for our newsletter. Bookings are handled by Cal.com, which processes the data you enter there in line with its own privacy policy.",
        ],
      },
      {
        heading: "How we use your data",
        body: [
          "We use your data only to respond to you, confirm your booking, and (if you opted in) send our newsletter. We do not sell or share your data with third parties for marketing.",
        ],
      },
      {
        heading: "Data retention",
        body: [
          "Contact messages are kept while relevant to your inquiry, up to a maximum of 24 months. Newsletter subscriptions are kept until you unsubscribe.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You have the right to access, correct, or delete your data. Email info@majorillegarden.nl to exercise these rights. You may also lodge a complaint with the Dutch Data Protection Authority (autoriteitpersoonsgegevens.nl).",
        ],
      },
      {
        heading: "Cookies",
        body: [
          "We only set technical cookies necessary for the website to function. We do not use tracking or marketing cookies.",
        ],
      },
    ],
  },
};

export const TERMS: Record<Locale, { title: string; updated: string; sections: LegalSection[] }> = {
  nl: {
    title: "Algemene voorwaarden",
    updated: "Laatst bijgewerkt: " + new Date().toLocaleDateString("nl-NL", { year: "numeric", month: "long" }),
    sections: [
      {
        heading: "Toepasselijkheid",
        body: [
          "Deze voorwaarden zijn van toepassing op alle behandelingen, producten en diensten van Majorille Garden, gevestigd aan Franz Zieglerstraat 201, 1087 HN Amsterdam.",
        ],
      },
      {
        heading: "Reserveringen en annuleren",
        body: [
          "Behandelingen vinden plaats op afspraak. Een reservering kan tot 24 uur van tevoren kosteloos worden geannuleerd of verzet. Bij annulering binnen 24 uur kunnen wij genoodzaakt zijn de behandeling in rekening te brengen.",
          "Onze diensten worden geleverd in een 'men-to-men en woman-to-woman' format.",
        ],
      },
      {
        heading: "Gezondheid en contra-indicaties",
        body: [
          "Sommige behandelingen (zoals moxibustie en hete steen massage) zijn niet geschikt bij koorts, acute ontstekingen of tijdens bepaalde fases van een zwangerschap. Meld eventuele gezondheidsklachten of medicatie altijd vooraf — wij adviseren u graag persoonlijk.",
        ],
      },
      {
        heading: "Producten en aansprakelijkheid",
        body: [
          "Onze producten zijn natuurlijk en biologisch. Bij een gevoelige huid of bekende allergieën adviseren wij een patch-test voor gebruik. Majorille Garden is niet aansprakelijk voor reacties die voortvloeien uit onjuist gebruik van producten.",
        ],
      },
      {
        heading: "Toepasselijk recht",
        body: [
          "Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Amsterdam.",
        ],
      },
    ],
  },
  en: {
    title: "Terms and conditions",
    updated: "Last updated: " + new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long" }),
    sections: [
      {
        heading: "Applicability",
        body: [
          "These terms apply to all treatments, products, and services of Majorille Garden, located at Franz Zieglerstraat 201, 1087 HN Amsterdam.",
        ],
      },
      {
        heading: "Bookings and cancellations",
        body: [
          "Treatments are by appointment. Reservations can be cancelled or rescheduled free of charge up to 24 hours in advance. Cancellations within 24 hours may be charged.",
          "Our treatments are delivered men-to-men and woman-to-woman.",
        ],
      },
      {
        heading: "Health and contraindications",
        body: [
          "Some treatments (such as moxibustion and hot stone massage) are not suitable during fever, acute inflammation, or certain phases of pregnancy. Please disclose any health concerns or medications beforehand — we'll be happy to advise.",
        ],
      },
      {
        heading: "Products and liability",
        body: [
          "Our products are natural and organic. For sensitive skin or known allergies we recommend a patch test before use. Majorille Garden is not liable for reactions arising from improper use of products.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          "These terms are governed by Dutch law. Disputes are submitted to the competent court in Amsterdam.",
        ],
      },
    ],
  },
};
