/**
 * HOMEZY – data layer.
 * The prototype has no server: all data lives in the browser's localStorage.
 * Each function below matches a method from the class diagram
 * (register, login, bookService, respondToRequest, submitReview, ...).
 */

const STORAGE_KEY = 'homezy-data-v1';

const Store = {
  data: null,

  /* ---------- setup ---------- */

  async init() {
    try {
      this.data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      this.data = null;
    }
    if (!this.data) {
      await this.reset();
    }
  },

  async reset() {
    const demoHash = await hashPassword('123456');
    const today = new Date();
    const day = (offset) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      return d.toISOString().slice(0, 10);
    };

    this.data = {
      users: DEMO_USERS.map((u) => ({ ...u, passwordHash: demoHash })),
      providers: PROVIDERS.map((p) => ({ ...p, services: p.services.map((s) => ({ ...s })) })),
      reviews: REVIEWS.map((r, i) => ({ id: 'r' + i, ...r, createdAt: day(-30 + i) })),
      bookings: [
        // For the demo provider (p1): one new request and one finished job.
        { id: 'b1', customerId: 'x1', customerName: 'سارة', providerId: 'p1', serviceId: 's1', serviceName: 'إصلاح تسريب',
          date: day(2), time: '10:00', address: 'الخرج – حي النهضة', notes: 'تسريب تحت مغسلة المطبخ',
          price: 180, discount: 0, total: 180, paymentMethod: 'cash', paymentStatus: 'unpaid', status: 'pending', createdAt: day(0) },
        { id: 'b2', customerId: 'x2', customerName: 'محمد', providerId: 'p1', serviceId: 's2', serviceName: 'تركيب سخان',
          date: day(-5), time: '16:00', address: 'الخرج – حي الريان', notes: '',
          price: 250, discount: 0, total: 250, paymentMethod: 'card', paymentStatus: 'paid', status: 'completed', createdAt: day(-7) },
        // For the demo customer (u1): a finished job waiting for a review, and an upcoming one.
        { id: 'b3', customerId: 'u1', customerName: 'عميل تجريبي', providerId: 'p2', serviceId: 's1', serviceName: 'تنظيف شقة',
          date: day(-3), time: '09:00', address: 'الخرج – حي الخالدية', notes: '',
          price: 200, discount: 20, total: 180, discountCode: 'HOMEZY10', paymentMethod: 'card', paymentStatus: 'paid', status: 'completed', createdAt: day(-6) },
        { id: 'b4', customerId: 'u1', customerName: 'عميل تجريبي', providerId: 'p3', serviceId: 's1', serviceName: 'تنظيف مكيف سبليت',
          date: day(4), time: '13:00', address: 'الخرج – حي الخالدية', notes: 'مكيفين في الصالة',
          price: 150, discount: 0, total: 150, paymentMethod: 'cash', paymentStatus: 'unpaid', status: 'accepted', createdAt: day(-1) },
      ],
      notifications: [
        { id: 'n1', userId: 'u2', text: 'طلب حجز جديد من سارة: إصلاح تسريب', read: false, createdAt: Date.now() },
        { id: 'n2', userId: 'u1', text: 'تم قبول حجزك لدى برد وسلامة ✅', read: false, createdAt: Date.now() },
      ],
      sessionUserId: null,
    };
    this.save();
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  },

  /* ---------- users (FR1) ---------- */

  currentUser() {
    return this.data.users.find((u) => u.id === this.data.sessionUserId) || null;
  },

  async register({ name, email, password, phone, role, category }) {
    email = email.trim().toLowerCase();
    if (this.data.users.some((u) => u.email === email)) {
      throw new Error('هذا البريد مسجّل مسبقاً');
    }
    const user = {
      id: uid('u'), name: name.trim(), email, phone: phone.trim(), role,
      passwordHash: await hashPassword(password),
    };

    // A new service provider also gets a public profile.
    if (role === 'provider') {
      const provider = {
        id: uid('p'), name: user.name, category, avatar: '🧑‍💼', city: '',
        hourlyRate: 50, verified: false, newGraduate: false, years: 0,
        bio: 'مقدم خدمة جديد على homezy.', skills: [], services: [],
      };
      this.data.providers.push(provider);
      user.providerId = provider.id;
    }

    this.data.users.push(user);
    this.data.sessionUserId = user.id;
    this.notify(user.id, 'أهلاً بك في homezy! تم إنشاء حسابك بنجاح 🎉');
    this.save();
    return user;
  },

  async login(email, password) {
    const user = this.data.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.passwordHash !== (await hashPassword(password))) {
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    this.data.sessionUserId = user.id;
    this.save();
    return user;
  },

  logout() {
    this.data.sessionUserId = null;
    this.save();
  },

  /* ---------- providers & services (FR2, FR7) ---------- */

  provider(id) {
    return this.data.providers.find((p) => p.id === id) || null;
  },

  /** Average rating + number of reviews, calculated from the reviews table. */
  rating(providerId) {
    const list = this.data.reviews.filter((r) => r.providerId === providerId);
    const avg = list.length ? list.reduce((sum, r) => sum + r.rating, 0) / list.length : 0;
    return { avg, count: list.length };
  },

  reviewsFor(providerId) {
    return this.data.reviews.filter((r) => r.providerId === providerId).reverse();
  },

  searchProviders({ category = '', query = '', sort = 'rating' } = {}) {
    const q = query.trim().toLowerCase();
    let list = this.data.providers.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      const cat = CATEGORIES.find((c) => c.id === p.category);
      const haystack = [p.name, p.bio, cat ? cat.name : '', ...p.skills, ...p.services.map((s) => s.name)]
        .join(' ').toLowerCase();
      return haystack.includes(q);
    });

    const byRating = (a, b) => this.rating(b.id).avg - this.rating(a.id).avg;
    if (sort === 'price') list.sort((a, b) => a.hourlyRate - b.hourlyRate);
    else list.sort(byRating);
    return list;
  },

  topProviders(limit = 4) {
    return this.searchProviders({ sort: 'rating' }).slice(0, limit);
  },

  /** FR10: suggest providers from the categories the customer booked before. */
  recommendations(userId, limit = 3) {
    const mine = this.data.bookings.filter((b) => b.customerId === userId);
    if (!mine.length) return [];
    const usedProviders = new Set(mine.map((b) => b.providerId));
    const likedCategories = new Set(mine.map((b) => (this.provider(b.providerId) || {}).category));
    const related = new Set([...likedCategories].flatMap((c) => RELATED_CATEGORIES[c] || []));

    return this.searchProviders({ sort: 'rating' })
      .filter((p) => !usedProviders.has(p.id) && (likedCategories.has(p.category) || related.has(p.category)))
      .slice(0, limit);
  },

  addService(providerId, name, price) {
    const provider = this.provider(providerId);
    provider.services.push({ id: uid('s'), name: name.trim(), price: Number(price) });
    this.save();
  },

  removeService(providerId, serviceId) {
    const provider = this.provider(providerId);
    provider.services = provider.services.filter((s) => s.id !== serviceId);
    this.save();
  },

  updateProfile(providerId, changes) {
    Object.assign(this.provider(providerId), changes);
    this.save();
  },

  /* ---------- bookings & payment (FR3, FR4, FR8, FR9) ---------- */

  /** Booking.calculateCost() */
  calculateCost(price, code) {
    const discount = DISCOUNT_CODES[(code || '').trim().toUpperCase()];
    const amount = discount ? Math.round(price * discount.percent / 100) : 0;
    return { price, discount: amount, total: price - amount, valid: !!discount, label: discount ? discount.label : '' };
  },

  bookService({ providerId, serviceId, date, time, address, notes, code, paymentMethod }) {
    const user = this.currentUser();
    const provider = this.provider(providerId);
    const service = provider.services.find((s) => s.id === serviceId);
    const cost = this.calculateCost(service.price, code);

    const booking = {
      id: uid('b'), customerId: user.id, customerName: user.name, providerId, serviceId,
      serviceName: service.name, date, time, address: address.trim(), notes: notes.trim(),
      price: cost.price, discount: cost.discount, total: cost.total,
      discountCode: cost.valid ? code.trim().toUpperCase() : '',
      paymentMethod,
      // Free services and card payments (simulated) count as paid immediately.
      paymentStatus: cost.total === 0 || paymentMethod === 'card' ? 'paid' : 'unpaid',
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    this.data.bookings.push(booking);

    this.notify(user.id, `تم إرسال طلب حجزك لدى ${provider.name} (${service.name}) ✅`);
    const providerUser = this.data.users.find((u) => u.providerId === providerId);
    if (providerUser) {
      this.notify(providerUser.id, `طلب حجز جديد من ${user.name}: ${service.name}`);
    }
    this.save();
    return booking;
  },

  bookingsForCustomer(userId) {
    return this.data.bookings.filter((b) => b.customerId === userId).reverse();
  },

  bookingsForProvider(providerId) {
    return this.data.bookings.filter((b) => b.providerId === providerId).reverse();
  },

  /** FR6: ServiceProvider.respondToRequest() + Booking.updateStatus() */
  updateBookingStatus(bookingId, status) {
    const booking = this.data.bookings.find((b) => b.id === bookingId);
    booking.status = status;
    if (status === 'completed') booking.paymentStatus = 'paid';

    const provider = this.provider(booking.providerId);
    const messages = {
      accepted: `تم قبول حجزك لدى ${provider.name} ✅`,
      rejected: `نعتذر، تم رفض حجزك لدى ${provider.name}`,
      completed: `اكتملت خدمة "${booking.serviceName}". قيّم ${provider.name} الآن ⭐`,
    };
    this.notify(booking.customerId, messages[status]);
    this.save();
  },

  earnings(providerId) {
    const done = this.bookingsForProvider(providerId).filter((b) => b.status === 'completed');
    return { total: done.reduce((sum, b) => sum + b.total, 0), jobs: done };
  },

  /* ---------- reviews (FR5) ---------- */

  submitReview(bookingId, rating, comment) {
    const booking = this.data.bookings.find((b) => b.id === bookingId);
    const user = this.currentUser();
    this.data.reviews.push({
      id: uid('r'), providerId: booking.providerId, customer: user.name,
      rating: Number(rating), comment: comment.trim(), createdAt: new Date().toISOString().slice(0, 10),
    });
    booking.reviewed = true;
    this.save();
  },

  /* ---------- notifications (FR8) ---------- */

  notify(userId, text) {
    this.data.notifications.push({ id: uid('n'), userId, text, read: false, createdAt: Date.now() });
  },

  notificationsFor(userId) {
    return this.data.notifications.filter((n) => n.userId === userId).reverse();
  },

  markNotificationsRead(userId) {
    this.data.notifications.forEach((n) => { if (n.userId === userId) n.read = true; });
    this.save();
  },
};

// Categories that go well together, used for recommendations.
const RELATED_CATEGORIES = {
  cleaning: ['ac'], ac: ['electrical', 'cleaning'], plumbing: ['electrical'],
  electrical: ['plumbing', 'ac'], cooking: ['beauty'], beauty: ['cooking'],
  training: [], tech: [],
};

/* ---------- helpers ---------- */

function uid(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** SHA-256 hash, so passwords are never stored as plain text (even in this demo). */
async function hashPassword(password) {
  if (window.crypto && crypto.subtle) {
    const bytes = new TextEncoder().encode('homezy:' + password);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return 'plain:' + password; // very old browsers only
}
