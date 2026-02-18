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

function generateReferralCode(name: string, index: number): string {
  return `${name.replace(/\s/g, "").toUpperCase().slice(0, 6)}${String(index).padStart(3, "0")}`;
}

function generateInvoiceNumber(index: number): string {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
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

const CUSTOMER_NAMES = [
  "Andi Pratama",
  "Siti Nurhaliza",
  "Budi Santoso",
  "Dewi Lestari",
  "Rahmat Hidayat",
  "Putri Ayu",
  "Fajar Setiawan",
  "Rina Marlina",
  "Dimas Arya",
  "Nisa Amelia",
  "Galih Putra",
  "Maya Sari",
  "Hendra Wijaya",
  "Laila Fitri",
  "Taufik Rahman",
  "Citra Dewi",
  "Rizky Maulana",
  "Ayu Wulandari",
  "Bagus Prasetyo",
  "Indah Permata",
];

const ORGANIZER_NAMES = [
  "EventNusantara",
  "KreasiIndonesia",
  "GelarBudaya",
  "SeniPanggung",
  "FestivalKita",
  "AcaraHebat",
  "JelajahEvent",
  "PestaRakyat",
  "KarnavalnIndo",
  "PanggungMeriah",
];

const EVENT_NAMES_BY_CATEGORY: Record<string, string[]> = {
  Musik: ["Rock in Solo", "Jazz Night Jakarta", "Indie Music Fest"],
  Seminar: [
    "Tech Talk Indonesia",
    "Startup Summit 2026",
    "Digital Marketing Seminar",
  ],
  Workshop: [
    "Workshop Fotografi",
    "Kelas Barista Nusantara",
    "Workshop UI/UX Design",
  ],
  Olahraga: [
    "Marathon Bandung",
    "Fun Run Surabaya",
    "Turnamen Badminton Nasional",
  ],
  Pameran: [
    "Pameran Seni Rupa",
    "Expo UMKM Nusantara",
    "Pameran Otomotif 2026",
  ],
  Festival: [
    "Festival Kuliner Jogja",
    "Bali Art Festival",
    "Festival Budaya Makassar",
  ],
  Konferensi: ["DevCon Indonesia", "HR Conference 2026", "FinTech Conference"],
  Webinar: [
    "Webinar AI & Machine Learning",
    "Webinar Kesehatan Mental",
    "Webinar Investasi",
  ],
  Kompetisi: [
    "Hackathon Indonesia",
    "Lomba Debat Nasional",
    "E-Sports Championship",
  ],
  Charity: ["Charity Concert", "Fun Walk for Education", "Gala Dinner Amal"],
};

const TICKET_TYPES = [
  { name: "Regular", priceMultiplier: 1 },
  { name: "VIP", priceMultiplier: 2.5 },
  { name: "VVIP", priceMultiplier: 4 },
  { name: "Early Bird", priceMultiplier: 0.7 },
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

async function seedUsers(): Promise<string[]> {
  console.log("🌱 Seeding Users...");
  const hashedPassword = await bcrypt.hash("Password123!", 10);
  const userIds: string[] = [];

  // Seed Organizers (10)
  for (let i = 0; i < ORGANIZER_NAMES.length; i++) {
    const name = ORGANIZER_NAMES[i];
    const email = `${name.toLowerCase().replace(/\s/g, "")}@eventpro.com`;
    const referralCode = generateReferralCode(name, i + 1);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedPassword,
        full_name: name,
        phone_number: `08${randomInt(1000000000, 9999999999)}`,
        role: UserRole.ORGANIZER,
        referral_code: referralCode,
      },
    });
    userIds.push(user.id);
  }

  // Seed Customers (20)
  for (let i = 0; i < CUSTOMER_NAMES.length; i++) {
    const name = CUSTOMER_NAMES[i];
    const email = `${name.toLowerCase().replace(/\s/g, ".")}@gmail.com`;
    const referralCode = generateReferralCode(name, i + 100);

    // Some customers are referred by earlier customers
    const referredBy =
      i > 5
        ? userIds[
            randomInt(ORGANIZER_NAMES.length, ORGANIZER_NAMES.length + i - 1)
          ]
        : undefined;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: hashedPassword,
        full_name: name,
        phone_number: `08${randomInt(1000000000, 9999999999)}`,
        role: UserRole.CUSTOMER,
        referral_code: referralCode,
        referred_by: referredBy,
      },
    });
    userIds.push(user.id);
  }

  console.log(`   ✅ ${userIds.length} users seeded.`);
  return userIds;
}

async function seedEventCategories(): Promise<string[]> {
  console.log("🌱 Seeding Event Categories...");
  const categoryIds: string[] = [];

  for (const name of EVENT_CATEGORIES) {
    const category = await prisma.eventCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryIds.push(category.id);
  }

  console.log(`   ✅ ${categoryIds.length} event categories seeded.`);
  return categoryIds;
}

async function seedEvents(
  organizerIds: string[],
  categoryIds: string[],
): Promise<string[]> {
  console.log("🌱 Seeding Events...");
  const eventIds: string[] = [];
  let eventIndex = 0;

  for (let catIdx = 0; catIdx < EVENT_CATEGORIES.length; catIdx++) {
    const categoryName = EVENT_CATEGORIES[catIdx];
    const eventNames = EVENT_NAMES_BY_CATEGORY[categoryName];

    for (const eventName of eventNames) {
      const city = CITIES[eventIndex % CITIES.length];
      const totalSeats = randomInt(100, 1000);
      const basePrice =
        categoryName === "Charity" ? 0 : randomInt(50, 500) * 1000;
      const isFree = basePrice === 0;

      const startDate = randomDate(
        new Date("2026-03-01"),
        new Date("2026-12-31"),
      );
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + randomInt(1, 3));

      // Use a unique identifier for upsert — combination of name
      // Since Event doesn't have a unique constraint on name, we search first
      let event = await prisma.event.findFirst({ where: { name: eventName } });

      if (!event) {
        event = await prisma.event.create({
          data: {
            organizer_id: organizerIds[eventIndex % organizerIds.length],
            category_id: categoryIds[catIdx],
            name: eventName,
            description: `${eventName} adalah acara ${categoryName.toLowerCase()} terbesar di ${city}. Bergabunglah bersama ribuan pengunjung untuk menikmati pengalaman luar biasa di ${PROVINCES[city]}. Acara ini menghadirkan berbagai aktivitas menarik dan bintang tamu spesial.`,
            city,
            province: PROVINCES[city],
            start_date: startDate,
            end_date: endDate,
            total_seats: totalSeats,
            available_seats: Math.floor(totalSeats * 0.7), // 70% still available
            base_price: basePrice,
            is_free: isFree,
          },
        });
      }

      eventIds.push(event.id);
      eventIndex++;
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
    const numTicketTypes = randomInt(2, 3);
    const selectedTypes = TICKET_TYPES.slice(0, numTicketTypes);

    for (const tt of selectedTypes) {
      const quantity = Math.floor(event.total_seats / numTicketTypes);
      const price = Number(event.base_price) * tt.priceMultiplier;

      // Check if already exists
      const existing = await prisma.ticketType.findFirst({
        where: { event_id: eventId, name: tt.name },
      });

      if (!existing) {
        const ticketType = await prisma.ticketType.create({
          data: {
            event_id: eventId,
            name: tt.name,
            description: `Tiket ${tt.name} untuk ${event.name}`,
            price,
            quantity,
            available_quantity: Math.floor(quantity * 0.7),
          },
        });
        ticketTypeIds.push(ticketType.id);
      } else {
        ticketTypeIds.push(existing.id);
      }
    }
  }

  console.log(`   ✅ ${ticketTypeIds.length} ticket types seeded.`);
  return ticketTypeIds;
}

async function seedPromotions(eventIds: string[]): Promise<string[]> {
  console.log("🌱 Seeding Promotions...");
  const promotionIds: string[] = [];

  const promoCodes = [
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

  for (let i = 0; i < 30; i++) {
    const eventId = eventIds[i % eventIds.length];
    const code = promoCodes[i];
    const isPercentage = i % 2 === 0;

    const validFrom = new Date("2026-02-01");
    const validUntil = new Date("2026-12-31");

    const existing = await prisma.promotion.findUnique({ where: { code } });
    if (!existing) {
      const promo = await prisma.promotion.create({
        data: {
          event_id: eventId,
          code,
          discount_percentage: isPercentage ? randomInt(5, 30) : null,
          discount_amount: !isPercentage ? randomInt(10, 100) * 1000 : null,
          max_usage: randomInt(50, 200),
          current_usage: randomInt(0, 30),
          valid_from: validFrom,
          valid_until: validUntil,
        },
      });
      promotionIds.push(promo.id);
    } else {
      promotionIds.push(existing.id);
    }
  }

  console.log(`   ✅ ${promotionIds.length} promotions seeded.`);
  return promotionIds;
}

async function seedCoupons(customerIds: string[]): Promise<string[]> {
  console.log("🌱 Seeding Coupons...");
  const couponIds: string[] = [];

  for (let i = 0; i < 30; i++) {
    const userId = customerIds[i % customerIds.length];
    const code = `COUPON-${String(i + 1).padStart(4, "0")}`;
    const isPercentage = i % 2 === 0;

    const validFrom = new Date("2026-02-01");
    const validUntil = new Date("2026-08-31");

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (!existing) {
      const coupon = await prisma.coupon.create({
        data: {
          user_id: userId,
          code,
          discount_percentage: isPercentage ? randomInt(5, 20) : null,
          discount_amount: !isPercentage ? randomInt(5, 50) * 1000 : null,
          valid_from: validFrom,
          valid_until: validUntil,
          is_used: i < 10, // First 10 coupons are marked as used
        },
      });
      couponIds.push(coupon.id);
    } else {
      couponIds.push(existing.id);
    }
  }

  console.log(`   ✅ ${couponIds.length} coupons seeded.`);
  return couponIds;
}

async function seedPoints(customerIds: string[]): Promise<void> {
  console.log("🌱 Seeding Points...");
  let count = 0;

  for (let i = 0; i < 30; i++) {
    const userId = customerIds[i % customerIds.length];
    const amount = randomInt(1000, 10000);
    const remainingAmount = randomInt(0, amount);
    const expiresAt = new Date("2026-05-15");
    expiresAt.setMonth(expiresAt.getMonth() + randomInt(1, 6));

    // Check if this user already has points seeded (avoid excessive duplicates)
    const existingCount = await prisma.point.count({
      where: { user_id: userId },
    });
    if (existingCount < 2) {
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

  console.log(`   ✅ ${count} points seeded.`);
}

async function seedTransactions(
  customerIds: string[],
  eventIds: string[],
  promotionIds: string[],
  couponIds: string[],
): Promise<string[]> {
  console.log("🌱 Seeding Transactions...");
  const transactionIds: string[] = [];

  const statuses: TransactionStatus[] = [
    TransactionStatus.DONE,
    TransactionStatus.DONE,
    TransactionStatus.DONE,
    TransactionStatus.WAITING_PAYMENT,
    TransactionStatus.WAITING_CONFIRMATION,
    TransactionStatus.REJECTED,
    TransactionStatus.EXPIRED,
    TransactionStatus.CANCELLED,
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
    paymentDeadline.setDate(paymentDeadline.getDate() + 1);

    // Optionally link promotion or coupon
    const promoId =
      i % 3 === 0 && promotionIds.length > 0
        ? promotionIds[i % promotionIds.length]
        : null;
    const cpnId =
      i % 5 === 0 && couponIds.length > 0
        ? couponIds[i % couponIds.length]
        : null;

    const existing = await prisma.transaction.findUnique({
      where: { invoice_number: invoiceNumber },
    });
    if (!existing) {
      const transaction = await prisma.transaction.create({
        data: {
          user_id: userId,
          event_id: eventId,
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          discount_amount: discountAmount,
          points_used: pointsUsed,
          final_amount: finalAmount,
          promotion_id: promoId,
          coupon_id: cpnId,
          status,
          payment_proof:
            status === TransactionStatus.DONE
              ? `https://storage.example.com/proofs/proof-${i + 1}.jpg`
              : null,
          payment_deadline: paymentDeadline,
        },
      });
      transactionIds.push(transaction.id);
    } else {
      transactionIds.push(existing.id);
    }
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
      const quantity = randomInt(1, 4);

      // Get the ticket price
      const ticketType = await prisma.ticketType.findUnique({
        where: { id: ticketTypeId },
      });
      if (!ticketType) continue;

      const priceAtBuy = Number(ticketType.price);
      const subtotal = priceAtBuy * quantity;

      // Check existing
      const existing = await prisma.transactionItem.findFirst({
        where: { transaction_id: transactionId, ticket_type_id: ticketTypeId },
      });

      if (!existing) {
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
  }

  console.log(`   ✅ ${count} transaction items seeded.`);
}

async function seedReviews(
  customerIds: string[],
  eventIds: string[],
): Promise<void> {
  console.log("🌱 Seeding Reviews...");
  let count = 0;

  for (let i = 0; i < 30; i++) {
    const userId = customerIds[i % customerIds.length];
    const eventId = eventIds[i % eventIds.length];
    const rating = randomInt(3, 5); // Mostly positive (3-5)
    const comment = REVIEW_COMMENTS[i % REVIEW_COMMENTS.length];

    // Upsert using the unique constraint [user_id, event_id]
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

  // 1. Master tables first (no FK dependencies)
  const categoryIds = await seedEventCategories();

  // 2. Users (no FK to other seeded tables)
  const userIds = await seedUsers();

  // Split users into organizers and customers
  const organizerIds = userIds.slice(0, ORGANIZER_NAMES.length); // First 10
  const customerIds = userIds.slice(ORGANIZER_NAMES.length); // Last 20

  // 3. Events (depends on users & categories)
  const eventIds = await seedEvents(organizerIds, categoryIds);

  // 4. Ticket Types (depends on events)
  const ticketTypeIds = await seedTicketTypes(eventIds);

  // 5. Promotions (depends on events)
  const promotionIds = await seedPromotions(eventIds);

  // 6. Coupons (depends on users/customers)
  const couponIds = await seedCoupons(customerIds);

  // 7. Points (depends on users/customers)
  await seedPoints(customerIds);

  // 8. Transactions (depends on users, events, promotions, coupons)
  const transactionIds = await seedTransactions(
    customerIds,
    eventIds,
    promotionIds,
    couponIds,
  );

  // 9. Transaction Items (depends on transactions, ticket types)
  await seedTransactionItems(transactionIds, ticketTypeIds);

  // 10. Reviews (depends on users, events)
  await seedReviews(customerIds, eventIds);

  console.log("\n✅ Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
