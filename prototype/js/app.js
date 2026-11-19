/**
 * HOMEZY – screens and navigation.
 * A small single-page app: the part after "#" in the URL decides which screen is shown.
 */

const app = document.getElementById('app');

/* ================= helpers ================= */

/** Escape text before inserting it into HTML (prevents XSS from user input). */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

const money = (n) => (n === 0 ? 'مجاناً' : `${n} ريال`);
const stars = (avg) => '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
const categoryOf = (id) => CATEGORIES.find((c) => c.id === id) || { name: id, icon: '🏠' };

function toast(message, type = 'success') {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('hide'), 2600);
  setTimeout(() => el.remove(), 3000);
}

function go(hash) {
  location.hash = hash;
}

function requireLogin(role) {
  const user = Store.currentUser();
  if (!user) {
    sessionStorage.setItem('homezy-after-login', location.hash);
    toast('سجّل دخولك أولاً', 'error');
    go('#/login');
    return null;
  }
  if (role && user.role !== role) {
    go('#/');
    return null;
  }
  return user;
}

/* ================= shared pieces ================= */

function renderHeader() {
  const user = Store.currentUser();
  const unread = user ? Store.notificationsFor(user.id).filter((n) => !n.read).length : 0;

  document.getElementById('header').innerHTML = `
    <a href="#/" class="logo"><span class="logo-icon">🏠</span>homezy</a>
    <nav class="header-actions">
      ${user ? `
        ${user.role === 'provider'
          ? '<a href="#/dashboard" class="link-btn">لوحة التحكم</a>'
          : '<a href="#/bookings" class="link-btn">حجوزاتي</a>'}
        <a href="#/notifications" class="icon-btn" aria-label="الإشعارات">🔔${unread ? `<span class="badge">${unread}</span>` : ''}</a>
        <span class="user-chip">👤 ${esc(user.name)}</span>
        <button class="btn btn-outline btn-sm" data-action="logout">خروج</button>
      ` : `
        <a href="#/login" class="btn btn-sm">تسجيل الدخول</a>
        <a href="#/register" class="btn btn-outline btn-sm">إنشاء حساب</a>
      `}
    </nav>`;
}

function providerCard(p) {
  const { avg, count } = Store.rating(p.id);
  const cat = categoryOf(p.category);
  return `
    <a class="card provider-card" href="#/provider/${p.id}">
      <div class="avatar">${p.avatar}</div>
      <div class="provider-body">
        <h3>${esc(p.name)} ${p.verified ? '<span class="verified" title="موثّق">✔</span>' : ''}</h3>
        <div class="muted">${cat.icon} ${esc(cat.name)}${p.city ? ' · ' + esc(p.city) : ''}</div>
        <div class="rating"><span class="stars">${stars(avg)}</span> ${avg ? avg.toFixed(1) : 'جديد'} <span class="muted">(${count})</span></div>
        <div class="provider-foot">
          <span class="price">${p.hourlyRate} ريال / ساعة</span>
          ${p.newGraduate ? '<span class="tag tag-grad">🎓 خريج جديد</span>' : ''}
        </div>
      </div>
    </a>`;
}

function statusBadge(status) {
  const s = BOOKING_STATUS[status];
  return `<span class="status ${s.cls}">${s.label}</span>`;
}

/* ================= screens ================= */

const routes = {
  // Home: search, categories, top providers, recommendations (FR2, FR10)
  '': () => {
    const user = Store.currentUser();
    const recs = user && user.role === 'customer' ? Store.recommendations(user.id) : [];
    return `
      <section class="hero">
        <h1>كل خدمات بيتك في مكان واحد</h1>
        <p>مقدمو خدمة موثوقون، تقييمات حقيقية من العملاء، وحجز بخطوات بسيطة.</p>
        <form class="search-bar" data-form="search">
          <input name="q" type="search" placeholder="🔍 ابحث عن الخدمة التي تحتاجها... (سباكة، تنظيف، مكيف)" aria-label="بحث">
          <button class="btn">بحث</button>
        </form>
      </section>

      <section class="panel">
        <h2>التصنيفات</h2>
        <div class="categories">
          ${CATEGORIES.map((c) => `
            <a class="category" href="#/category/${c.id}">
              <span class="category-icon">${c.icon}</span>
              <strong>${c.name}</strong>
              <small>${c.desc}</small>
            </a>`).join('')}
        </div>
      </section>

      ${recs.length ? `
        <section class="panel">
          <h2>✨ مقترحة لك</h2>
          <p class="muted">بناءً على حجوزاتك السابقة</p>
          <div class="grid">${recs.map(providerCard).join('')}</div>
        </section>` : ''}

      <section class="panel">
        <h2>⭐ الأعلى تقييماً</h2>
        <div class="grid">${Store.topProviders().map(providerCard).join('')}</div>
      </section>

      <section class="panel panel-grad">
        <h2>🎓 خريج جديد أو تبحث عن دخل إضافي؟</h2>
        <p>سجّل كمقدم خدمة وابدأ ببناء خبرتك من مهام بسيطة: برمجة، تنسيق ملفات، حسابات مشاريع، وغيرها.</p>
        <a href="#/register?role=provider" class="btn btn-light">انضم كمقدم خدمة</a>
      </section>`;
  },

  // Provider list for a category or a search (FR2)
  'category': (id) => listScreen({ category: id }),
  'search': (_, params) => listScreen({ query: params.get('q') || '' }),

  // Provider profile: bio, services, reviews
  'provider': (id) => {
    const p = Store.provider(id);
    if (!p) return notFound();
    const { avg, count } = Store.rating(p.id);
    const cat = categoryOf(p.category);
    const reviews = Store.reviewsFor(p.id);

    return `
      <a href="#/category/${p.category}" class="back">→ ${cat.name}</a>
      <section class="panel profile">
        <div class="profile-head">
          <div class="avatar avatar-lg">${p.avatar}</div>
          <div>
            <h1>${esc(p.name)} ${p.verified ? '<span class="verified">✔ موثّق</span>' : ''}</h1>
            <div class="muted">${cat.icon} ${cat.name}${p.city ? ' · ' + esc(p.city) : ''}${p.years ? ` · خبرة ${p.years} سنوات` : ''}</div>
            <div class="rating rating-lg"><span class="stars">${stars(avg)}</span> ${avg ? avg.toFixed(1) : 'جديد'} <span class="muted">(${count} تقييم)</span></div>
            ${p.newGraduate ? '<span class="tag tag-grad">🎓 خريج جديد يبني خبرته</span>' : ''}
          </div>
          <div class="rate-box"><strong>${p.hourlyRate}</strong> ريال / ساعة</div>
        </div>
        <p class="bio">${esc(p.bio)}</p>
        ${p.skills.length ? `<div class="tags">${p.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>` : ''}
      </section>

      <section class="panel">
        <h2>الخدمات</h2>
        ${p.services.length ? `
          <div class="service-list">
            ${p.services.map((s) => `
              <div class="service-row">
                <div><strong>${esc(s.name)}</strong></div>
                <div class="service-price">${money(s.price)}</div>
                <a class="btn btn-sm" href="#/book/${p.id}/${s.id}">احجز الآن</a>
              </div>`).join('')}
          </div>` : '<p class="muted">لا توجد خدمات بعد.</p>'}
      </section>

      <section class="panel">
        <h2>آراء العملاء (${count})</h2>
        ${reviews.length ? reviews.map((r) => `
          <div class="review">
            <div><strong>${esc(r.customer)}</strong> <span class="stars">${stars(r.rating)}</span></div>
            ${r.comment ? `<p>${esc(r.comment)}</p>` : ''}
          </div>`).join('') : '<p class="muted">لا توجد تقييمات بعد.</p>'}
      </section>`;
  },

  // Booking form + payment (FR3, FR4, FR9)
  'book': (providerId, params, serviceId) => {
    const user = requireLogin('customer');
    if (!user) return '';
    const p = Store.provider(providerId);
    const s = p && p.services.find((x) => x.id === serviceId);
    if (!s) return notFound();
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    return `
      <a href="#/provider/${p.id}" class="back">→ ${esc(p.name)}</a>
      <section class="panel booking">
        <h1>حجز خدمة</h1>
        <div class="booking-summary">
          <div class="avatar">${p.avatar}</div>
          <div><strong>${esc(s.name)}</strong><div class="muted">${esc(p.name)}</div></div>
        </div>

        <form data-form="book" data-provider="${p.id}" data-service="${s.id}" class="form">
          <div class="form-row">
            <label>التاريخ <input type="date" name="date" min="${tomorrow}" value="${tomorrow}" required></label>
            <label>الوقت
              <select name="time" required>
                ${['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((t) => `<option>${t}</option>`).join('')}
              </select>
            </label>
          </div>
          <label>العنوان <input name="address" value="${esc(user.address || '')}" placeholder="المدينة – الحي – الشارع" required></label>
          <label>ملاحظات خاصة <textarea name="notes" rows="3" placeholder="مثال: التسريب تحت مغسلة المطبخ"></textarea></label>

          ${s.price > 0 ? `
            <label>كود الخصم
              <div class="inline">
                <input name="code" placeholder="مثال: HOMEZY10">
                <button type="button" class="btn btn-outline btn-sm" data-action="apply-code">تطبيق</button>
              </div>
            </label>
            <fieldset class="payment">
              <legend>طريقة الدفع</legend>
              <label class="radio"><input type="radio" name="paymentMethod" value="card" checked> 💳 بطاقة (دفع إلكتروني – محاكاة)</label>
              <label class="radio"><input type="radio" name="paymentMethod" value="cash"> 💵 الدفع عند الإنجاز</label>
            </fieldset>` : '<input type="hidden" name="paymentMethod" value="cash">'}

          <div class="cost" id="cost">${costBox(Store.calculateCost(s.price, ''))}</div>
          <button class="btn btn-block">تأكيد الحجز</button>
          <p class="muted small center">هذا نموذج أولي: لا يتم أي دفع حقيقي.</p>
        </form>
      </section>`;
  },

  // Customer bookings + rating after completion (FR5)
  'bookings': () => {
    const user = requireLogin('customer');
    if (!user) return '';
    const list = Store.bookingsForCustomer(user.id);
    return `
      <section class="panel">
        <h1>📅 حجوزاتي</h1>
        ${list.length ? list.map((b) => {
          const p = Store.provider(b.providerId) || { name: '—', avatar: '🏠' };
          return `
            <div class="booking-card">
              <div class="booking-card-head">
                <div class="avatar">${p.avatar}</div>
                <div class="grow">
                  <strong>${esc(b.serviceName)}</strong>
                  <div class="muted">${esc(p.name)} · ${b.date} · ${b.time}</div>
                </div>
                ${statusBadge(b.status)}
              </div>
              <div class="booking-meta">
                <span>💰 ${money(b.total)}${b.discount ? ` <small class="muted">(خصم ${b.discount} ريال)</small>` : ''}</span>
                <span>${b.paymentStatus === 'paid' ? '✅ مدفوع' : '⏳ الدفع عند الإنجاز'}</span>
                <span>📍 ${esc(b.address)}</span>
              </div>
              ${b.status === 'completed' && !b.reviewed ? `
                <form class="review-form" data-form="review" data-booking="${b.id}">
                  <strong>قيّم الخدمة:</strong>
                  <div class="star-input">
                    ${[5, 4, 3, 2, 1].map((n) => `<input type="radio" id="r-${b.id}-${n}" name="rating" value="${n}" required><label for="r-${b.id}-${n}" title="${n}">★</label>`).join('')}
                  </div>
                  <input name="comment" placeholder="اكتب رأيك (اختياري)">
                  <button class="btn btn-sm">إرسال التقييم</button>
                </form>` : ''}
              ${b.reviewed ? '<div class="muted small">✔ شكراً، تم إرسال تقييمك</div>' : ''}
            </div>`;
        }).join('') : `
          <div class="empty">
            <div class="empty-icon">📭</div>
            <p>لا توجد حجوزات بعد.</p>
            <a href="#/" class="btn">تصفح الخدمات</a>
          </div>`}
      </section>`;
  },

  // Service provider dashboard (FR6, FR7)
  'dashboard': (tab = 'requests') => {
    const user = requireLogin('provider');
    if (!user) return '';
    const p = Store.provider(user.providerId);
    const bookings = Store.bookingsForProvider(p.id);
    const pending = bookings.filter((b) => b.status === 'pending');
    const tabs = { requests: `طلبات الحجز${pending.length ? ` (${pending.length})` : ''}`, services: 'خدماتي', earnings: 'الأرباح', profile: 'الملف الشخصي' };

    return `
      <section class="panel">
        <h1>لوحة تحكم مقدم الخدمة</h1>
        <p class="muted">${p.avatar} ${esc(p.name)} · <a href="#/provider/${p.id}">عرض ملفي العام</a></p>
        <div class="tabs">
          ${Object.entries(tabs).map(([key, label]) => `<a href="#/dashboard/${key}" class="tab ${key === tab ? 'active' : ''}">${label}</a>`).join('')}
        </div>
        <div class="tab-body">${(dashboardTabs[tab] || dashboardTabs.requests)(p, bookings)}</div>
      </section>`;
  },

  'notifications': () => {
    const user = requireLogin();
    if (!user) return '';
    const list = Store.notificationsFor(user.id);
    setTimeout(() => { Store.markNotificationsRead(user.id); renderHeader(); }, 800);
    return `
      <section class="panel">
        <h1>🔔 الإشعارات</h1>
        ${list.length ? list.map((n) => `<div class="notification ${n.read ? '' : 'unread'}">${esc(n.text)}</div>`).join('')
          : '<p class="muted">لا توجد إشعارات.</p>'}
      </section>`;
  },

  'login': () => authScreen('login'),
  'register': (_, params) => authScreen('register', params.get('role')),
};

const dashboardTabs = {
  requests(p, bookings) {
    if (!bookings.length) return '<p class="muted">لا توجد طلبات بعد.</p>';
    return bookings.map((b) => `
      <div class="booking-card">
        <div class="booking-card-head">
          <div class="grow">
            <strong>${esc(b.serviceName)}</strong> — ${esc(b.customerName)}
            <div class="muted">${b.date} · ${b.time} · 📍 ${esc(b.address)}</div>
            ${b.notes ? `<div class="small">📝 ${esc(b.notes)}</div>` : ''}
          </div>
          ${statusBadge(b.status)}
        </div>
        <div class="booking-meta">
          <span>💰 ${money(b.total)}</span>
          <span>${b.paymentMethod === 'card' ? '💳 بطاقة' : '💵 عند الإنجاز'}</span>
        </div>
        <div class="actions">
          ${b.status === 'pending' ? `
            <button class="btn btn-sm btn-green" data-action="status" data-id="${b.id}" data-status="accepted">قبول</button>
            <button class="btn btn-sm btn-red" data-action="status" data-id="${b.id}" data-status="rejected">رفض</button>` : ''}
          ${b.status === 'accepted' ? `
            <button class="btn btn-sm" data-action="status" data-id="${b.id}" data-status="completed">تم إنجاز الخدمة</button>` : ''}
        </div>
      </div>`).join('');
  },

  services(p) {
    return `
      ${p.services.length ? `<div class="service-list">${p.services.map((s) => `
        <div class="service-row">
          <strong>${esc(s.name)}</strong>
          <span class="service-price">${money(s.price)}</span>
          <button class="btn btn-sm btn-red" data-action="remove-service" data-id="${s.id}">حذف</button>
        </div>`).join('')}</div>` : '<p class="muted">لم تضف أي خدمة بعد.</p>'}
      <form class="form form-inline" data-form="add-service">
        <h3>إضافة خدمة جديدة</h3>
        <input name="name" placeholder="اسم الخدمة" required maxlength="60">
        <input name="price" type="number" min="0" step="5" placeholder="السعر بالريال (0 = مجاناً)" required>
        <button class="btn btn-sm">إضافة</button>
      </form>`;
  },

  earnings(p) {
    const { total, jobs } = Store.earnings(p.id);
    return `
      <div class="stats">
        <div class="stat"><span>${total}</span>إجمالي الأرباح (ريال)</div>
        <div class="stat"><span>${jobs.length}</span>خدمات مكتملة</div>
        <div class="stat"><span>${Store.rating(p.id).avg.toFixed(1)}</span>متوسط التقييم</div>
      </div>
      <h3>سجل المدفوعات</h3>
      ${jobs.length ? `<table class="table">
        <thead><tr><th>التاريخ</th><th>العميل</th><th>الخدمة</th><th>المبلغ</th></tr></thead>
        <tbody>${jobs.map((b) => `<tr><td>${b.date}</td><td>${esc(b.customerName)}</td><td>${esc(b.serviceName)}</td><td>${b.total} ريال</td></tr>`).join('')}</tbody>
      </table>` : '<p class="muted">لا توجد مدفوعات بعد.</p>'}`;
  },

  profile(p) {
    return `
      <form class="form" data-form="profile">
        <label>نبذة عنك <textarea name="bio" rows="3" maxlength="300">${esc(p.bio)}</textarea></label>
        <div class="form-row">
          <label>السعر بالساعة (ريال) <input name="hourlyRate" type="number" min="10" value="${p.hourlyRate}" required></label>
          <label>المدينة <input name="city" value="${esc(p.city)}"></label>
        </div>
        <label>المهارات (افصل بينها بفاصلة) <input name="skills" value="${esc(p.skills.join('، '))}"></label>
        <label class="radio"><input type="checkbox" name="newGraduate" ${p.newGraduate ? 'checked' : ''}> 🎓 أنا خريج جديد أبني خبرتي</label>
        <button class="btn">حفظ التعديلات</button>
      </form>`;
  },
};

function listScreen({ category = '', query = '' }) {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const sort = params.get('sort') || 'rating';
  const list = Store.searchProviders({ category, query, sort });
  const cat = category ? categoryOf(category) : null;
  const title = cat ? `${cat.icon} ${cat.name}` : `🔍 نتائج البحث عن "${esc(query)}"`;
  const base = cat ? `#/category/${category}` : `#/search?q=${encodeURIComponent(query)}`;
  const join = base.includes('?') ? '&' : '?';

  return `
    <a href="#/" class="back">→ الرئيسية</a>
    <section class="panel">
      <div class="list-head">
        <div><h1>${title}</h1><p class="muted">${list.length} مقدم خدمة</p></div>
        <div class="sort">ترتيب حسب:
          <a href="${base}${join}sort=rating" class="${sort === 'rating' ? 'active' : ''}">الأعلى تقييماً</a>
          <a href="${base}${join}sort=price" class="${sort === 'price' ? 'active' : ''}">الأقل سعراً</a>
        </div>
      </div>
      ${list.length ? `<div class="grid">${list.map(providerCard).join('')}</div>` : `
        <div class="empty"><div class="empty-icon">🔎</div><p>لا توجد نتائج. جرّب كلمة أخرى.</p><a href="#/" class="btn">كل التصنيفات</a></div>`}
    </section>`;
}

function authScreen(mode, presetRole) {
  if (Store.currentUser()) { go('#/'); return ''; }
  const isLogin = mode === 'login';
  return `
    <section class="panel auth">
      <div class="auth-logo">🏠</div>
      <h1>homezy</h1>
      <p class="muted">منصة الخدمات المنزلية</p>
      <div class="auth-tabs">
        <a href="#/login" class="${isLogin ? 'active' : ''}">تسجيل الدخول</a>
        <a href="#/register" class="${!isLogin ? 'active' : ''}">إنشاء حساب</a>
      </div>
      <form class="form" data-form="${mode}">
        ${isLogin ? '' : `
          <label>الاسم <input name="name" required maxlength="50" autocomplete="name"></label>
          <label>رقم الجوال <input name="phone" type="tel" pattern="05[0-9]{8}" placeholder="05xxxxxxxx" required></label>
          <fieldset class="payment">
            <legend>نوع الحساب</legend>
            <label class="radio"><input type="radio" name="role" value="customer" ${presetRole !== 'provider' ? 'checked' : ''}> 🙋 عميل – أبحث عن خدمة</label>
            <label class="radio"><input type="radio" name="role" value="provider" ${presetRole === 'provider' ? 'checked' : ''}> 🧑‍🔧 مقدم خدمة</label>
          </fieldset>
          <label class="provider-only">مجال الخدمة
            <select name="category">${CATEGORIES.map((c) => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}</select>
          </label>`}
        <label>📧 البريد الإلكتروني <input name="email" type="email" required autocomplete="email"></label>
        <label>🔒 كلمة المرور <input name="password" type="password" minlength="6" required autocomplete="${isLogin ? 'current-password' : 'new-password'}"></label>
        <button class="btn btn-block">${isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}</button>
      </form>
      ${isLogin ? `
        <div class="demo-box">
          <strong>حسابات تجريبية</strong> (كلمة المرور: 123456)
          <button class="link" data-action="demo" data-email="customer@homezy.demo">دخول كعميل</button>
          <button class="link" data-action="demo" data-email="provider@homezy.demo">دخول كمقدم خدمة</button>
        </div>` : ''}
    </section>`;
}

function costBox(cost) {
  return `
    <div><span>سعر الخدمة</span><span>${money(cost.price)}</span></div>
    ${cost.discount ? `<div class="discount"><span>${cost.label}</span><span>- ${cost.discount} ريال</span></div>` : ''}
    <div class="total"><span>الإجمالي</span><span>${money(cost.total)}</span></div>`;
}

function notFound() {
  return '<section class="panel empty"><div class="empty-icon">🤷</div><p>الصفحة غير موجودة.</p><a href="#/" class="btn">الرئيسية</a></section>';
}

/* ================= router ================= */

function render() {
  const [path, query] = location.hash.replace(/^#\/?/, '').split('?');
  const [name, ...args] = path.split('/');
  const params = new URLSearchParams(query || '');
  const view = routes[name] || notFound;

  renderHeader();
  const html = view(args[0], params, args[1]);
  if (html) app.innerHTML = html;
  window.scrollTo(0, 0);
  toggleProviderFields();
}

/* ================= events ================= */

document.addEventListener('submit', async (e) => {
  const form = e.target;
  const type = form.dataset.form;
  if (!type) return;
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  try {
    switch (type) {
      case 'search':
        if (data.q.trim()) go(`#/search?q=${encodeURIComponent(data.q.trim())}`);
        break;

      case 'login': {
        const user = await Store.login(data.email, data.password);
        toast(`أهلاً ${user.name} 👋`);
        afterLogin(user);
        break;
      }

      case 'register': {
        const user = await Store.register(data);
        toast('تم إنشاء حسابك بنجاح 🎉');
        afterLogin(user);
        break;
      }

      case 'book': {
        Store.bookService({ providerId: form.dataset.provider, serviceId: form.dataset.service, ...data });
        toast('تم إرسال طلب الحجز! ستصلك رسالة عند قبوله ✅');
        go('#/bookings');
        break;
      }

      case 'review':
        Store.submitReview(form.dataset.booking, data.rating, data.comment || '');
        toast('شكراً لتقييمك ⭐');
        render();
        break;

      case 'add-service':
        Store.addService(Store.currentUser().providerId, data.name, data.price);
        toast('تمت إضافة الخدمة');
        render();
        break;

      case 'profile': {
        const p = Store.currentUser().providerId;
        Store.updateProfile(p, {
          bio: data.bio.trim(),
          hourlyRate: Number(data.hourlyRate),
          city: data.city.trim(),
          skills: data.skills.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
          newGraduate: !!data.newGraduate,
        });
        toast('تم حفظ التعديلات');
        render();
        break;
      }
    }
  } catch (err) {
    toast(err.message, 'error');
  }
});

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === 'logout') {
    Store.logout();
    toast('تم تسجيل الخروج');
    go('#/');
    render();
  }

  if (action === 'demo') {
    const user = await Store.login(btn.dataset.email, '123456');
    toast(`أهلاً ${user.name} 👋`);
    afterLogin(user);
  }

  if (action === 'apply-code') {
    const form = btn.closest('form');
    const provider = Store.provider(form.dataset.provider);
    const service = provider.services.find((s) => s.id === form.dataset.service);
    const cost = Store.calculateCost(service.price, form.code.value);
    document.getElementById('cost').innerHTML = costBox(cost);
    toast(cost.valid ? `تم تطبيق ${cost.label}` : 'كود الخصم غير صحيح', cost.valid ? 'success' : 'error');
  }

  if (action === 'status') {
    Store.updateBookingStatus(btn.dataset.id, btn.dataset.status);
    toast(`تم تحديث حالة الحجز: ${BOOKING_STATUS[btn.dataset.status].label}`);
    render();
  }

  if (action === 'remove-service' && confirm('حذف هذه الخدمة؟')) {
    Store.removeService(Store.currentUser().providerId, btn.dataset.id);
    render();
  }

  if (action === 'reset' && confirm('إعادة البيانات التجريبية لحالتها الأصلية؟')) {
    await Store.reset();
    toast('تمت إعادة البيانات');
    go('#/');
    render();
  }
});

// Show the "service field" only when registering as a provider.
document.addEventListener('change', (e) => {
  if (e.target.name === 'role') toggleProviderFields();
});

function toggleProviderFields() {
  const field = document.querySelector('.provider-only');
  const checked = document.querySelector('input[name="role"]:checked');
  if (field && checked) field.hidden = checked.value !== 'provider';
}

function afterLogin(user) {
  const next = sessionStorage.getItem('homezy-after-login');
  sessionStorage.removeItem('homezy-after-login');
  go(next || (user.role === 'provider' ? '#/dashboard' : '#/'));
  render();
}

/* ================= start ================= */

window.addEventListener('hashchange', render);
Store.init().then(render);
