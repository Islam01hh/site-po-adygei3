import React, { useState } from "react";
import { Sight, Route, Review, CategoryType, DifficultyType } from "../types";
import { Plus, Trash2, Database, UploadCloud, MapPin, Compass, AlertCircle, Sparkles, Check } from "lucide-react";

interface AdminPanelProps {
  sights: Sight[];
  routes: Route[];
  reviews: Review[];
  onAddSight: (newSight: Omit<Sight, "createdAt">) => Promise<void>;
  onAddRoute: (newRoute: Omit<Route, "createdAt">) => Promise<void>;
  onDeleteSight: (sightId: string) => Promise<void>;
  onDeleteRoute: (routeId: string) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onSeedData: () => Promise<void>;
}

export default function AdminPanel({
  sights,
  routes,
  reviews,
  onAddSight,
  onAddRoute,
  onDeleteSight,
  onDeleteRoute,
  onDeleteReview,
  onSeedData,
}: AdminPanelProps) {
  // Tabs
  const [activeTab, setActiveTab] = useState<"sights" | "routes" | "reviews" | "seed">("sights");

  // Success/Error Feedbacks
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states - New Sight
  const [newSightId, setNewSightId] = useState("");
  const [newSightTitle, setNewSightTitle] = useState("");
  const [newSightShort, setNewSightShort] = useState("");
  const [newSightDesc, setNewSightDesc] = useState("");
  const [newSightImg, setNewSightImg] = useState("");
  const [newSightCat, setNewSightCat] = useState<CategoryType>("nature");
  const [newSightLoc, setNewSightLoc] = useState("");
  const [newSightLat, setNewSightLat] = useState("44.2");
  const [newSightLng, setNewSightLng] = useState("40.1");

  // Form states - New Route
  const [newRouteId, setNewRouteId] = useState("");
  const [newRouteTitle, setNewRouteTitle] = useState("");
  const [newRouteDesc, setNewRouteDesc] = useState("");
  const [newRouteDur, setNewRouteDur] = useState("");
  const [newRouteDiff, setNewRouteDiff] = useState<DifficultyType>("easy");
  const [newRouteImg, setNewRouteImg] = useState("");
  const [newRouteSights, setNewRouteSights] = useState<string[]>([]);

  const handleStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Submit Sight handlers
  const handleCreateSight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSightTitle || !newSightShort || !newSightDesc || !newSightImg || !newSightLoc) {
      handleStatus("error", "Пожалуйста, заполните все обязательные поля");
      return;
    }

    const itemSlug = newSightId.trim() || newSightTitle.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-") || `sight-${Date.now()}`;
    const lat = parseFloat(newSightLat) || 44.0;
    const lng = parseFloat(newSightLng) || 40.0;

    try {
      await onAddSight({
        id: itemSlug,
        title: newSightTitle,
        shortDescription: newSightShort,
        description: newSightDesc,
        image: newSightImg,
        category: newSightCat,
        location: newSightLoc,
        coordinates: { lat, lng },
        rating: 5.0,
        reviewsCount: 0,
        createdBy: "admin_console"
      });
      handleStatus("success", `Локация «${newSightTitle}» успешно добавлена в каталог!`);
      // Reset
      setNewSightId("");
      setNewSightTitle("");
      setNewSightShort("");
      setNewSightDesc("");
      setNewSightImg("");
      setNewSightLoc("");
    } catch (err: any) {
      handleStatus("error", `Ошибка создания: ${err.message || err}`);
    }
  };

  // Submit Route Handlers
  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteTitle || !newRouteDesc || !newRouteDur || !newRouteImg || newRouteSights.length === 0) {
      handleStatus("error", "Заполните необходимые поля и свяжите хотя бы одну достопримечательность");
      return;
    }

    const routeSlug = newRouteId.trim() || newRouteTitle.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-") || `route-${Date.now()}`;

    try {
      await onAddRoute({
        id: routeSlug,
        title: newRouteTitle,
        description: newRouteDesc,
        duration: newRouteDur,
        difficulty: newRouteDiff,
        image: newRouteImg,
        sightIds: newRouteSights,
        createdBy: "admin_console"
      });
      handleStatus("success", `Маршрут «${newRouteTitle}» добавлен!`);
      // Reset
      setNewRouteId("");
      setNewRouteTitle("");
      setNewRouteDesc("");
      setNewRouteDur("");
      setNewRouteImg("");
      setNewRouteSights([]);
    } catch (err: any) {
      handleStatus("error", err.message || err);
    }
  };

  const handleToggleSightInRoute = (sightId: string) => {
    setNewRouteSights(prev => 
      prev.includes(sightId) 
        ? prev.filter(id => id !== sightId) 
        : [...prev, sightId]
    );
  };

  const executeSeed = async () => {
    try {
      await onSeedData();
      handleStatus("success", "База данных успешно инициализирована демонстрационными материалами!");
    } catch (err: any) {
      handleStatus("error", err.message || err);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl" id="admin_panel_container">
      {/* Admin Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="font-display font-bold text-lg md:text-xl text-slate-800">
              Панель администратора
            </h2>
          </div>
          <p className="text-slate-500 text-xs md:text-sm mt-1">
            Модерируйте контент, редактируйте списки и управляйте отзывами путеводителя Адыгеи
          </p>
        </div>

        {/* Action Status Panel */}
        {statusMsg && (
          <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            statusMsg.type === "success" 
              ? "bg-teal-50 border-teal-200 text-teal-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <AlertCircle className="w-4 h-4" />
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* Admin section Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "sights", label: "🏔️ Новая Локация" },
          { id: "routes", label: "🗺️ Новый Маршрут" },
          { id: "reviews", label: "💬 Модерация отзывов" },
          { id: "seed", label: "📥 Заливка Демо-данных" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-xl transition ${
              activeTab === tab.id 
                ? "bg-slate-900 text-white shadow-sm" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            id={`tab_${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active administrative content panel */}
      <div className="space-y-4">
        
        {/* --- TABS 1: ADD SIGHT --- */}
        {activeTab === "sights" && (
          <form onSubmit={handleCreateSight} className="space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-700 uppercase tracking-wider mb-2">
              Зарегистрировать новую достопримечательность (Sight)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Название <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSightTitle}
                  onChange={(e) => setNewSightTitle(e.target.value)}
                  placeholder="например: Скала Чертов палец"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Краткое ID (Slug) путеводителя
                </label>
                <input
                  type="text"
                  value={newSightId}
                  onChange={(e) => setNewSightId(e.target.value)}
                  placeholder="например: chertov-palec (латиницей, без пробелов)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Абзац-превью для карточки <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  maxLength={1000}
                  value={newSightShort}
                  onChange={(e) => setNewSightShort(e.target.value)}
                  placeholder="До 300 символов краткого описания для предпросмотра..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Полное подробное описание (Поддерживает форматирование Markdown) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={newSightDesc}
                  onChange={(e) => setNewSightDesc(e.target.value)}
                  placeholder="История, геология, советы туристам по посещению..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Ссылка на фотографию (Image URL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={newSightImg}
                  onChange={(e) => setNewSightImg(e.target.value)}
                  placeholder="https://images.unsplash.com/promo..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Категория <span className="text-red-500">*</span>
                </label>
                <select
                  value={newSightCat}
                  onChange={(e) => setNewSightCat(e.target.value as CategoryType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="nature">🌲 Природа и Заповедники</option>
                  <option value="culture">🏛️ Культура и История</option>
                  <option value="monument">🗿 Памятники и Легенды</option>
                  <option value="active">🥾 Активный Отдых</option>
                  <option value="wellness">♨️ Минеральные и Термальные Бассейны</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Географическая локация <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSightLoc}
                  onChange={(e) => setNewSightLoc(e.target.value)}
                  placeholder="например: пос. Даховская, Майкопский район"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-0.5">Широта (Lat)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="43.0"
                    max="45.0"
                    value={newSightLat}
                    onChange={(e) => setNewSightLat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-0.5">Долгота (Lng)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="39.0"
                    max="41.0"
                    value={newSightLng}
                    onChange={(e) => setNewSightLng(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition inline-flex items-center gap-2 shadow-md"
              id="btn_submit_sight"
            >
              <Plus className="w-4 h-4" /> Добавить в каталог достопримечательностей
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              Регистрация локации автоматически нанесет её на интерактивную векторную карту.
            </p>
          </form>
        )}

        {/* --- TABS 2: ADD ROUTE --- */}
        {activeTab === "routes" && (
          <form onSubmit={handleCreateRoute} className="space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-700 uppercase tracking-wider mb-2">
              Сконструировать авторский туристический маршрут (Route)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Наименование маршрута <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRouteTitle}
                  onChange={(e) => setNewRouteTitle(e.target.value)}
                  placeholder="напр: Тайны Адыгейских Ущелий"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Длина маршрута / Тайминг <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRouteDur}
                  onChange={(e) => setNewRouteDur(e.target.value)}
                  placeholder="напр: 3 дня, 8 часов, выходные"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Сложность маршрута <span className="text-red-500">*</span>
                </label>
                <select
                  value={newRouteDiff}
                  onChange={(e) => setNewRouteDiff(e.target.value as DifficultyType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="easy">🟢 Простой (семейный, легкая ходьба)</option>
                  <option value="medium">🟡 Средний (требует удобной обуви)</option>
                  <option value="hard">🔴 Сложный (альпинистские тропы/условия)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Обложка маршрута (URL) <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={newRouteImg}
                  onChange={(e) => setNewRouteImg(e.target.value)}
                  placeholder="Ссылка на обложку..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  План похода по дням/часам (Markdown рекомендуемый формат) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={newRouteDesc}
                  onChange={(e) => setNewRouteDesc(e.target.value)}
                  placeholder="### Описание маршрута..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-xs"
                />
              </div>

              {/* Linking sights */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Связать локации из каталога Адыгеи <span className="text-red-500">*</span> (выберите участвующие достопримечательности):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 border border-slate-100 p-3 rounded-2xl bg-slate-50">
                  {sights.map(sight => {
                    const isLinked = newRouteSights.includes(sight.id);
                    return (
                      <button
                        type="button"
                        key={sight.id}
                        onClick={() => handleToggleSightInRoute(sight.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition text-xs ${
                          isLinked 
                            ? "bg-teal-50 border-teal-300 text-teal-950 font-semibold shadow-sm"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                        id={`toggle_sight_${sight.id}`}
                      >
                        <span className="truncate pr-1">{sight.title}</span>
                        {isLinked ? (
                          <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[9px] shrink-0 font-bold">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-mono">связать+</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition inline-flex items-center gap-2 shadow-md"
              id="btn_submit_route"
            >
              <Plus className="w-4 h-4" /> Записать туристический путь
            </button>
          </form>
        )}

        {/* --- TABS 3: MODERATE REVIEWS --- */}
        {activeTab === "reviews" && (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-700 uppercase tracking-wider mb-2">
              Модерация постов и оценок пользователей (Reviews)
            </h3>

            {reviews.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Свежих отзывов пользователей пока нет. Они появятся здесь после публикации!</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wide border-b border-slate-200">
                    <tr>
                      <th className="p-3">Sight ID</th>
                      <th className="p-3">Автор</th>
                      <th className="p-3">Рейтинг</th>
                      <th className="p-3">Комментарий</th>
                      <th className="p-3 text-right">Управление</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reviews.map((rev) => (
                      <tr key={rev.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-medium text-slate-500">{rev.sightId}</td>
                        <td className="p-3 text-slate-900 font-semibold">{rev.userName}</td>
                        <td className="p-3 text-amber-500">{"★".repeat(rev.rating)}</td>
                        <td className="p-3 text-slate-600 max-w-sm truncate">{rev.text}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => rev.id && onDeleteReview(rev.id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-xl transition inline-flex items-center gap-1"
                            title="Удалить отзыв"
                            id={`delete_rev_${rev.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Catalog Danger Zone management */}
            <h3 className="font-display font-semibold text-xs text-red-500 uppercase tracking-widest mt-6">
              Реестр удаления из каталога (Опасная зона)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sight list cleanup */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="font-bold text-slate-700 text-xs block mb-2">Локации в Базе</span>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {sights.map(s => (
                    <div key={s.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 text-xs text-slate-800">
                      <span className="truncate pr-2 font-medium">{s.title}</span>
                      <button 
                        onClick={() => onDeleteSight(s.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Удалить достопримечательность"
                        id={`delete_sight_btn_${s.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Route list cleanup */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="font-bold text-slate-700 text-xs block mb-2">Туристические пути (Маршруты)</span>
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {routes.map(r => (
                    <div key={r.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 text-xs text-slate-800">
                      <span className="truncate pr-2 font-medium">{r.title}</span>
                      <button 
                        onClick={() => onDeleteRoute(r.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Удалить маршрут"
                        id={`delete_route_btn_${r.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TABS 4: SEED DATABASE --- */}
        {activeTab === "seed" && (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4 max-w-xl mx-auto">
            <Database className="w-12 h-12 text-teal-600 mx-auto animate-pulse" />
            <h3 className="font-display font-bold text-slate-800 text-base md:text-lg">
              Инициализировать Базу Данных Путеводителя
            </h3>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
              Если в вашей базе данных Firestore пусто (ведь проект только что создан), вы можете одним кликом загрузить полный готовый массив данных Адыгеи: 6 детально прописанных достопримечательностей с картинками и гео-метками, а также интересные готовые путевые направления.
            </p>
            
            <p className="text-red-500 font-semibold text-xs border border-red-100 bg-red-50 p-2.5 rounded-lg">
              Внимание: Данное действие заполнит коллекции "sights" и "routes". Существующие записи с совпадающими ID будут перезаписаны!
            </p>

            <button
              onClick={executeSeed}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition inline-flex items-center gap-2"
              id="btn_trigger_db_seed"
            >
              <UploadCloud className="w-4 h-4" />
              Загрузить демонстрационные данные
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
