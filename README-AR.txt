MEDICINE D.S. — KMCA PRICE
إصلاح الشعار وإظهار عدّاد الزوار

المحتويات:
- index.html في المجلد الرئيسي: ارفعه إلى جذر مستودع GitHub Pages واستبدل الملف القديم.
- medicine-ds-logo.png و medicine-ds-icon.png في المجلد الرئيسي: ارفعهما إلى جذر المستودع.
- worker.js: استبدل به ملف Worker الحالي في مستودع GitHub المرتبط بـ Cloudflare.
- public/: نسخة مطابقة من ملفات الموقع لمن يستخدم إعداد Cloudflare Assets الذي يشير إلى ./public.

الإصلاحات:
1) إصلاح مسارات الشعار والأيقونة لتعمل على GitHub Pages داخل مسار المستودع.
2) نقل عدّاد إجمالي الزوار إلى أعلى الصفحة أسفل اسم MEDICINE DRUG STORE.
3) ربط العداد بعنوان Cloudflare Worker: https://medicine-counter-api.tahirhassan49.workers.dev/api/visitor-count.
4) قراءة total_visits أو total من استجابة API.
5) الاحتفاظ بمعرّف المتصفح محلياً حتى لا يتكرر احتسابه عند تحديث الصفحة.
6) إتاحة GET على عنوان Worker الرئيسي لإظهار JSON يحوي total_visits، إضافة إلى مسار /api/visitor-count.

خطوات GitHub:
1) افتح مستودع Medicine.ds.
2) استبدل index.html الموجود في جذر المستودع بملف index.html الموجود هنا في الجذر.
3) ارفع medicine-ds-logo.png و medicine-ds-icon.png إلى الجذر، ووافق على استبدال الملفات إذا طُلب ذلك.
4) استبدل worker.js في الجذر بهذا الملف، ثم احفظ التغييرات (Commit changes).
5) لا تحذف ولا تنشئ قاعدة D1 جديدة. أبقِ إعداد wrangler.toml الحالي واسم ربط D1 كما هو (DB).
6) انتظر اكتمال نشر GitHub Pages وCloudflare Worker، ثم افتح الموقع وتحقق من ظهور الشعار والعدد أعلى الصفحة.

اختبار العداد: افتح https://medicine-counter-api.tahirhassan49.workers.dev؛ يجب أن يعرض JSON فيه success و total_visits.
هذا التحديث لا يصفر العداد ولا يحذف سجلات D1.
