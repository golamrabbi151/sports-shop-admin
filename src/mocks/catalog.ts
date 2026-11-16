import type { Brand, Category, Coupon, Product, ProductReview } from '@/types';

/** Paths of generated illustration images (see scripts/generate-product-images.mjs). */
const img = (art: string, color: string) => [1, 2, 3].map((v) => `/images/products/${art}-${color}-${v}.svg`);

export const CATEGORIES: Category[] = [
  { id: 'c1', slug: 'football', name: 'Football', tagline: 'Balls, boots & training', image: '/images/categories/football.svg', color: '#16A34A', productCount: 0 },
  { id: 'c2', slug: 'cricket', name: 'Cricket', tagline: 'Bats, balls & protection', image: '/images/categories/cricket.svg', color: '#0EA5E9', productCount: 0 },
  { id: 'c3', slug: 'badminton', name: 'Badminton', tagline: 'Rackets & shuttles', image: '/images/categories/badminton.svg', color: '#F59E0B', productCount: 0 },
  { id: 'c4', slug: 'fitness', name: 'Fitness & Gym', tagline: 'Weights, mats & more', image: '/images/categories/fitness.svg', color: '#EF4444', productCount: 0 },
  { id: 'c5', slug: 'running', name: 'Running', tagline: 'Shoes built for speed', image: '/images/categories/running.svg', color: '#8B5CF6', productCount: 0 },
  { id: 'c6', slug: 'jerseys', name: 'Jerseys', tagline: 'Club & country kits', image: '/images/categories/jerseys.svg', color: '#E11D48', productCount: 0 },
  { id: 'c7', slug: 'basketball', name: 'Basketball', tagline: 'Hoop essentials', image: '/images/categories/basketball.svg', color: '#EA580C', productCount: 0 },
  { id: 'c8', slug: 'accessories', name: 'Accessories', tagline: 'Bottles, bags & gear', image: '/images/categories/accessories.svg', color: '#0D9488', productCount: 0 },
];

export const BRANDS: Brand[] = [
  { id: 'b1', slug: 'strikr', name: 'Strikr' },
  { id: 'b2', slug: 'pitch-pro', name: 'Pitch Pro' },
  { id: 'b3', slug: 'smashline', name: 'Smashline' },
  { id: 'b4', slug: 'titan-fit', name: 'Titan Fit' },
  { id: 'b5', slug: 'aerorun', name: 'AeroRun' },
  { id: 'b6', slug: 'bengal-tiger', name: 'Bengal Tiger' },
  { id: 'b7', slug: 'courtking', name: 'CourtKing' },
];

const REVIEWERS = [
  ['Rakib H.', 'Dhaka'], ['Nusrat J.', 'Chattogram'], ['Tanvir A.', 'Sylhet'], ['Farhana R.', 'Rajshahi'],
  ['Sabbir K.', 'Khulna'], ['Mehedi H.', 'Cumilla'], ['Ayesha S.', 'Gazipur'], ['Imran M.', 'Barishal'],
];
const COMMENTS = [
  'Original product, exactly as shown. Delivery was super fast inside Dhaka.',
  'Quality is excellent for the price. Paid with bKash, very smooth.',
  'Got it in 3 days outside Dhaka with cash on delivery. Recommended!',
  'Good build quality. Packaging could be better but the product is great.',
  'Using it for two weeks now, holding up really well. Will buy again.',
  'Size chart was accurate. Customer support helped me pick the right size.',
];

function makeReviews(seed: number, rating: number): ProductReview[] {
  return Array.from({ length: 3 }, (_, i) => {
    const [author, location] = REVIEWERS[(seed + i * 3) % REVIEWERS.length];
    return {
      id: `r${seed}-${i}`,
      author,
      location,
      rating: Math.max(3, Math.min(5, Math.round(rating) - (i === 2 ? 1 : 0))),
      comment: COMMENTS[(seed + i) % COMMENTS.length],
      createdAt: new Date(Date.UTC(2026, 9, 28 - seed - i * 4)).toISOString(),
    };
  });
}

type Seed = Omit<Product, 'id' | 'reviews' | 'createdAt' | 'tags'> & { tags?: string[]; daysAgo?: number };

const SEEDS: Seed[] = [
  // ───────── Football
  {
    slug: 'strikr-pro-match-football', name: 'Strikr Pro Match Football — Size 5', brand: 'Strikr', category: 'football',
    price: 2450, compareAtPrice: 3200, rating: 4.8, reviewCount: 214, stock: 42, images: img('football', 'green'),
    shortDescription: 'FIFA-quality thermo-bonded match ball for turf and grass.',
    description: 'Thermo-bonded 12-panel construction gives true flight and consistent touch in Dhaka heat or monsoon rain. The textured PU surface improves grip, while the butyl bladder holds air for weeks.',
    highlights: ['Thermo-bonded seamless panels', 'Water-resistant PU cover', 'Butyl bladder for air retention', 'Suitable for grass & artificial turf'],
    specs: { Size: '5 (Official)', Weight: '420–445 g', Material: 'PU, butyl bladder', Construction: 'Thermo-bonded', Warranty: '6 months' },
    isFeatured: true, isFlashSale: true, daysAgo: 12,
  },
  {
    slug: 'strikr-street-training-ball', name: 'Strikr Street Training Ball', brand: 'Strikr', category: 'football',
    price: 1150, compareAtPrice: 1450, rating: 4.5, reviewCount: 98, stock: 120, images: img('football', 'orange'),
    shortDescription: 'Machine-stitched durable ball built for concrete and gully games.',
    description: 'A tough machine-stitched trainer with a reinforced outer layer that survives rough concrete pitches, school fields and rooftop games.',
    highlights: ['Extra-durable outer casing', 'Machine stitched', 'High visibility colourway'],
    specs: { Size: '5', Material: 'TPU', Construction: 'Machine stitched', Warranty: '3 months' },
    daysAgo: 40,
  },
  {
    slug: 'bengal-tiger-firm-ground-boots', name: 'Bengal Tiger FG Football Boots', brand: 'Bengal Tiger', category: 'football',
    price: 4290, compareAtPrice: 5490, rating: 4.6, reviewCount: 131, stock: 18, images: img('boot', 'red'),
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: [{ name: 'Crimson', hex: '#DC2626' }, { name: 'Black', hex: '#111827' }],
    shortDescription: 'Lightweight firm-ground boots with conical studs.',
    description: 'Synthetic upper with a sock-like collar for lockdown, and a TPU soleplate with conical studs for quick turns on firm natural grass.',
    highlights: ['Sock-fit collar', 'Conical studs for quick turns', 'Weighs only 210 g'],
    specs: { Surface: 'Firm ground', Upper: 'Synthetic', Soleplate: 'TPU', Weight: '210 g (size 42)' },
    isFeatured: true, isNew: true, daysAgo: 3,
  },
  {
    slug: 'strikr-goalkeeper-gloves', name: 'Strikr Grip+ Goalkeeper Gloves', brand: 'Strikr', category: 'football',
    price: 1650, rating: 4.4, reviewCount: 57, stock: 35, images: img('gloves', 'blue'),
    sizes: ['7', '8', '9', '10'],
    shortDescription: '4 mm German latex palm with finger protection.',
    description: 'Contact latex palm for sticky grip in all weather, plus removable finger spines that protect against hyper-extension.',
    highlights: ['4 mm contact latex', 'Removable finger spines', 'Wrap-around wrist strap'],
    specs: { Palm: '4 mm latex', Cut: 'Hybrid', Closure: 'Velcro strap' },
    daysAgo: 22,
  },
  // ───────── Cricket
  {
    slug: 'pitch-pro-english-willow-bat', name: 'Pitch Pro Grade 1 English Willow Bat', brand: 'Pitch Pro', category: 'cricket',
    price: 16500, compareAtPrice: 19500, rating: 4.9, reviewCount: 76, stock: 7, images: img('bat', 'sky'),
    sizes: ['SH', 'LH'],
    shortDescription: 'Hand-crafted Grade 1 English willow with 8–10 straight grains.',
    description: 'Pressed and knocked-in by hand, this Grade 1 English willow bat has a mid-low sweet spot, thick edges and a cane handle for shock absorption.',
    highlights: ['Grade 1 English willow', 'Pre-knocked & ready to play', 'Mid-low sweet spot', 'Free bat cover & anti-scuff sheet'],
    specs: { Willow: 'English, Grade 1', Grains: '8–10', Weight: '1160–1200 g', Handle: 'Singapore cane', 'Sweet spot': 'Mid-low' },
    isFeatured: true, daysAgo: 15,
  },
  {
    slug: 'pitch-pro-kashmir-willow-bat', name: 'Pitch Pro Kashmir Willow Bat', brand: 'Pitch Pro', category: 'cricket',
    price: 4650, compareAtPrice: 5600, rating: 4.5, reviewCount: 189, stock: 25, images: img('bat', 'yellow'),
    sizes: ['Size 5', 'Size 6', 'SH'],
    shortDescription: 'Great value Kashmir willow bat for club & academy players.',
    description: 'Ideal for leather-ball practice and club matches. Toe guard included, with a full-size cover.',
    highlights: ['Kashmir willow', 'Toe guard fitted', 'Full cover included'],
    specs: { Willow: 'Kashmir', Weight: '1200–1250 g', Handle: 'Cane' },
    isFlashSale: true, daysAgo: 60,
  },
  {
    slug: 'pitch-pro-leather-match-ball', name: 'Pitch Pro Test Leather Ball (Red)', brand: 'Pitch Pro', category: 'cricket',
    price: 1350, rating: 4.6, reviewCount: 112, stock: 80, images: img('cricketball', 'red'),
    shortDescription: '4-piece alum-tanned leather ball, hand stitched.',
    description: 'A four-piece hand-stitched leather ball that holds its shine and seam for long spells. Suitable for club and division matches.',
    highlights: ['4-piece construction', 'Hand stitched seam', 'Holds shine longer'],
    specs: { Weight: '156 g', Material: 'Alum-tanned leather', Construction: '4-piece' },
    daysAgo: 30,
  },
  {
    slug: 'bengal-tiger-tape-tennis-ball-6', name: 'Bengal Tiger Tape Tennis Ball (Pack of 6)', brand: 'Bengal Tiger', category: 'cricket',
    price: 480, compareAtPrice: 600, rating: 4.3, reviewCount: 341, stock: 300, images: img('tennisball', 'lime'),
    shortDescription: 'Heavy tennis balls perfect for tape-ball street cricket.',
    description: 'The street-cricket classic. Heavier felt and a stronger core so tape stays on and bounce stays true.',
    highlights: ['Pack of 6', 'Heavy felt', 'Perfect for tape cricket'],
    specs: { Quantity: '6 balls', Type: 'Heavy tennis' },
    isFlashSale: true, daysAgo: 80,
  },
  {
    slug: 'pitch-pro-batting-helmet', name: 'Pitch Pro Titanium Grille Helmet', brand: 'Pitch Pro', category: 'cricket',
    price: 5800, compareAtPrice: 6900, rating: 4.7, reviewCount: 44, stock: 12, images: img('helmet', 'navy'),
    sizes: ['S', 'M', 'L'],
    shortDescription: 'Lightweight shell with a titanium grille and neck guard mount.',
    description: 'High-impact ABS shell, titanium face guard and breathable liner. Meets the latest safety standard.',
    highlights: ['Titanium grille', 'Adjustable fit', 'Neck guard compatible'],
    specs: { Shell: 'ABS', Grille: 'Titanium', Weight: '780 g' },
    isNew: true, daysAgo: 5,
  },
  // ───────── Badminton
  {
    slug: 'smashline-carbon-x9-racket', name: 'Smashline Carbon X9 Racket', brand: 'Smashline', category: 'badminton',
    price: 6900, compareAtPrice: 8500, rating: 4.8, reviewCount: 167, stock: 22, images: img('racket', 'orange'),
    colors: [{ name: 'Sunset', hex: '#F97316' }, { name: 'Midnight', hex: '#1E293B' }],
    shortDescription: 'Head-heavy full-carbon racket for powerful smashes.',
    description: 'High-modulus graphite frame with an isometric head for a bigger sweet spot. Head-heavy balance helps generate steep, powerful smashes.',
    highlights: ['High-modulus graphite', 'Head-heavy balance', 'Up to 30 lbs tension', 'Full cover included'],
    specs: { Weight: '4U (83 g)', Balance: 'Head heavy', Flex: 'Stiff', 'Max tension': '30 lbs' },
    isFeatured: true, daysAgo: 9,
  },
  {
    slug: 'smashline-feather-shuttle-12', name: 'Smashline Feather Shuttlecock (Tube of 12)', brand: 'Smashline', category: 'badminton',
    price: 1450, rating: 4.6, reviewCount: 233, stock: 150, images: img('shuttle', 'white'),
    shortDescription: 'Tournament-grade goose feather shuttles with cork base.',
    description: 'Consistent flight with natural cork heads and selected goose feathers. Speed 77 — ideal for winter play in Bangladesh.',
    highlights: ['Goose feather', 'Natural cork', 'Speed 77'],
    specs: { Quantity: '12', Speed: '77', Feather: 'Goose' },
    isFlashSale: true, daysAgo: 20,
  },
  {
    slug: 'smashline-starter-racket-pair', name: 'Smashline Starter Racket Pair', brand: 'Smashline', category: 'badminton',
    price: 1890, compareAtPrice: 2400, rating: 4.2, reviewCount: 88, stock: 60, images: img('racket', 'teal'),
    shortDescription: 'Two aluminium rackets + 3 shuttles. Perfect for beginners.',
    description: 'A complete set for evening games in the lane: two lightweight aluminium rackets, three nylon shuttles and a carry bag.',
    highlights: ['2 rackets + 3 shuttles', 'Carry bag included', 'Pre-strung'],
    specs: { Frame: 'Aluminium', Includes: '2 rackets, 3 shuttles, bag' },
    daysAgo: 45,
  },
  // ───────── Fitness
  {
    slug: 'titan-fit-adjustable-dumbbell-20kg', name: 'Titan Fit Adjustable Dumbbell Set (20 kg)', brand: 'Titan Fit', category: 'fitness',
    price: 5400, compareAtPrice: 6800, rating: 4.7, reviewCount: 152, stock: 16, images: img('dumbbell', 'black'),
    shortDescription: 'Cast-iron plates with rubber coating and spin-lock collars.',
    description: 'Build a home gym with two chrome handles and rubber-coated plates totalling 20 kg. Spin-lock collars keep plates secure.',
    highlights: ['20 kg total', 'Rubber-coated plates', 'Anti-slip knurled handles', 'Storage case included'],
    specs: { 'Total weight': '20 kg', Plates: '8 × 1.25 kg, 4 × 2.5 kg', Handle: '35 cm chrome' },
    isFeatured: true, daysAgo: 18,
  },
  {
    slug: 'titan-fit-kettlebell-12kg', name: 'Titan Fit Vinyl Kettlebell — 12 kg', brand: 'Titan Fit', category: 'fitness',
    price: 2650, rating: 4.5, reviewCount: 64, stock: 30, images: img('kettlebell', 'red'),
    shortDescription: 'Vinyl-coated kettlebell, floor-friendly.',
    description: 'Concrete-filled vinyl kettlebell with a wide handle for swings, goblet squats and Turkish get-ups.',
    highlights: ['Floor-friendly vinyl', 'Wide grip handle', 'Flat base'],
    specs: { Weight: '12 kg', Coating: 'Vinyl' },
    isNew: true, daysAgo: 2,
  },
  {
    slug: 'titan-fit-yoga-mat-8mm', name: 'Titan Fit Yoga Mat 8 mm', brand: 'Titan Fit', category: 'fitness',
    price: 1290, compareAtPrice: 1690, rating: 4.4, reviewCount: 275, stock: 90, images: img('mat', 'purple'),
    colors: [{ name: 'Lavender', hex: '#8B5CF6' }, { name: 'Teal', hex: '#14B8A6' }],
    shortDescription: 'Extra-thick NBR mat with carry strap.',
    description: 'Cushioned 8 mm NBR foam protects knees and joints. Textured surface for grip, with a free carry strap.',
    highlights: ['8 mm thick', 'Non-slip texture', 'Carry strap included'],
    specs: { Size: '183 × 61 cm', Thickness: '8 mm', Material: 'NBR' },
    isFlashSale: true, daysAgo: 35,
  },
  {
    slug: 'titan-fit-speed-rope', name: 'Titan Fit Ball-Bearing Speed Rope', brand: 'Titan Fit', category: 'fitness',
    price: 650, rating: 4.3, reviewCount: 120, stock: 200, images: img('rope', 'teal'),
    shortDescription: 'Adjustable steel cable rope for double-unders.',
    description: 'Smooth ball-bearing handles and an adjustable coated steel cable for fast rotations.',
    highlights: ['Ball-bearing handles', 'Adjustable length', 'Spare cable included'],
    specs: { Length: 'Up to 3 m', Cable: 'PVC coated steel' },
    daysAgo: 70,
  },
  // ───────── Running
  {
    slug: 'aerorun-velocity-running-shoes', name: 'AeroRun Velocity Running Shoes', brand: 'AeroRun', category: 'running',
    price: 6490, compareAtPrice: 7990, rating: 4.7, reviewCount: 198, stock: 26, images: img('shoe', 'purple'),
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    colors: [{ name: 'Violet', hex: '#7C3AED' }, { name: 'White', hex: '#F8FAFC' }],
    shortDescription: 'Responsive foam and breathable mesh for daily miles.',
    description: 'A neutral daily trainer with responsive foam, a breathable engineered-mesh upper and a durable rubber outsole for city roads.',
    highlights: ['Responsive foam midsole', 'Engineered mesh upper', '8 mm drop', 'Reflective details'],
    specs: { Drop: '8 mm', Weight: '255 g (size 42)', Support: 'Neutral', Upper: 'Engineered mesh' },
    isFeatured: true, isNew: true, daysAgo: 1,
  },
  {
    slug: 'aerorun-trail-grip-shoes', name: 'AeroRun TrailGrip Shoes', brand: 'AeroRun', category: 'running',
    price: 7200, rating: 4.6, reviewCount: 73, stock: 14, images: img('shoe', 'green'),
    sizes: ['40', '41', '42', '43', '44'],
    shortDescription: 'Lugged outsole for muddy trails and hill runs.',
    description: 'Built for Sylhet tea-garden trails and Bandarban hills: 5 mm lugs, rock plate and a water-shedding upper.',
    highlights: ['5 mm lugs', 'Rock plate', 'Water-shedding upper'],
    specs: { Drop: '6 mm', Lugs: '5 mm', Weight: '290 g' },
    daysAgo: 25,
  },
  {
    slug: 'aerorun-everyday-walker', name: 'AeroRun Everyday Walker', brand: 'AeroRun', category: 'running',
    price: 3490, compareAtPrice: 4290, rating: 4.4, reviewCount: 156, stock: 48, images: img('shoe', 'black'),
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    shortDescription: 'Lightweight comfort shoe for walking and gym.',
    description: 'Soft knit upper and cushioned sole for all-day comfort — from your morning walk at Ramna Park to the gym.',
    highlights: ['Slip-on knit upper', 'Cushioned sole', 'Machine washable'],
    specs: { Weight: '220 g', Upper: 'Knit' },
    isFlashSale: true, daysAgo: 50,
  },
  // ───────── Jerseys
  {
    slug: 'bengal-tiger-home-jersey-2026', name: 'Bengal Tiger Home Cricket Jersey 2026', brand: 'Bengal Tiger', category: 'jerseys',
    price: 1150, compareAtPrice: 1500, rating: 4.8, reviewCount: 412, stock: 210, images: img('jersey', 'green'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    shortDescription: 'Fan edition jersey in breathable quick-dry fabric.',
    description: 'Show your support with the 2026 home kit. Quick-dry micro-mesh fabric keeps you cool in the stands or on the field.',
    highlights: ['Quick-dry micro mesh', 'Sublimated print — no fading', 'Regular fit'],
    specs: { Fabric: '100% polyester micro mesh', Fit: 'Regular', Care: 'Machine wash cold' },
    isFeatured: true, daysAgo: 6,
  },
  {
    slug: 'bengal-tiger-away-jersey-2026', name: 'Bengal Tiger Away Jersey 2026', brand: 'Bengal Tiger', category: 'jerseys',
    price: 1150, rating: 4.6, reviewCount: 188, stock: 140, images: img('jersey', 'red'),
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    shortDescription: 'Bold red away kit with tiger-stripe texture.',
    description: 'A bold away kit with a subtle tiger-stripe jacquard. Lightweight and breathable.',
    highlights: ['Jacquard texture', 'Breathable', 'Regular fit'],
    specs: { Fabric: '100% polyester', Fit: 'Regular' },
    isNew: true, daysAgo: 4,
  },
  {
    slug: 'strikr-club-training-jersey', name: 'Strikr Club Training Jersey', brand: 'Strikr', category: 'jerseys',
    price: 690, compareAtPrice: 890, rating: 4.3, reviewCount: 96, stock: 175, images: img('jersey', 'blue'),
    sizes: ['S', 'M', 'L', 'XL'],
    shortDescription: 'Lightweight training tee for football practice.',
    description: 'A breathable training top for practice sessions. Custom name & number printing available on request.',
    highlights: ['Lightweight', 'Custom printing available', 'Slim fit'],
    specs: { Fabric: 'Polyester', Fit: 'Slim' },
    isFlashSale: true, daysAgo: 28,
  },
  // ───────── Basketball
  {
    slug: 'courtking-indoor-outdoor-basketball', name: 'CourtKing Indoor/Outdoor Basketball', brand: 'CourtKing', category: 'basketball',
    price: 2190, compareAtPrice: 2690, rating: 4.6, reviewCount: 81, stock: 40, images: img('basketball', 'orange'),
    shortDescription: 'Composite leather ball with deep channels for control.',
    description: 'A composite cover that works on indoor wood and outdoor concrete, with deep channels for better handling.',
    highlights: ['Composite leather', 'Deep channel design', 'Indoor & outdoor'],
    specs: { Size: '7', Cover: 'Composite' },
    isFeatured: true, daysAgo: 14,
  },
  {
    slug: 'courtking-high-top-shoes', name: 'CourtKing Elevate High-Top Shoes', brand: 'CourtKing', category: 'basketball',
    price: 8900, compareAtPrice: 10500, rating: 4.7, reviewCount: 39, stock: 9, images: img('shoe', 'orange'),
    sizes: ['41', '42', '43', '44', '45'],
    shortDescription: 'Ankle support and cushioning for explosive jumps.',
    description: 'High-top collar for ankle support, full-length cushioning and herringbone traction for sharp cuts.',
    highlights: ['High-top support', 'Herringbone traction', 'Full-length cushioning'],
    specs: { Cut: 'High', Traction: 'Herringbone' },
    isNew: true, daysAgo: 7,
  },
  // ───────── Accessories
  {
    slug: 'khela-insulated-bottle-1l', name: 'Insulated Sports Bottle 1 L', brand: 'Titan Fit', category: 'accessories',
    price: 890, compareAtPrice: 1100, rating: 4.6, reviewCount: 302, stock: 160, images: img('bottle', 'teal'),
    colors: [{ name: 'Teal', hex: '#14B8A6' }, { name: 'Black', hex: '#111827' }, { name: 'Coral', hex: '#FB7185' }],
    shortDescription: 'Keeps water cold for 24 hours. BPA free.',
    description: 'Double-wall vacuum insulation keeps water ice-cold through a full day of training in Bangladesh summer.',
    highlights: ['24 h cold / 12 h hot', 'Leak-proof lid', 'BPA free'],
    specs: { Capacity: '1 L', Material: '18/8 stainless steel' },
    isFlashSale: true, daysAgo: 33,
  },
  {
    slug: 'strikr-kit-backpack', name: 'Strikr Kit Backpack 30 L', brand: 'Strikr', category: 'accessories',
    price: 2350, rating: 4.5, reviewCount: 74, stock: 38, images: img('backpack', 'navy'),
    shortDescription: 'Separate boot compartment and laptop sleeve.',
    description: 'Water-resistant 30 L backpack with a ventilated boot compartment, padded laptop sleeve and side bottle pockets.',
    highlights: ['Ventilated boot pocket', '15.6" laptop sleeve', 'Water resistant'],
    specs: { Capacity: '30 L', Material: '600D polyester' },
    daysAgo: 21,
  },
  {
    slug: 'smashline-overgrip-pack', name: 'Smashline Overgrip (Pack of 3)', brand: 'Smashline', category: 'accessories',
    price: 390, rating: 4.4, reviewCount: 210, stock: 400, images: img('grip', 'yellow'),
    shortDescription: 'Tacky, sweat-absorbent overgrips for rackets and bats.',
    description: 'Thin, tacky overgrips that absorb sweat — works on badminton and tennis rackets and cricket bat handles.',
    highlights: ['Pack of 3', 'Sweat absorbent', 'Fits rackets & bats'],
    specs: { Quantity: '3', Thickness: '0.6 mm' },
    daysAgo: 90,
  },
];

const NOW = Date.UTC(2026, 10, 15);

export const PRODUCTS: Product[] = SEEDS.map(({ daysAgo = 10, tags, ...p }, i) => ({
  ...p,
  id: `p${i + 1}`,
  tags: tags ?? [p.category, p.brand.toLowerCase()],
  reviews: makeReviews(i + 1, p.rating),
  createdAt: new Date(NOW - daysAgo * 86_400_000).toISOString(),
}));

for (const c of CATEGORIES) c.productCount = PRODUCTS.filter((p) => p.category === c.slug).length;

export const COUPONS: Coupon[] = [
  { code: 'KHELA10', type: 'percent', value: 10, minOrder: 2000, description: '10% off on orders over ৳2,000' },
  { code: 'WELCOME200', type: 'flat', value: 200, minOrder: 1500, description: '৳200 off your first order' },
  { code: 'FREESHIP', type: 'free_shipping', value: 0, minOrder: 1000, description: 'Free delivery on orders over ৳1,000' },
];
