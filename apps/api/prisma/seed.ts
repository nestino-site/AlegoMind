import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient, ProfessionalType, SessionFormat, DayOfWeek, AccountType, BookingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const HASH_ROUNDS = 10;
const DEMO_PASSWORD = 'Demo1234!';
const PLATFORM_FEE_PERCENT = 0.2;

// ─── Demo professional upsert helper ───────────────────────────────────────────
// Keyed on email/username so re-running the seed never hits a unique
// constraint violation. The blunt `availability.deleteMany()` /
// `professional.deleteMany()` cleanup above always wipes those tables first,
// so on a second run the user row survives (upsert -> update branch) but its
// professional/availability rows are gone — the nested `professional.upsert`
// recreates them either way.
interface ProfessionalSeed {
  email: string;
  username: string;
  firstName: string;
  displayName: string;
  data: {
    type: ProfessionalType;
    bio: string;
    specializations: string[];
    sessionFormats: SessionFormat[];
    languages: string[];
    pricePerSession: number;
    trialPrice: number;
    trialDuration: number;
    availableForTrial: boolean;
    rating: number;
    reviewCount: number;
    yearsExperience: number;
    responseRate: number;
    isVerified: boolean;
    gender: string;
    isAvailable: boolean;
  };
  availability: { dayOfWeek: DayOfWeek; startTime: string; endTime: string }[];
}

async function upsertProfessional(seed: ProfessionalSeed) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, HASH_ROUNDS);
  return prisma.user.upsert({
    where: { email: seed.email },
    create: {
      email: seed.email,
      username: seed.username,
      passwordHash,
      accountType: AccountType.PROFESSIONAL,
      isEmailVerified: true,
      firstName: seed.firstName,
      displayName: seed.displayName,
      preferredLanguage: 'ro',
      professional: {
        create: {
          ...seed.data,
          availability: { createMany: { data: seed.availability } },
        },
      },
    },
    update: {
      firstName: seed.firstName,
      displayName: seed.displayName,
      professional: {
        upsert: {
          create: {
            ...seed.data,
            availability: { createMany: { data: seed.availability } },
          },
          update: {
            ...seed.data,
            availability: { createMany: { data: seed.availability } },
          },
        },
      },
    },
    include: { professional: true },
  });
}

async function main() {
  console.log('Seeding AlegoMind database...');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyPrisma = prisma as any;

  // ─── Clean up ────────────────────────────────────────────────────────────────
  // Demo bookings/reviews first — they FK-reference professionals, and the
  // blunt professional.deleteMany() below would otherwise fail on a re-run
  // with a foreign key violation against bookings created by the previous run.
  // Delete all dependent data before professionals to avoid FK violations
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await anyPrisma.chatService.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@seed.alegomind.ro' } } });

  // ─── Mentor 1: Andrei Ionescu — Career & Leadership Mentor ───────────────────
  const andrei = await prisma.user.create({
    data: {
      email: 'andrei.ionescu@seed.alegomind.ro',
      username: 'andrei_ionescu',
      passwordHash: await bcrypt.hash('Seed1234!', HASH_ROUNDS),
      accountType: AccountType.PROFESSIONAL,
      isEmailVerified: true,
      firstName: 'Andrei',
      displayName: 'Andrei I.',
      preferredLanguage: 'ro',
      professional: {
        create: {
          type: ProfessionalType.MENTOR,
          bio: `Cu peste 12 ani de experiență în corporate și antreprenoriat, am ajutat sute de profesioniști români să facă tranziții de carieră îndrăznețe. Am lucrat în companii precum BCR, Vodafone România și am co-fondat două startup-uri. Specializarea mea principală este leadership-ul autentic și claritatea profesională — te ajut să ieși din "pilotul automat" și să construiești o carieră care chiar are sens pentru tine.`,
          specializations: [
            'Tranziție de carieră',
            'Leadership',
            'Antreprenoriat',
            'Personal branding',
            'Burnout recovery',
          ],
          sessionFormats: [SessionFormat.VIDEO, SessionFormat.VOICE, SessionFormat.TEXT],
          languages: ['ro', 'en'],
          pricePerSession: 250,
          trialPrice: 75,
          trialDuration: 30,
          availableForTrial: true,
          rating: 4.9,
          reviewCount: 87,
          yearsExperience: 12,
          responseRate: 98,
          isVerified: true,
          verificationBadge: 'verified_mentor',
          isAvailable: true,
          availability: {
            createMany: {
              data: [
                { dayOfWeek: DayOfWeek.MONDAY,    startTime: '09:00', endTime: '13:00' },
                { dayOfWeek: DayOfWeek.MONDAY,    startTime: '15:00', endTime: '18:00' },
                { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '13:00' },
                { dayOfWeek: DayOfWeek.FRIDAY,    startTime: '10:00', endTime: '14:00' },
                { dayOfWeek: DayOfWeek.SATURDAY,  startTime: '10:00', endTime: '12:00' },
              ],
            },
          },
        },
      },
    },
  });

  // ─── Mentor 2: Maria Dumitrescu — Executive Coach ────────────────────────────
  const maria = await prisma.user.create({
    data: {
      email: 'maria.dumitrescu@seed.alegomind.ro',
      username: 'maria_dumitrescu_coach',
      passwordHash: await bcrypt.hash('Seed1234!', HASH_ROUNDS),
      accountType: AccountType.PROFESSIONAL,
      isEmailVerified: true,
      firstName: 'Maria',
      displayName: 'Maria D.',
      preferredLanguage: 'ro',
      professional: {
        create: {
          type: ProfessionalType.COACH,
          bio: `Sunt coach executiv certificat ICF (PCC) cu 8 ani experiență în coaching individual și de echipă. Am lucrat cu directori și manageri din industrii precum banking, pharma, tech și retail. Abordarea mea combină metodologii bazate pe neurologie (NLP), pozitivitate și mindfulness pentru a genera schimbări reale și sustenabile. Vorbesc fluent română, engleză și franceză.`,
          specializations: [
            'Executive coaching',
            'Managementul echipelor',
            'Work-life balance',
            'Comunicare asertivă',
            'Managementul stresului',
            'Creștere profesională',
          ],
          sessionFormats: [SessionFormat.VIDEO, SessionFormat.IN_PERSON, SessionFormat.VOICE],
          languages: ['ro', 'en', 'fr'],
          pricePerSession: 350,
          trialPrice: 99,
          trialDuration: 45,
          availableForTrial: true,
          rating: 5.0,
          reviewCount: 134,
          yearsExperience: 8,
          responseRate: 100,
          isVerified: true,
          verificationBadge: 'icf_certified',
          isAvailable: true,
          availability: {
            createMany: {
              data: [
                { dayOfWeek: DayOfWeek.TUESDAY,   startTime: '08:00', endTime: '12:00' },
                { dayOfWeek: DayOfWeek.TUESDAY,   startTime: '14:00', endTime: '17:00' },
                { dayOfWeek: DayOfWeek.THURSDAY,  startTime: '08:00', endTime: '12:00' },
                { dayOfWeek: DayOfWeek.THURSDAY,  startTime: '14:00', endTime: '17:00' },
                { dayOfWeek: DayOfWeek.FRIDAY,    startTime: '09:00', endTime: '12:00' },
              ],
            },
          },
        },
      },
    },
  });

  // ─── Mentor 3: Radu Constantin — Therapist & Mindfulness ─────────────────────
  const radu = await prisma.user.create({
    data: {
      email: 'radu.constantin@seed.alegomind.ro',
      username: 'radu_constantin_psiho',
      passwordHash: await bcrypt.hash('Seed1234!', HASH_ROUNDS),
      accountType: AccountType.PROFESSIONAL,
      isEmailVerified: true,
      firstName: 'Radu',
      displayName: 'Radu C.',
      preferredLanguage: 'ro',
      professional: {
        create: {
          type: ProfessionalType.THERAPIST,
          bio: `Psiholog clinician și psihoterapeut cu specializare în terapie cognitiv-comportamentală (CBT) și terapie de acceptare și angajament (ACT). Absolvent al Universității București, cu master în psihologie clinică și doctorat în curs. Lucrez cu adulți care se confruntă cu anxietate, depresie, burnout sau probleme relaționale. Cred în terapia colaborativă, bazată pe dovezi — nu pe sfaturi generice.`,
          specializations: [
            'Anxietate și atacuri de panică',
            'Depresie',
            'Burnout',
            'Relații și comunicare',
            'Traumă și PTSD',
            'Terapie cognitiv-comportamentală (CBT)',
          ],
          sessionFormats: [SessionFormat.VIDEO, SessionFormat.TEXT],
          languages: ['ro', 'en'],
          pricePerSession: 200,
          trialPrice: null,
          trialDuration: null,
          availableForTrial: false,
          rating: 4.8,
          reviewCount: 62,
          yearsExperience: 6,
          responseRate: 95,
          isVerified: true,
          verificationBadge: 'licensed_therapist',
          isAvailable: true,
          availability: {
            createMany: {
              data: [
                { dayOfWeek: DayOfWeek.MONDAY,    startTime: '17:00', endTime: '21:00' },
                { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '17:00', endTime: '21:00' },
                { dayOfWeek: DayOfWeek.SATURDAY,  startTime: '09:00', endTime: '14:00' },
                { dayOfWeek: DayOfWeek.SUNDAY,    startTime: '09:00', endTime: '13:00' },
              ],
            },
          },
        },
      },
    },
  });

  console.log('Seeded professionals:');
  console.log(`  Mentor:    ${andrei.displayName} <${andrei.email}>`);
  console.log(`  Coach:     ${maria.displayName} <${maria.email}>`);
  console.log(`  Therapist: ${radu.displayName} <${radu.email}>`);

  // ─── Demo seeker ──────────────────────────────────────────────────────────────

  const demoSeeker = await prisma.user.upsert({
    where: { email: 'seeker@demo.com' },
    create: {
      email: 'seeker@demo.com',
      username: 'demo_seeker_alex',
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, HASH_ROUNDS),
      accountType: AccountType.SEEKER,
      isEmailVerified: true,
      firstName: 'Alex',
      preferredLanguage: 'ro',
    },
    update: {
      firstName: 'Alex',
      isEmailVerified: true,
    },
  });

  // ─── 6 demo professionals (matching /explorez mock-data set) ───────────────────

  const drAndrei = await upsertProfessional({
    email: 'andrei.m@demo.alegomind.ro',
    username: 'dr_andrei_m',
    firstName: 'Andrei',
    displayName: 'Dr. Andrei M.',
    data: {
      type: ProfessionalType.THERAPIST,
      bio: 'Psihiatru și psihoterapeut cu 8 ani de experiență în tratarea anxietății, depresiei și atacurilor de panică. Combin terapia cognitiv-comportamentală cu tehnici de mindfulness pentru rezultate durabile. Lucrez atât cu adulți tineri, cât și cu profesioniști aflați sub presiune constantă.',
      specializations: ['Anxietate', 'Depresie', 'Atacuri de panică'],
      sessionFormats: [SessionFormat.VIDEO, SessionFormat.VOICE, SessionFormat.TEXT],
      languages: ['ro', 'en'],
      pricePerSession: 280,
      trialPrice: 50,
      trialDuration: 30,
      availableForTrial: true,
      rating: 4.9,
      reviewCount: 128,
      yearsExperience: 8,
      responseRate: 97,
      isVerified: true,
      gender: 'male',
      isAvailable: true,
    },
    availability: [
      { dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: DayOfWeek.MONDAY, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: DayOfWeek.FRIDAY, startTime: '14:00', endTime: '18:00' },
    ],
  });

  const drElena = await upsertProfessional({
    email: 'elena.r@demo.alegomind.ro',
    username: 'dr_elena_r',
    firstName: 'Elena',
    displayName: 'Dr. Elena R.',
    data: {
      type: ProfessionalType.THERAPIST,
      bio: 'Psiholog clinician specializată în terapia traumei și a relațiilor. Ajut clienții să proceseze experiențe dificile și să construiască conexiuni mai sănătoase, într-un spațiu sigur și fără judecată. Prefer ședințele video sau față în față pentru o conexiune mai profundă.',
      specializations: ['Stres', 'Relații', 'Traumă'],
      sessionFormats: [SessionFormat.VIDEO, SessionFormat.IN_PERSON],
      languages: ['ro'],
      pricePerSession: 260,
      trialPrice: 50,
      trialDuration: 30,
      availableForTrial: true,
      rating: 4.7,
      reviewCount: 83,
      yearsExperience: 7,
      responseRate: 95,
      isVerified: true,
      gender: 'female',
      isAvailable: true,
    },
    availability: [
      { dayOfWeek: DayOfWeek.TUESDAY, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: DayOfWeek.THURSDAY, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: DayOfWeek.SATURDAY, startTime: '10:00', endTime: '14:00' },
    ],
  });

  const mihai = await upsertProfessional({
    email: 'mihai.t@demo.alegomind.ro',
    username: 'mihai_t_coach',
    firstName: 'Mihai',
    displayName: 'Mihai T.',
    data: {
      type: ProfessionalType.COACH,
      bio: 'Coach de carieră și leadership cu experiență în consultanță și management. Am ghidat zeci de profesioniști spre roluri de conducere și decizii de carieră mai clare. Cred în acțiune concretă, nu doar în discuții teoretice.',
      specializations: ['Carieră', 'Leadership', 'Dezvoltare personală'],
      sessionFormats: [SessionFormat.VIDEO, SessionFormat.IN_PERSON],
      languages: ['ro', 'en'],
      pricePerSession: 230,
      trialPrice: 50,
      trialDuration: 30,
      availableForTrial: true,
      rating: 4.9,
      reviewCount: 94,
      yearsExperience: 6,
      responseRate: 98,
      isVerified: true,
      gender: 'male',
      isAvailable: true,
    },
    availability: [
      { dayOfWeek: DayOfWeek.MONDAY, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '14:00', endTime: '17:00' },
      { dayOfWeek: DayOfWeek.FRIDAY, startTime: '09:00', endTime: '12:00' },
    ],
  });

  const lena = await upsertProfessional({
    email: 'lena.p@demo.alegomind.ro',
    username: 'lena_p_coach',
    firstName: 'Lena',
    displayName: 'Lena P.',
    data: {
      type: ProfessionalType.COACH,
      bio: 'Coach de dezvoltare personală axată pe mindset și motivație. Te ajut să-ți identifici blocajele și să construiești obiceiuri care chiar funcționează pentru tine, fără presiune sau judecată.',
      specializations: ['Mindset', 'Dezvoltare personală', 'Motivație'],
      sessionFormats: [SessionFormat.TEXT, SessionFormat.VIDEO],
      languages: ['ro'],
      pricePerSession: 180,
      trialPrice: 50,
      trialDuration: 30,
      availableForTrial: true,
      rating: 4.6,
      reviewCount: 41,
      yearsExperience: 4,
      responseRate: 95,
      isVerified: true,
      gender: 'female',
      isAvailable: true,
    },
    availability: [
      { dayOfWeek: DayOfWeek.TUESDAY, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: DayOfWeek.THURSDAY, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: DayOfWeek.SATURDAY, startTime: '09:00', endTime: '12:00' },
    ],
  });

  const ali = await upsertProfessional({
    email: 'ali.r@demo.alegomind.ro',
    username: 'ali_r_mentor',
    firstName: 'Ali',
    displayName: 'Ali R.',
    data: {
      type: ProfessionalType.MENTOR,
      bio: 'Inginer software devenit mentor pentru profesioniști din tech care vor să avanseze în carieră sau să lanseze un startup. 9 ani de experiență în companii internaționale de AI și produse digitale.',
      specializations: ['Inginerie AI', 'Carieră Tech', 'Startup'],
      sessionFormats: [SessionFormat.VIDEO, SessionFormat.VOICE],
      languages: ['ro', 'en'],
      pricePerSession: 320,
      trialPrice: 50,
      trialDuration: 30,
      availableForTrial: true,
      rating: 4.9,
      reviewCount: 62,
      yearsExperience: 9,
      responseRate: 96,
      isVerified: true,
      gender: 'male',
      isAvailable: true,
    },
    availability: [
      { dayOfWeek: DayOfWeek.MONDAY, startTime: '18:00', endTime: '21:00' },
      { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '18:00', endTime: '21:00' },
      { dayOfWeek: DayOfWeek.SATURDAY, startTime: '10:00', endTime: '14:00' },
      { dayOfWeek: DayOfWeek.SUNDAY, startTime: '10:00', endTime: '13:00' },
    ],
  });

  const sara = await upsertProfessional({
    email: 'sara.m@demo.alegomind.ro',
    username: 'sara_m_mentor',
    firstName: 'Sara',
    displayName: 'Sara M.',
    data: {
      type: ProfessionalType.MENTOR,
      bio: 'Product manager cu experiență în AI și startup-uri internaționale. Ofer mentorat practic pentru cei care vor să intre sau să crească în domeniul tech și product management.',
      specializations: ['AI & Tech', 'Startup', 'Product'],
      sessionFormats: [SessionFormat.VIDEO, SessionFormat.TEXT],
      languages: ['en', 'ro'],
      pricePerSession: 200,
      trialPrice: 50,
      trialDuration: 30,
      availableForTrial: true,
      rating: 4.8,
      reviewCount: 57,
      yearsExperience: 5,
      responseRate: 98,
      isVerified: true,
      gender: 'female',
      isAvailable: true,
    },
    availability: [
      { dayOfWeek: DayOfWeek.TUESDAY, startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: DayOfWeek.THURSDAY, startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: DayOfWeek.THURSDAY, startTime: '14:00', endTime: '17:00' },
    ],
  });

  // ─── Bookings + reviews for 3 of the 6 (one THERAPIST, one COACH, one MENTOR) ──
  // (cleanup for these already ran at the top of main(), before professionals
  // were recreated, to avoid the FK violation described there)

  function daysAgo(n: number) {
    return new Date(Date.now() - n * 86_400_000);
  }

  async function seedBookingWithReview(opts: {
    professionalId: string;
    daysAgo: number;
    sessionType: SessionFormat;
    pricePerSession: number;
    rating: number;
    comment: string;
  }) {
    const platformFee = Math.round(opts.pricePerSession * PLATFORM_FEE_PERCENT * 100) / 100;
    const professionalEarning = Math.round((opts.pricePerSession - platformFee) * 100) / 100;

    const booking = await prisma.booking.create({
      data: {
        seekerId: demoSeeker.id,
        professionalId: opts.professionalId,
        sessionType: opts.sessionType,
        durationMinutes: 50,
        scheduledAt: daysAgo(opts.daysAgo),
        status: BookingStatus.COMPLETED,
        price: opts.pricePerSession,
        platformFee,
        professionalEarning,
      },
    });

    await prisma.review.create({
      data: {
        bookingId: booking.id,
        seekerId: demoSeeker.id,
        professionalId: opts.professionalId,
        rating: opts.rating,
        comment: opts.comment,
      },
    });
  }

  if (drAndrei.professional) {
    await seedBookingWithReview({
      professionalId: drAndrei.professional.id,
      daysAgo: 20,
      sessionType: SessionFormat.VIDEO,
      pricePerSession: drAndrei.professional.pricePerSession,
      rating: 5,
      comment: 'Andrei m-a ajutat enorm să gestionez atacurile de panică. Recomand cu toată încrederea!',
    });
    await seedBookingWithReview({
      professionalId: drAndrei.professional.id,
      daysAgo: 10,
      sessionType: SessionFormat.TEXT,
      pricePerSession: drAndrei.professional.pricePerSession,
      rating: 5,
      comment: 'Foarte atent și profesionist. Ședințele text sunt surprinzător de eficiente.',
    });
  }

  if (mihai.professional) {
    await seedBookingWithReview({
      professionalId: mihai.professional.id,
      daysAgo: 25,
      sessionType: SessionFormat.VIDEO,
      pricePerSession: mihai.professional.pricePerSession,
      rating: 5,
      comment: 'Mihai mi-a dat claritate în decizia de carieră pe care o evitam de luni. Excelent coach!',
    });
    await seedBookingWithReview({
      professionalId: mihai.professional.id,
      daysAgo: 12,
      sessionType: SessionFormat.IN_PERSON,
      pricePerSession: mihai.professional.pricePerSession,
      rating: 4,
      comment: 'Sesiune utilă, mi-ar fi plăcut puțin mai mult timp pentru întrebări, dar per total recomand.',
    });
  }

  if (ali.professional) {
    await seedBookingWithReview({
      professionalId: ali.professional.id,
      daysAgo: 18,
      sessionType: SessionFormat.VIDEO,
      pricePerSession: ali.professional.pricePerSession,
      rating: 5,
      comment: 'Ali cunoaște foarte bine industria AI și mi-a dat sfaturi concrete pentru CV și interviuri.',
    });
    await seedBookingWithReview({
      professionalId: ali.professional.id,
      daysAgo: 6,
      sessionType: SessionFormat.VOICE,
      pricePerSession: ali.professional.pricePerSession,
      rating: 5,
      comment: 'Mentor excelent — practic, direct și foarte la curent cu piața tech.',
    });
  }


  // ── Chat services ──────────────────────────────────────────────────────────
  // Upsert so re-running the seed is safe

  async function upsertChatServices(professionalId: string, services: { name: string; description: string; price: number; sortOrder: number }[]) {
    for (const s of services) {
      const existing = await anyPrisma.chatService.findFirst({ where: { professionalId, name: s.name } });
      if (!existing) {
        await anyPrisma.chatService.create({ data: { ...s, professionalId } });
      }
    }
  }

  if (drAndrei.professional) {
    await upsertChatServices(drAndrei.professional.id, [
      { name: 'Sesiune CBT anxietate', description: 'O sesiune structurata de terapie cognitiv-comportamentala focusata pe anxietate', price: 60, sortOrder: 0 },
      { name: 'Evaluare si plan de tratament', description: 'Evaluare psihologica initiala + plan personalizat de interventie', price: 80, sortOrder: 1 },
    ]);
  }

  if (drElena.professional) {
    await upsertChatServices(drElena.professional.id, [
      { name: 'Sesiune de procesare a traumei', description: 'Spatiu sigur pentru a lucra prin experiente dificile din trecut', price: 65, sortOrder: 0 },
      { name: 'Ghid relatii sanatoase', description: 'Tehnici practice pentru relatii mai bune cu cei dragi', price: 50, sortOrder: 1 },
    ]);
  }

  if (mihai.professional) {
    await upsertChatServices(mihai.professional.id, [
      { name: 'Strategie de cariera', description: 'Analiza situatiei actuale si plan concret pentru urmatorul nivel', price: 45, sortOrder: 0 },
      { name: 'Review CV + profil LinkedIn', description: 'Feedback detaliat si rescrierea punctelor cheie', price: 55, sortOrder: 1 },
    ]);
  }

  if (lena.professional) {
    await upsertChatServices(lena.professional.id, [
      { name: 'Reset mindset - 30 min', description: 'Sesiune rapida de clarificare a blocajelor mentale si reprioritizare', price: 35, sortOrder: 0 },
      { name: 'Plan de obiceiuri personalizat', description: 'Sistem practic de obiceiuri adaptat stilului tau de viata', price: 50, sortOrder: 1 },
    ]);
  }

  if (ali.professional) {
    await upsertChatServices(ali.professional.id, [
      { name: 'AI Career Roadmap', description: 'Roadmap personalizat pentru o cariera in AI/ML cu resurse si pasi concisi', price: 30, sortOrder: 0 },
      { name: 'Pregatire interviu tehnic', description: 'Mock interview + feedback pentru roluri de inginer AI/software', price: 45, sortOrder: 1 },
      { name: 'Review proiect/cod', description: 'Feedback tehnic pe un proiect sau modul de cod al tau', price: 40, sortOrder: 2 },
    ]);
  }

  if (sara.professional) {
    await upsertChatServices(sara.professional.id, [
      { name: 'Strategie produs digital', description: 'Sesiune de clarificare a viziunii de produs si prioritizare features', price: 50, sortOrder: 0 },
      { name: 'Intrare in tech/product', description: 'Plan de tranzitie pentru cineva care vrea sa intre in domeniul tech', price: 40, sortOrder: 1 },
    ]);
  }

  console.log('Seeded demo seeker:');
  console.log(`  ${demoSeeker.firstName} <${demoSeeker.email}> / password: ${DEMO_PASSWORD}`);
  console.log('Seeded demo professionals:');
  for (const p of [drAndrei, drElena, mihai, lena, ali, sara]) {
    console.log(`  ${p.displayName} <${p.email}> / password: ${DEMO_PASSWORD}`);
  }
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
