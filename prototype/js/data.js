/**
 * HOMEZY – sample data used to fill the prototype the first time it runs.
 * Everything is then saved in the browser (localStorage) by store.js.
 */

const CATEGORIES = [
  { id: 'cleaning',   name: 'تنظيف المنزل',        icon: '🧹', desc: 'تنظيف شامل لجميع أنحاء المنزل' },
  { id: 'ac',         name: 'تكييف وتبريد',        icon: '❄️', desc: 'تنظيف وصيانة المكيفات' },
  { id: 'plumbing',   name: 'سباكة',               icon: '🔧', desc: 'إصلاح التسريبات والتمديدات' },
  { id: 'electrical', name: 'كهرباء',              icon: '💡', desc: 'إصلاح الأعطال وتركيب الإنارة' },
  { id: 'cooking',    name: 'طبخ',                 icon: '👩‍🍳', desc: 'طبخ منزلي وولائم ومناسبات' },
  { id: 'beauty',     name: 'مكياج وتجميل',        icon: '💄', desc: 'مكياج مناسبات وعناية' },
  { id: 'training',   name: 'تدريب شخصي',          icon: '🏋️', desc: 'تمارين ولياقة في المنزل' },
  { id: 'tech',       name: 'مهام تقنية وإدارية',  icon: '💻', desc: 'برمجة، تنسيق ملفات، حسابات مشاريع' },
];

const PROVIDERS = [
  {
    id: 'p1', name: 'أبو فهد للسباكة', category: 'plumbing', avatar: '👨‍🔧', city: 'الخرج',
    hourlyRate: 90, verified: true, newGraduate: false, years: 12,
    bio: 'سباك بخبرة أكثر من 12 سنة في إصلاح التسريبات وتمديدات المياه والسخانات.',
    skills: ['كشف تسريبات', 'تمديدات', 'سخانات'],
    services: [
      { id: 's1', name: 'إصلاح تسريب', price: 180 },
      { id: 's2', name: 'تركيب سخان', price: 250 },
      { id: 's3', name: 'استشارة وفحص مجاني', price: 0 },
    ],
  },
  {
    id: 'p2', name: 'لمسة نظافة', category: 'cleaning', avatar: '🧽', city: 'الرياض',
    hourlyRate: 60, verified: true, newGraduate: false, years: 6,
    bio: 'فريق تنظيف منزلي متكامل بأحدث المعدات ومواد آمنة على الأطفال.',
    skills: ['تنظيف عميق', 'تنظيف بعد الترميم', 'تعقيم'],
    services: [
      { id: 's1', name: 'تنظيف شقة', price: 200 },
      { id: 's2', name: 'تنظيف فيلا', price: 450 },
    ],
  },
  {
    id: 'p3', name: 'برد وسلامة', category: 'ac', avatar: '🧑‍🔧', city: 'الرياض',
    hourlyRate: 75, verified: true, newGraduate: false, years: 8,
    bio: 'صيانة وتنظيف جميع أنواع المكيفات (سبليت، شباك، مركزي).',
    skills: ['سبليت', 'تعبئة فريون', 'مكيفات مركزية'],
    services: [
      { id: 's1', name: 'تنظيف مكيف سبليت', price: 150 },
      { id: 's2', name: 'تعبئة فريون', price: 220 },
    ],
  },
  {
    id: 'p4', name: 'كهربائي النور', category: 'electrical', avatar: '👷', city: 'الخرج',
    hourlyRate: 85, verified: true, newGraduate: false, years: 10,
    bio: 'إصلاح الأعطال الكهربائية وتركيب الإنارة والأفياش بضمان.',
    skills: ['أعطال', 'إنارة', 'لوحات كهرباء'],
    services: [
      { id: 's1', name: 'إصلاح عطل كهربائي', price: 200 },
      { id: 's2', name: 'تركيب إنارة', price: 120 },
    ],
  },
  {
    id: 'p5', name: 'مطبخ أم سارة', category: 'cooking', avatar: '👩‍🍳', city: 'الرياض',
    hourlyRate: 70, verified: true, newGraduate: false, years: 15,
    bio: 'أكلات شعبية وولائم ومناسبات بطعم البيت.',
    skills: ['كبسة', 'مقلوبة', 'حلويات'],
    services: [
      { id: 's1', name: 'وليمة 10 أشخاص', price: 600 },
      { id: 's2', name: 'صينية حلا', price: 150 },
    ],
  },
  {
    id: 'p6', name: 'ريم للمكياج', category: 'beauty', avatar: '💄', city: 'الرياض',
    hourlyRate: 150, verified: true, newGraduate: false, years: 5,
    bio: 'مكياج سهرات وأعراس وجلسات تصوير في المنزل.',
    skills: ['مكياج سهرة', 'تسريحات', 'عرائس'],
    services: [
      { id: 's1', name: 'مكياج سهرة', price: 400 },
      { id: 's2', name: 'تسريحة', price: 200 },
    ],
  },
  {
    id: 'p7', name: 'كوتش خالد', category: 'training', avatar: '🏋️', city: 'الخرج',
    hourlyRate: 120, verified: true, newGraduate: false, years: 4,
    bio: 'مدرب لياقة معتمد، برامج تمارين منزلية لجميع المستويات.',
    skills: ['خسارة وزن', 'قوة', 'مرونة'],
    services: [
      { id: 's1', name: 'حصة تدريب منزلية', price: 120 },
      { id: 's2', name: 'برنامج شهري', price: 900 },
    ],
  },
  {
    id: 'p8', name: 'لين – خريجة علوم حاسب', category: 'tech', avatar: '👩‍💻', city: 'الخرج',
    hourlyRate: 40, verified: true, newGraduate: true, years: 0,
    bio: 'خريجة جديدة أبحث عن خبرة عملية: تصميم مواقع بسيطة، تنسيق ملفات، وإعداد عروض تقديمية.',
    skills: ['HTML/CSS', 'Excel', 'عروض تقديمية'],
    services: [
      { id: 's1', name: 'تنسيق ملف أو عرض تقديمي', price: 60 },
      { id: 's2', name: 'صفحة ويب تعريفية', price: 300 },
    ],
  },
  {
    id: 'p9', name: 'سعد – خريج هندسة', category: 'electrical', avatar: '🧑‍🎓', city: 'الرياض',
    hourlyRate: 45, verified: true, newGraduate: true, years: 0,
    bio: 'خريج هندسة كهربائية، أقدم خدمات بسيطة بأسعار مناسبة لبناء خبرتي.',
    skills: ['تركيب أفياش', 'فحص التمديدات'],
    services: [
      { id: 's1', name: 'تركيب أفياش ومفاتيح', price: 80 },
    ],
  },
  {
    id: 'p10', name: 'نظافة برو', category: 'cleaning', avatar: '🧹', city: 'الخرج',
    hourlyRate: 55, verified: false, newGraduate: false, years: 3,
    bio: 'تنظيف منازل ومكاتب بأسعار منافسة.',
    skills: ['تنظيف مكاتب', 'غسيل سجاد'],
    services: [
      { id: 's1', name: 'تنظيف شقة', price: 180 },
      { id: 's2', name: 'غسيل سجاد', price: 90 },
    ],
  },
];

// Past reviews so every profile has something to show.
const REVIEWS = [
  { providerId: 'p1', customer: 'محمد', rating: 5, comment: 'شغل نظيف وسريع، أنصح فيه.' },
  { providerId: 'p1', customer: 'هند', rating: 4, comment: 'ممتاز بس تأخر شوي عن الموعد.' },
  { providerId: 'p2', customer: 'سارة', rating: 5, comment: 'البيت صار يلمع! شكراً لكم.' },
  { providerId: 'p2', customer: 'عبدالله', rating: 5, comment: 'فريق محترم ومرتب.' },
  { providerId: 'p3', customer: 'فيصل', rating: 4, comment: 'المكيف صار يبرد ممتاز.' },
  { providerId: 'p4', customer: 'أمل', rating: 5, comment: 'حل المشكلة من أول زيارة.' },
  { providerId: 'p5', customer: 'نوف', rating: 5, comment: 'الأكل لذيذ والكمية ممتازة.' },
  { providerId: 'p6', customer: 'جود', rating: 5, comment: 'مكياج ناعم وثابت طول السهرة.' },
  { providerId: 'p7', customer: 'تركي', rating: 4, comment: 'مدرب ملتزم ويحفز.' },
  { providerId: 'p8', customer: 'رهف', rating: 5, comment: 'نسقت عرضي التقديمي باحترافية!' },
  { providerId: 'p9', customer: 'ماجد', rating: 4, comment: 'شغل مرتب وسعر ممتاز.' },
  { providerId: 'p10', customer: 'ريم', rating: 3, comment: 'جيد لكن يحتاج دقة أكثر.' },
];

// Demo accounts (password for both: 123456).
const DEMO_USERS = [
  { id: 'u1', name: 'عميل تجريبي', email: 'customer@homezy.demo', role: 'customer', phone: '0500000001', address: 'الخرج – حي الخالدية' },
  { id: 'u2', name: 'أبو فهد', email: 'provider@homezy.demo', role: 'provider', phone: '0500000002', providerId: 'p1' },
];

// Discount codes (FR9).
const DISCOUNT_CODES = {
  HOMEZY10: { percent: 10, label: 'خصم 10%' },
  WELCOME20: { percent: 20, label: 'خصم 20% للعملاء الجدد' },
};

const BOOKING_STATUS = {
  pending:   { label: 'بانتظار الموافقة', cls: 'st-pending' },
  accepted:  { label: 'مقبول',            cls: 'st-accepted' },
  rejected:  { label: 'مرفوض',            cls: 'st-rejected' },
  completed: { label: 'مكتمل',            cls: 'st-completed' },
};
