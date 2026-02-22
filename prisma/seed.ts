import {
  PrismaClient,
  UserRole,
  TransactionStatus,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

/** Generate an 8-char alphanumeric referral code (matches utils/referral.ts) */
function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateInvoiceNumber(index: number): string {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `INV-${ymd}-${String(index).padStart(5, "0")}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────

const EVENT_CATEGORIES = [
  "Musik",
  "Seminar",
  "Workshop",
  "Olahraga",
  "Pameran",
  "Festival",
  "Konferensi",
  "Webinar",
  "Kompetisi",
  "Charity",
];

const CITIES = [
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Yogyakarta",
  "Semarang",
  "Medan",
  "Makassar",
  "Denpasar",
  "Malang",
  "Solo",
];

const PROVINCES: Record<string, string> = {
  Jakarta: "DKI Jakarta",
  Bandung: "Jawa Barat",
  Surabaya: "Jawa Timur",
  Yogyakarta: "DI Yogyakarta",
  Semarang: "Jawa Tengah",
  Medan: "Sumatera Utara",
  Makassar: "Sulawesi Selatan",
  Denpasar: "Bali",
  Malang: "Jawa Timur",
  Solo: "Jawa Tengah",
};

const CUSTOMER_DATA = [
  { name: "Andi Pratama", email: "andi.pratama@gmail.com" },
  { name: "Siti Nurhaliza", email: "siti.nurhaliza@gmail.com" },
  { name: "Budi Santoso", email: "budi.santoso@gmail.com" },
  { name: "Dewi Lestari", email: "dewi.lestari@gmail.com" },
  { name: "Rahmat Hidayat", email: "rahmat.hidayat@gmail.com" },
  { name: "Putri Ayu", email: "putri.ayu@gmail.com" },
  { name: "Fajar Setiawan", email: "fajar.setiawan@gmail.com" },
  { name: "Rina Marlina", email: "rina.marlina@gmail.com" },
  { name: "Dimas Arya", email: "dimas.arya@gmail.com" },
  { name: "Nisa Amelia", email: "nisa.amelia@gmail.com" },
  { name: "Galih Putra", email: "galih.putra@gmail.com" },
  { name: "Maya Sari", email: "maya.sari@gmail.com" },
  { name: "Hendra Wijaya", email: "hendra.wijaya@gmail.com" },
  { name: "Laila Fitri", email: "laila.fitri@gmail.com" },
  { name: "Taufik Rahman", email: "taufik.rahman@gmail.com" },
  { name: "Citra Dewi", email: "citra.dewi@gmail.com" },
  { name: "Rizky Maulana", email: "rizky.maulana@gmail.com" },
  { name: "Ayu Wulandari", email: "ayu.wulandari@gmail.com" },
  { name: "Bagus Prasetyo", email: "bagus.prasetyo@gmail.com" },
  { name: "Indah Permata", email: "indah.permata@gmail.com" },
];

const ORGANIZER_DATA = [
  { name: "EventNusantara", email: "eventnusantara@eventpro.com" },
  { name: "KreasiIndonesia", email: "kreasiindonesia@eventpro.com" },
  { name: "GelarBudaya", email: "gelarbudaya@eventpro.com" },
  { name: "SeniPanggung", email: "senipanggung@eventpro.com" },
  { name: "FestivalKita", email: "festivalkita@eventpro.com" },
  { name: "AcaraHebat", email: "acarahebat@eventpro.com" },
  { name: "JelajahEvent", email: "jelajahevent@eventpro.com" },
  { name: "PestaRakyat", email: "pestarakyat@eventpro.com" },
  { name: "KarnavalIndo", email: "karnavalindo@eventpro.com" },
  { name: "PanggungMeriah", email: "panggungmeriah@eventpro.com" },
];

const EVENT_NAMES: { category: string; names: string[] }[] = [
  {
    category: "Musik",
    names: ["Rock in Solo", "Jazz Night Jakarta", "Indie Music Fest"],
  },
  {
    category: "Seminar",
    names: [
      "Tech Talk Indonesia",
      "Startup Summit 2026",
      "Digital Marketing Seminar",
    ],
  },
  {
    category: "Workshop",
    names: [
      "Workshop Fotografi",
      "Kelas Barista Nusantara",
      "Workshop UI/UX Design",
    ],
  },
  {
    category: "Olahraga",
    names: [
      "Marathon Bandung",
      "Fun Run Surabaya",
      "Turnamen Badminton Nasional",
    ],
  },
  {
    category: "Pameran",
    names: [
      "Pameran Seni Rupa",
      "Expo UMKM Nusantara",
      "Pameran Otomotif 2026",
    ],
  },
  {
    category: "Festival",
    names: [
      "Festival Kuliner Jogja",
      "Bali Art Festival",
      "Festival Budaya Makassar",
    ],
  },
  {
    category: "Konferensi",
    names: ["DevCon Indonesia", "HR Conference 2026", "FinTech Conference"],
  },
  {
    category: "Webinar",
    names: [
      "Webinar AI & Machine Learning",
      "Webinar Kesehatan Mental",
      "Webinar Investasi",
    ],
  },
  {
    category: "Kompetisi",
    names: [
      "Hackathon Indonesia",
      "Lomba Debat Nasional",
      "E-Sports Championship",
    ],
  },
  {
    category: "Charity",
    names: ["Charity Concert", "Fun Walk for Education", "Gala Dinner Amal"],
  },
];

// Unique image for every event — uses picsum.photos with seeded IDs for variety
const EVENT_IMAGES: Record<string, string[]> = {
  Musik: [
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=400&fit=crop",
  ],
  Seminar: [
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1591115765373-5f9cf1da241d?w=800&h=400&fit=crop",
  ],
  Workshop: [
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop",
  ],
  Olahraga: [
    "https://images.unsplash.com/photo-1461896836934-bd45ba8e6e83?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=400&fit=crop",
  ],
  Pameran: [
    "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1594122230689-45899d9e6f69?w=800&h=400&fit=crop",
  ],
  Festival: [
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1472653431158-6364773b2a56?w=800&h=400&fit=crop",
  ],
  Konferensi: [
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1587825140708-dfaf18c4b4ae?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=400&fit=crop",
  ],
  Webinar: [
    "https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1609234656388-0ff363383899?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=400&fit=crop",
  ],
  Kompetisi: [
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop",
  ],
  Charity: [
    "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=400&fit=crop",
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=400&fit=crop",
  ],
};

const TICKET_TYPES_TEMPLATE = [
  { name: "Regular", priceFactor: 1 },
  { name: "VIP", priceFactor: 2.5 },
  { name: "VVIP", priceFactor: 4 },
  { name: "Early Bird", priceFactor: 0.7 },
];

const PROMO_CODES = [
  "EARLYBIRD10",
  "DISKON15",
  "HEMAT20",
  "SPESIAL25",
  "SUPERDEAL30",
  "PROMO50K",
  "FLASHSALE",
  "WEEKEND10",
  "MEMBER15",
  "NEWUSER20",
  "VIP30",
  "LOYAL25",
  "BUNDLEDEAL",
  "LASTCHANCE",
  "HAPPYHOUR",
  "SEASONAL10",
  "RAMADHAN20",
  "MERDEKA17",
  "NATAL25",
  "TAHUNBARU",
  "LAUNCH10",
  "COMEBACK15",
  "REFERRAL20",
  "BIRTHDAY25",
  "ANNIVERSARY",
  "GROUPDEAL",
  "FAMILY15",
  "STUDENT10",
  "TEACHERS",
  "CORPORATE20",
];

const REVIEW_COMMENTS = [
  "Acaranya sangat bagus! Sangat terorganisir dan menyenangkan.",
  "Pengalaman yang luar biasa. Pasti akan datang lagi tahun depan.",
  "Lokasi strategis dan mudah dijangkau. Sound system oke banget.",
  "Sedikit kecewa dengan antrian yang panjang, tapi secara keseluruhan oke.",
  "Bintang tamu yang tampil sangat memukau. Worth every penny!",
  "Makanan dan minuman di venue juga enak-enak. Recommended!",
  "Agak crowded, tapi tetap seru. Semoga next event lebih besar tempatnya.",
  "Tim panitia sangat ramah dan helpful. Good job!",
  "Acara dimulai tepat waktu, dan selesai sesuai jadwal. Profesional!",
  "Harga tiket sesuai dengan kualitas acara. Tidak mengecewakan.",
  "Tempatnya nyaman, tapi parkir agak susah. Tolong diperhatikan.",
  "Sangat inspiratif! Banyak insight baru yang didapatkan.",
  "MC-nya lucu dan bisa menghidupkan suasana. Seru!",
  "Kualitas audio visual sangat baik. Penonton merasa nyaman.",
  "Sayangnya hujan, tapi panitia sigap menyediakan tenda. Salut!",
  "Event paling seru yang pernah saya hadiri tahun ini.",
  "Akan merekomendasikan ke teman-teman. Acara berkualitas tinggi.",
  "Sedikit terlalu ramai, tapi overall pengalaman menyenangkan.",
  "Pembicara sangat kompeten dan materinya relevan.",
  "Dekorasi venue sangat instagrammable. Banyak spot foto!",
  "Sistem tiketnya mudah, check-in cepat. Top!",
  "Acara charity yang sangat bermakna. Bangga bisa ikut serta.",
  "Workshopnya hands-on dan praktis. Langsung bisa dipraktikkan.",
  "Makanan cateringnya enak tapi porsinya kurang. Sayang banget.",
  "Entertainment-nya keren, tapi sound system bisa lebih baik lagi.",
  "Lokasi agak jauh dari pusat kota, tapi pemandangannya bagus.",
  "Panitia sangat komunikatif, informasi update selalu tepat waktu.",
  "Harga tiket VIP worth it! Fasilitas dan viewnya premium.",
  "Overall puas, berharap ada event serupa lagi di kota saya.",
  "Bintang 5! Dari awal sampai akhir, semuanya sempurna.",
];

// ─── SEED FUNCTIONS ──────────────────────────────────────────────────────────

async function seedEventCategories(): Promise<
  { id: string; name: string }[]
> {
  console.log("🌱 Seeding Event Categories...");
  const categories: { id: string; name: string }[] = [];

  for (const name of EVENT_CATEGORIES) {
    const cat = await prisma.eventCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories.push({ id: cat.id, name: cat.name });
  }

  console.log(`   ✅ ${categories.length} event categories seeded.`);
  return categories;
}

async function seedUsers(): Promise<{
  organizerIds: string[];
  customerIds: string[];
}> {
  console.log("🌱 Seeding Users...");
  const hashedPassword = await bcrypt.hash("Password123!", 10);
  const organizerIds: string[] = [];
  const customerIds: string[] = [];

  // ── Organizers (10) ──
  for (const org of ORGANIZER_DATA) {
    const user = await prisma.user.upsert({
      where: { email: org.email },
      update: {},
      create: {
        email: org.email,
        password: hashedPassword,
        full_name: org.name,
        phone_number: `08${randomInt(1000000000, 9999999999)}`,
        role: UserRole.ORGANIZER,
        referral_code: generateReferralCode(),
      },
    });
    organizerIds.push(user.id);
  }

  // ── Customers (20) ──
  // First 6 customers register without referral
  for (let i = 0; i < CUSTOMER_DATA.length; i++) {
    const cust = CUSTOMER_DATA[i];
    const referralCode = generateReferralCode();

    // Customers index 6+ are "referred" by an earlier customer (index 0-5)
    // This mirrors the auth.services.ts referral flow:
    //   → referred customer gets a 10% coupon (valid 3 months)
    //   → referrer gets 10,000 points (valid 3 months)
    const referredBy =
      i > 5 ? customerIds[randomInt(0, Math.min(i - 1, 5))] : undefined;

    const user = await prisma.user.upsert({
      where: { email: cust.email },
      update: {},
      create: {
        email: cust.email,
        password: hashedPassword,
        full_name: cust.name,
        phone_number: `08${randomInt(1000000000, 9999999999)}`,
        role: UserRole.CUSTOMER,
        referral_code: referralCode,
        referred_by: referredBy ?? null,
      },
    });
    customerIds.push(user.id);

    // Simulate referral rewards (same as auth.services.ts register)
    if (referredBy) {
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      // 10% discount coupon for new user
      await prisma.coupon.create({
        data: {
          user_id: user.id,
          code: `REF-${generateReferralCode()}`,
          discount_percentage: 10,
          valid_from: new Date(),
          valid_until: threeMonthsFromNow,
        },
      });

      // 10,000 points to referrer
      await prisma.point.create({
        data: {
          user_id: referredBy,
          amount: 10000,
          remaining_amount: 10000,
          expires_at: threeMonthsFromNow,
        },
      });
    }
  }

  console.log(
    `   ✅ ${organizerIds.length} organizers + ${customerIds.length} customers seeded.`,
  );
  return { organizerIds, customerIds };
}

async function seedEvents(
  organizerIds: string[],
  categories: { id: string; name: string }[],
): Promise<string[]> {
  console.log("🌱 Seeding Events (30)...");
  const eventIds: string[] = [];
  let idx = 0;

  for (const group of EVENT_NAMES) {
    const category = categories.find((c) => c.name === group.category)!;

    for (const eventName of group.names) {
      const city = CITIES[idx % CITIES.length];
      const totalSeats = randomInt(100, 1000);

      // Charity events are free, others have a price
      const basePrice =
        group.category === "Charity" ? 0 : randomInt(50, 500) * 1000;
      const isFree = basePrice === 0;

      // Pick a category-specific image (cycles through 3 per category)
      const categoryImages = EVENT_IMAGES[group.category] || [];
      const eventImage =
        categoryImages.length > 0
          ? categoryImages[group.names.indexOf(eventName) % categoryImages.length]
          : null;

      // Mix of past events (for reviews) and future events (for purchases)
      let startDate: Date;
      let endDate: Date;

      if (idx < 10) {
        // First 10 events: already ended (for reviews & DONE transactions)
        startDate = randomDate(new Date("2026-01-05"), new Date("2026-02-10"));
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + randomInt(1, 3));
      } else {
        // Remaining 20 events: upcoming (for ticket purchases)
        startDate = randomDate(new Date("2026-03-15"), new Date("2026-12-31"));
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + randomInt(1, 3));
      }

      const event = await prisma.event.create({
        data: {
          organizer_id: organizerIds[idx % organizerIds.length],
          category_id: category.id,
          name: eventName,
          description: `${eventName} adalah acara ${group.category.toLowerCase()} terbesar di ${city}. Bergabunglah bersama ribuan pengunjung untuk menikmati pengalaman luar biasa di ${PROVINCES[city]}. Acara ini menghadirkan berbagai aktivitas menarik dan bintang tamu spesial.`,
          city,
          province: PROVINCES[city],
          image: eventImage,
          start_date: startDate,
          end_date: endDate,
          total_seats: totalSeats,
          available_seats: Math.floor(totalSeats * 0.7),
          base_price: basePrice,
          is_free: isFree,
        },
      });

      eventIds.push(event.id);
      idx++;
    }
  }

  console.log(`   ✅ ${eventIds.length} events seeded.`);
  return eventIds;
}

async function seedTicketTypes(eventIds: string[]): Promise<string[]> {
  console.log("🌱 Seeding Ticket Types...");
  const ticketTypeIds: string[] = [];

  for (const eventId of eventIds) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) continue;

    // Each event gets 2-3 ticket types
    const numTypes = randomInt(2, 3);
    const selected = TICKET_TYPES_TEMPLATE.slice(0, numTypes);

    for (const tmpl of selected) {
      const quantity = Math.floor(event.total_seats / numTypes);
      const price = Number(event.base_price) * tmpl.priceFactor;

      const tt = await prisma.ticketType.create({
        data: {
          event_id: eventId,
          name: tmpl.name,
          description: `Tiket ${tmpl.name} untuk ${event.name}`,
          price,
          quantity,
          available_quantity: Math.floor(quantity * 0.7),
        },
      });
      ticketTypeIds.push(tt.id);
    }
  }

  console.log(`   ✅ ${ticketTypeIds.length} ticket types seeded.`);
  return ticketTypeIds;
}

async function seedPromotions(eventIds: string[]): Promise<string[]> {
  console.log("🌱 Seeding Promotions (30)...");
  const promotionIds: string[] = [];

  for (let i = 0; i < 30; i++) {
    const eventId = eventIds[i % eventIds.length];
    const code = PROMO_CODES[i];
    const isPercentage = i % 2 === 0;

    const promo = await prisma.promotion.create({
      data: {
        event_id: eventId,
        code,
        discount_percentage: isPercentage ? randomInt(5, 30) : null,
        discount_amount: !isPercentage ? randomInt(10, 100) * 1000 : null,
        max_usage: randomInt(50, 200),
        current_usage: randomInt(0, 20),
        valid_from: new Date("2026-01-01"),
        valid_until: new Date("2026-12-31"),
      },
    });
    promotionIds.push(promo.id);
  }

  console.log(`   ✅ ${promotionIds.length} promotions seeded.`);
  return promotionIds;
}

async function seedCoupons(customerIds: string[]): Promise<string[]> {
  console.log("🌱 Seeding Coupons (30)...");
  const couponIds: string[] = [];

  for (let i = 0; i < 30; i++) {
    const userId = customerIds[i % customerIds.length];
    const code = `COUPON-${String(i + 1).padStart(4, "0")}`;
    const isPercentage = i % 2 === 0;

    const coupon = await prisma.coupon.create({
      data: {
        user_id: userId,
        code,
        discount_percentage: isPercentage ? randomInt(5, 20) : null,
        discount_amount: !isPercentage ? randomInt(5, 50) * 1000 : null,
        valid_from: new Date("2026-01-01"),
        valid_until: new Date("2026-08-31"),
        is_used: i < 10, // First 10 are marked as used
      },
    });
    couponIds.push(coupon.id);
  }

  console.log(`   ✅ ${couponIds.length} coupons seeded.`);
  return couponIds;
}

async function seedPoints(customerIds: string[]): Promise<void> {
  console.log("🌱 Seeding Points (30)...");
  let count = 0;

  for (let i = 0; i < 30; i++) {
    const userId = customerIds[i % customerIds.length];
    const amount = randomInt(1000, 10000);
    const remainingAmount = randomInt(0, amount);
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + randomInt(1, 6));

    // Limit to max 3 point records per user (referral ones already seeded)
    const existingCount = await prisma.point.count({
      where: { user_id: userId },
    });
    if (existingCount < 3) {
      await prisma.point.create({
        data: {
          user_id: userId,
          amount,
          remaining_amount: remainingAmount,
          expires_at: expiresAt,
        },
      });
      count++;
    }
  }

  console.log(`   ✅ ${count} extra point records seeded.`);
}

async function seedTransactions(
  customerIds: string[],
  eventIds: string[],
  promotionIds: string[],
  couponIds: string[],
): Promise<string[]> {
  console.log("🌱 Seeding Transactions (30)...");
  const transactionIds: string[] = [];

  // Weighted statuses: more DONE for dashboard/revenue data
  const statuses: TransactionStatus[] = [
    TransactionStatus.DONE,
    TransactionStatus.DONE,
    TransactionStatus.DONE,
    TransactionStatus.DONE,
    TransactionStatus.WAITING_PAYMENT,
    TransactionStatus.WAITING_CONFIRMATION,
    TransactionStatus.REJECTED,
    TransactionStatus.EXPIRED,
    TransactionStatus.CANCELLED,
    TransactionStatus.DONE,
  ];

  for (let i = 0; i < 30; i++) {
    const invoiceNumber = generateInvoiceNumber(i + 1);
    const userId = customerIds[i % customerIds.length];
    const eventId = eventIds[i % eventIds.length];
    const status = statuses[i % statuses.length];

    const totalAmount = randomInt(100, 1000) * 1000;
    const discountAmount = randomInt(0, 5) * 10000;
    const pointsUsed = randomInt(0, 5000);
    const finalAmount = Math.max(totalAmount - discountAmount - pointsUsed, 0);

    const paymentDeadline = new Date();
    paymentDeadline.setHours(paymentDeadline.getHours() + 2); // 2-hour deadline

    // Mutual exclusivity: only ONE discount source per transaction
    // (matches transaction.service.ts logic)
    let promoId: string | null = null;
    let cpnId: string | null = null;

    if (i % 4 === 0 && promotionIds.length > 0) {
      promoId = promotionIds[i % promotionIds.length];
    } else if (i % 4 === 1 && couponIds.length > 0) {
      cpnId = couponIds[i % couponIds.length];
    }
    // i % 4 === 2 → points only (no promo/coupon)
    // i % 4 === 3 → no discount at all

    // Set created_at depending on event timing for realistic dashboard data
    const createdAt =
      i < 10
        ? randomDate(new Date("2026-01-01"), new Date("2026-02-15"))
        : randomDate(new Date("2026-02-16"), new Date("2026-02-22"));

    const tx = await prisma.transaction.create({
      data: {
        user_id: userId,
        event_id: eventId,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        points_used: i % 4 === 2 ? pointsUsed : 0,
        final_amount: finalAmount,
        promotion_id: promoId,
        coupon_id: cpnId,
        status,
        payment_proof:
          status === TransactionStatus.DONE ||
            status === TransactionStatus.WAITING_CONFIRMATION
            ? `https://res.cloudinary.com/demo/image/upload/proof-${i + 1}.jpg`
            : null,
        payment_deadline: paymentDeadline,
        created_at: createdAt,
      },
    });
    transactionIds.push(tx.id);
  }

  console.log(`   ✅ ${transactionIds.length} transactions seeded.`);
  return transactionIds;
}

async function seedTransactionItems(
  transactionIds: string[],
  ticketTypeIds: string[],
): Promise<void> {
  console.log("🌱 Seeding Transaction Items...");
  let count = 0;

  for (let i = 0; i < transactionIds.length; i++) {
    const transactionId = transactionIds[i];
    const numItems = randomInt(1, 2);

    for (let j = 0; j < numItems; j++) {
      const ticketTypeId = ticketTypeIds[(i * 2 + j) % ticketTypeIds.length];

      // Get price from the ticket type (mirrors transaction.service.ts)
      const ticketType = await prisma.ticketType.findUnique({
        where: { id: ticketTypeId },
      });
      if (!ticketType) continue;

      const quantity = randomInt(1, 4);
      const priceAtBuy = Number(ticketType.price);
      const subtotal = priceAtBuy * quantity;

      await prisma.transactionItem.create({
        data: {
          transaction_id: transactionId,
          ticket_type_id: ticketTypeId,
          quantity,
          price_at_buy: priceAtBuy,
          subtotal,
        },
      });
      count++;
    }
  }

  console.log(`   ✅ ${count} transaction items seeded.`);
}

async function seedReviews(
  customerIds: string[],
  eventIds: string[],
): Promise<void> {
  console.log("🌱 Seeding Reviews (30)...");
  let count = 0;

  // Only past events (first 10) can have reviews
  // (review.service.ts: user must have attended a finished event)
  const pastEventIds = eventIds.slice(0, 10);

  for (let i = 0; i < 30; i++) {
    const userId = customerIds[i % customerIds.length];
    const eventId = pastEventIds[i % pastEventIds.length];
    const rating = randomInt(3, 5); // Mostly positive (3-5)
    const comment = REVIEW_COMMENTS[i % REVIEW_COMMENTS.length];

    // Upsert with unique constraint [user_id, event_id]
    await prisma.review.upsert({
      where: {
        user_id_event_id: { user_id: userId, event_id: eventId },
      },
      update: {},
      create: {
        user_id: userId,
        event_id: eventId,
        rating,
        comment,
      },
    });
    count++;
  }

  console.log(`   ✅ ${count} reviews seeded.`);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting database seeding...\n");

  // 1. Categories (no FK dependencies)
  const categories = await seedEventCategories();

  // 2. Users — organizers + customers (referral rewards auto-created)
  const { organizerIds, customerIds } = await seedUsers();

  // 3. Events (depends on organizers & categories)
  const eventIds = await seedEvents(organizerIds, categories);

  // 4. Ticket Types (depends on events)
  const ticketTypeIds = await seedTicketTypes(eventIds);

  // 5. Promotions (depends on events)
  const promotionIds = await seedPromotions(eventIds);

  // 6. Coupons (depends on customers)
  const couponIds = await seedCoupons(customerIds);

  // 7. Additional Points (depends on customers; referral points already seeded)
  await seedPoints(customerIds);

  // 8. Transactions (depends on customers, events, promotions, coupons)
  //    Enforces mutual exclusivity of discounts
  const transactionIds = await seedTransactions(
    customerIds,
    eventIds,
    promotionIds,
    couponIds,
  );

  // 9. Transaction Items (depends on transactions & ticket types)
  await seedTransactionItems(transactionIds, ticketTypeIds);

  // 10. Reviews (only on past events, 1 per user/event)
  await seedReviews(customerIds, eventIds);

  console.log("\n✅ Database seeding complete!");
  console.log("   📊 Summary:");
  console.log(`      • ${categories.length} event categories`);
  console.log(`      • ${organizerIds.length} organizers`);
  console.log(`      • ${customerIds.length} customers`);
  console.log(`      • ${eventIds.length} events (10 past + 20 upcoming)`);
  console.log(`      • ${ticketTypeIds.length} ticket types`);
  console.log(`      • ${promotionIds.length} promotions`);
  console.log(`      • ${couponIds.length} coupons`);
  console.log(`      • 30 transactions`);
  console.log(`      • 30 reviews`);
  console.log(`\n   🔐 Login credentials: Password123!`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
