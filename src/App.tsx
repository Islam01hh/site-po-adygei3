import React, { useState, useEffect } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { Sight, Route, Review, UserProfile, CategoryType } from "./types";
import { initialSights, initialRoutes } from "./initialData";

// Components
import MapMock from "./components/MapMock";
import AiTouristGuide from "./components/AiTouristGuide";
import AdminPanel from "./components/AdminPanel";
import ReviewList from "./components/ReviewList";

// Icons
import { 
  Compass, 
  MapPin, 
  Star, 
  User, 
  LogOut, 
  Check, 
  ShieldAlert, 
  Heart, 
  Feather, 
  ArrowRight, 
  Navigation,
  FileText,
  Lock,
  Mail,
  UserCheck,
  Eye,
  X,
  Sparkles,
  Info
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "Все места", icon: "🌐" },
  { id: "nature", label: "Природа", icon: "🌲" },
  { id: "culture", label: "Культура", icon: "🏛️" },
  { id: "monument", label: "Памятники", icon: "🗿" },
  { id: "active", label: "Активный отдых", icon: "🥾" },
  { id: "wellness", label: "Термы", icon: "♨" }
];

const defaultReviews: Review[] = [
  {
    id: "rev-seed-1",
    sightId: "lagonaki",
    userId: "user-seed-1",
    userName: "Мария Смирнова",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
    rating: 5,
    text: "Это просто космос! Высокогорные луга поражают своими масштабами и ароматами субальпийских трав. Обязательно поднимитесь на «Каменное море» со смотровой площадки.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "rev-seed-2",
    sightId: "rufabgo",
    userId: "user-seed-2",
    userName: "Александр В.",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
    rating: 4,
    text: "Красивые оборудованные водопады. Шумный каньон. Дошли до «Девичьей Косы» — тропа каменистая, но вид того стоит. Лучше надевать спортивную хваткую обувь.",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "rev-seed-3",
    sightId: "tesnina",
    userId: "user-seed-3",
    userName: "Дмитрий К.",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
    rating: 5,
    text: "Бешеная энергетика горной реки Белой в Хаджохской теснине буквально гипнотизирует! Очень мощное ущелье. Вечером включили красивую разноцветную подсветку.",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export default function App() {
  // Database states
  const [sights, setSights] = useState<Sight[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Selection / Navigation states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSight, setSelectedSight] = useState<Sight | null>(null);
  const [activeTab, setActiveTab] = useState<"catalog" | "routes" | "admin">("catalog");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Authentication states
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authIsRegister, setAuthIsRegister] = useState(false);
  
  // Auth Form variables
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authAvatarSig, setAuthAvatarSig] = useState("avatar-1");
  const [authError, setAuthError] = useState<string | null>(null);

  // Demo Simulated Offline states & bootstrap options
  const [isDemoAdminMode, setIsDemoAdminMode] = useState(false);

  // Avatars list to choose from on registration
  const AVATARS = [
    { id: "avatar-1", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" },
    { id: "avatar-2", url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100" },
    { id: "avatar-3", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" },
    { id: "avatar-4", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" }
  ];

  // --- Realtime FireSync ---
  useEffect(() => {
    // 1. Sights Sync
    let unsubSights = () => {};
    try {
      unsubSights = onSnapshot(collection(db, "sights"), (snapshot) => {
        const list: Sight[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as Sight);
        });
        setSights(list.length > 0 ? list : initialSights);
      }, (err) => {
        console.warn("Firestore collection 'sights' is not active or empty. Utilizing embedded guide assets.", err);
        setSights(initialSights);
      });
    } catch (e) {
      setSights(initialSights);
    }

    // 2. Routes Sync
    let unsubRoutes = () => {};
    try {
      unsubRoutes = onSnapshot(collection(db, "routes"), (snapshot) => {
        const list: Route[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as Route);
        });
        setRoutes(list.length > 0 ? list : initialRoutes);
      }, (err) => {
        console.warn("Firestore collection 'routes' is empty.", err);
        setRoutes(initialRoutes);
      });
    } catch (e) {
      setRoutes(initialRoutes);
    }

    // 3. Reviews Sync
    let unsubReviews = () => {};
    try {
      unsubReviews = onSnapshot(collection(db, "reviews"), (snapshot) => {
        const list: Review[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as Review);
        });
        setReviews(list.length > 0 ? list : defaultReviews);
      }, (err) => {
        console.warn("Firestore reviews sync not reachable.", err);
        setReviews(defaultReviews);
      });
    } catch (e) {
      setReviews(defaultReviews);
    }

    // 4. Firebase Authentication Sync
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Authenticated. Check and read custom role or create standard profile
        const profile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split("@")[0] || "Писатель",
          email: user.email || "",
          photoURL: user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
          role: user.email === "Khabemizov@gmail.com" ? "admin" : "user",
          createdAt: new Date().toISOString()
        };

        // Attempt to sync the User Profile to our collection, so Firestore rules work correctly on reads
        try {
          await setDoc(doc(db, "users", user.uid), profile, { merge: true });
        } catch (e) {
          console.warn("Profile sync in Firestore user profiles list skipped (non-admin/initial database setup).");
        }

        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      unsubSights();
      unsubRoutes();
      unsubReviews();
      unsubAuth();
    };
  }, []);

  // Set initial selected sight on boot
  useEffect(() => {
    if (sights.length > 0 && !selectedSight) {
      setSelectedSight(sights[0]);
    }
  }, [sights]);

  // --- Actions & Database Handlers ---

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setAuthModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setAuthError("Не удалось войти через Google. Попробуйте email/пароль.");
    }
  };

  const handleCustomAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    try {
      if (authIsRegister) {
        // Registration
        if (!authName || !authEmail || !authPassword) {
          setAuthError("Пожалуйста, заполните необходимые поля");
          return;
        }
        
        const avatarUrl = AVATARS.find(a => a.id === authAvatarSig)?.url || AVATARS[0].url;
        
        // Attempt firebase creation
        const cred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        
        const profile: UserProfile = {
          uid: cred.user.uid,
          displayName: authName,
          email: authEmail,
          photoURL: avatarUrl,
          role: authEmail === "Khabemizov@gmail.com" ? "admin" : "user",
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, "users", cred.user.uid), profile);
        setCurrentUser(profile);
      } else {
        // Sign In
        if (!authEmail || !authPassword) {
          setAuthError("Заполните email и пароль");
          return;
        }
        const cred = await signInWithEmailAndPassword(auth, authEmail, authPassword);
        
        const welcomeProfile: UserProfile = {
          uid: cred.user.uid,
          displayName: cred.user.displayName || authEmail.split("@")[0],
          email: authEmail,
          photoURL: cred.user.photoURL || AVATARS[0].url,
          role: authEmail === "Khabemizov@gmail.com" ? "admin" : "user",
          createdAt: new Date().toISOString()
        };
        setCurrentUser(welcomeProfile);
      }
      setAuthModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Ошибка авторизации");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsDemoAdminMode(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Enable/Disable Demo Mode access for defense presentation
  const toggleDemoAdmin = () => {
    if (isDemoAdminMode) {
      setIsDemoAdminMode(false);
      setCurrentUser(null);
    } else {
      setIsDemoAdminMode(true);
      setCurrentUser({
        uid: "demo_admin_uid",
        displayName: "Асланбий Х. (Админ-Демо)",
        email: "Khabemizov@gmail.com",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
        role: "admin",
        createdAt: new Date().toISOString()
      });
      setActiveTab("admin");
    }
  };

  // Recalculates other attributes on reviews submit
  const handleAddNewReview = async (rating: number, text: string) => {
    if (!selectedSight || !currentUser) return;

    const newReview: Review = {
      sightId: selectedSight.id,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userAvatar: currentUser.photoURL,
      rating,
      text,
      createdAt: new Date().toISOString()
    };

    const path = "reviews";
    try {
      // 1. Add review
      await addDoc(collection(db, path), newReview);

      // 2. Recalculate Sight Rating locally and in Firebase
      const currentReviews = reviews.filter(r => r.sightId === selectedSight.id);
      const newCount = currentReviews.length + 1;
      const newAvgRating = parseFloat(
        ((selectedSight.rating * selectedSight.reviewsCount + rating) / newCount).toFixed(1)
      );

      // Try update in Firestore
      try {
        await updateDoc(doc(db, "sights", selectedSight.id), {
          rating: newAvgRating,
          reviewsCount: newCount
        });
      } catch (err) {
        // Fallback state update if user doesn't have offline permissions but wants reviews to appear
        console.warn("Couldn't write score updates in Firestore: updating local application models.");
      }

      // Sync local state for instantaneous feedback feel
      setReviews(prev => [...prev, { ...newReview, id: `temp-${Date.now()}` }]);
      setSights(prev => 
        prev.map(s => s.id === selectedSight.id ? { ...s, rating: newAvgRating, reviewsCount: newCount } : s)
      );
      setSelectedSight(prev => prev ? { ...prev, rating: newAvgRating, reviewsCount: newCount } : null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  // Administration collection commands
  const handleAddSight = async (payload: Omit<Sight, "createdAt">) => {
    const fresh: Sight = {
      ...payload,
      createdAt: new Date().toISOString()
    };
    const path = `sights/${payload.id}`;
    try {
      await setDoc(doc(db, "sights", payload.id), fresh);
      setSights(prev => [...prev, fresh]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleAddRoute = async (payload: Omit<Route, "createdAt">) => {
    const fresh: Route = {
      ...payload,
      createdAt: new Date().toISOString()
    };
    const path = `routes/${payload.id}`;
    try {
      await setDoc(doc(db, "routes", payload.id), fresh);
      setRoutes(prev => [...prev, fresh]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDeleteSight = async (sightId: string) => {
    const path = `sights/${sightId}`;
    try {
      await deleteDoc(doc(db, "sights", sightId));
      setSights(prev => prev.filter(s => s.id !== sightId));
      if (selectedSight?.id === sightId) {
        setSelectedSight(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    const path = `routes/${routeId}`;
    try {
      await deleteDoc(doc(db, "routes", routeId));
      setRoutes(prev => prev.filter(r => r.id !== routeId));
      if (selectedRoute?.id === routeId) {
        setSelectedRoute(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const path = `reviews/${reviewId}`;
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Seeds database with curated sights/routes
  const handleSeedData = async () => {
    try {
      // Seed Sights
      for (const s of initialSights) {
        await setDoc(doc(db, "sights", s.id), s);
      }
      // Seed Routes
      for (const r of initialRoutes) {
        await setDoc(doc(db, "routes", r.id), r);
      }
      // Seed default reviews
      for (const rx of defaultReviews) {
        await addDoc(collection(db, "reviews"), rx);
      }
    } catch (err: any) {
      console.error("Critical Cloud Seed fail: seeding local models as override standard fallbacks.", err);
      // Even if rules reject or db is offline, ensure lists populate visually
      setSights(initialSights);
      setRoutes(initialRoutes);
      setReviews(defaultReviews);
    }
  };

  const filteredSights = selectedCategory === "all" 
    ? sights 
    : sights.filter(s => s.category === selectedCategory);

  const isAdminUser = currentUser?.role === "admin";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="web_doc_root">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center p-2 text-white font-display shadow-md shadow-teal-600/10">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h1 className="font-display font-black text-rose-950 text-sm md:text-base tracking-tight uppercase leading-none">
                Оьштен Адыгея
              </h1>
              <span className="text-[10px] text-teal-600 tracking-wider font-semibold font-mono uppercase block mt-0.5">
                Интерактивный Путеводитель
              </span>
            </div>
          </div>

          {/* Core navigation links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => { setActiveTab("catalog"); setSelectedRoute(null); }}
              className={`px-4 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition ${
                activeTab === "catalog" && !selectedRoute
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🏔️ Достопримечательности
            </button>
            <button
              onClick={() => { setActiveTab("routes"); }}
              className={`px-4 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition ${
                activeTab === "routes" || selectedRoute
                  ? "bg-white text-slate-800 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🗺️ Маршруты ({routes.length})
            </button>
            {isAdminUser && (
              <button
                onClick={() => { setActiveTab("admin"); }}
                className={`px-4 py-1.5 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-1 ${
                  activeTab === "admin" 
                    ? "bg-teal-600 text-white shadow-sm" 
                    : "text-teal-600 bg-teal-50 hover:bg-teal-100"
                }`}
              >
                🛠️ Админ-панель
              </button>
            )}
          </nav>

          {/* Account Profile widgets */}
          <div className="flex items-center gap-2">
            
            {/* Diploma defense demonstration trigger */}
            <button
              onClick={toggleDemoAdmin}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                isDemoAdminMode
                  ? "bg-red-500 hover:bg-red-600 text-white border-transparent shadow"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
              title="Для защиты диплома: мгновенное тестирование админ-панели и модерации"
              id="demonstration_privilege_escalation"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isDemoAdminMode ? "Выйти из Демо-Админа" : "Включить Демо-Админ"}</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 border-l border-slate-100 pl-2">
                <img 
                  src={currentUser.photoURL} 
                  alt={currentUser.displayName} 
                  className="w-8 h-8 rounded-full border border-teal-500 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden lg:block text-left">
                  <span className="text-xs font-bold text-slate-800 block truncate max-w-[100px]">
                    {currentUser.displayName}
                  </span>
                  <span className="text-[9px] text-slate-400 capitalize bg-slate-50 px-1 py-0.5 rounded border border-slate-100">
                    {currentUser.role}
                  </span>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                  title="Выйти из аккаунта"
                  id="btn_sign_out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthError(null); setAuthModalOpen(true); }}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs md:text-sm px-4.5 py-2 rounded-xl transition shadow-md hover:shadow-teal-600/20 inline-flex items-center gap-1.5"
                id="btn_header_sign_in"
              >
                <User className="w-4 h-4" />
                <span>Войти / Создать аккаунт</span>
              </button>
            )}

          </div>
        </div>
      </header>

      {/* TOP LANDING COVER SLIDER */}
      <section className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white relative overflow-hidden shrink-0 py-12 md:py-20">
        
        {/* Scenic overlay graphic */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&q=80&w=1500')] bg-cover bg-center brightness-[0.25] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10 space-y-4">
          <span className="bg-teal-500/20 text-teal-300 font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-teal-500/30">
            ⛰️ Кавказский Государственный Заповедник
          </span>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl tracking-tight leading-tight">
            Ваш путеводитель по Республике Адыгея
          </h2>
          <p className="text-slate-300 text-xs md:text-base max-w-2xl mx-auto font-light leading-relaxed">
            Откройте для себя нетронутые альпийские луга Лаго-Наки, бурные ущелья Хаджоха, древние афоновские святыни и расслабьтесь в термальных парках. Спланируйте лучший маршрут с искусственным интеллектом!
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-slate-400">Популярно:</span>
            {["Лаго-Наки", "Руфабго", "Фишт", "Адыгейский сыр"].map((keyword, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveTab("catalog");
                  setSelectedRoute(null);
                  const found = sights.find(s => s.title.toLowerCase().includes(keyword.toLowerCase()));
                  if (found) {
                    setSelectedSight(found);
                    const el = document.getElementById(`sight_card_${found.id}`);
                    el?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] rounded-lg border border-white/10 transition text-slate-100"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* MOBILE LOWER NAV TABS */}
      <div className="block md:hidden bg-white border-b border-slate-100 sticky top-16 z-30 p-2">
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => { setActiveTab("catalog"); setSelectedRoute(null); }}
            className={`py-2 text-xs font-semibold rounded-xl text-center ${
              activeTab === "catalog" && !selectedRoute
                ? "bg-teal-50 text-teal-800" 
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            🏔️ Места
          </button>
          <button
            onClick={() => { setActiveTab("routes"); }}
            className={`py-2 text-xs font-semibold rounded-xl text-center ${
              activeTab === "routes" || selectedRoute
                ? "bg-teal-50 text-teal-800"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            🗺️ Пути ({routes.length})
          </button>
          <button
            onClick={toggleDemoAdmin}
            className={`py-2 text-xs font-bold rounded-xl text-center ${
              isDemoAdminMode
                ? "bg-red-500 text-white"
                : "text-rose-800 bg-rose-50 hover:bg-rose-100"
            }`}
          >
            ⚙️ Демо-Админ
          </button>
        </div>
      </div>

      {/* MAIN BENTO LAYOUT BLOCK */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full">
        
        {/* ADMIN TAB OVERLAY VIEW */}
        {activeTab === "admin" && isAdminUser && (
          <div className="mb-6">
            <AdminPanel
              sights={sights}
              routes={routes}
              reviews={reviews}
              onAddSight={handleAddSight}
              onAddRoute={handleAddRoute}
              onDeleteSight={handleDeleteSight}
              onDeleteRoute={handleDeleteRoute}
              onDeleteReview={handleDeleteReview}
              onSeedData={handleSeedData}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="bento_layout_main_grid">
          
          {/* --- LEFT COLUMN: SIGHTS CATALOG / ROUTES VIEW (7 columns wide) --- */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* catalog catalog page */}
            {activeTab === "catalog" && !selectedRoute && (
              <div className="space-y-5">
                
                {/* Category selectors */}
                <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase ml-1">
                    КАТЕГОРИИ:
                  </span>
                  <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                          selectedCategory === cat.id 
                            ? "bg-teal-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        id={`cat_select_${cat.id}`}
                      >
                        <span className="mr-1">{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sights Card listing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredSights.map((sight) => {
                    const isSelected = selectedSight?.id === sight.id;
                    const sightReviews = reviews.filter(r => r.sightId === sight.id);
                    
                    return (
                      <div
                        key={sight.id}
                        onClick={() => setSelectedSight(sight)}
                        className={`bg-white rounded-3xl border text-left cursor-pointer overflow-hidden transition-all duration-300 transform group ${
                          isSelected 
                            ? "ring-2 ring-teal-600 border-teal-50 hover:scale-[1.01]" 
                            : "border-slate-100 hover:shadow-lg hover:-translate-y-1"
                        }`}
                        id={`sight_card_${sight.id}`}
                      >
                        {/* Img cover */}
                        <div className="h-44 overflow-hidden relative">
                          <img
                            src={sight.image}
                            alt={sight.title}
                            className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2.5 left-2.5 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-xl text-[10px] font-mono font-medium uppercase tracking-wider">
                            {sight.location.split(",")[0]}
                          </div>

                          <div className="absolute bottom-2.5 right-2.5 bg-teal-600 text-white px-2.5 py-0.5 rounded-lg text-[9px] font-bold tracking-wide uppercase">
                            {sight.category}
                          </div>
                        </div>

                        {/* Card copy */}
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-display font-black text-sm md:text-base text-slate-800 tracking-tight truncate">
                              {sight.title}
                            </h3>
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg text-xs font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{sight.rating}</span>
                            </div>
                          </div>

                          <p className="text-slate-500 text-xs md:text-sm line-clamp-2 leading-relaxed h-10">
                            {sight.shortDescription}
                          </p>

                          <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] text-slate-400 font-medium">
                            <span>🗺️ {sight.coordinates.lat.toFixed(2)}°, {sight.coordinates.lng.toFixed(2)}°</span>
                            <span>{sightReviews.length} отзывов</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sights detailed full documentation reader */}
                {selectedSight ? (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl space-y-6 text-left transition duration-300" id="selected_sight_detail_reader">
                    
                    {/* Top presentation title */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="bg-teal-50 text-teal-700 font-mono text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-lg border border-teal-100">
                          {selectedSight.category}
                        </span>
                        
                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 font-bold text-xs px-3.5 py-1 rounded-xl border border-amber-100">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span>Средняя оценка: {selectedSight.rating} из 5 ({selectedSight.reviewsCount} голосов)</span>
                        </div>
                      </div>

                      <h2 className="font-display font-black text-xl md:text-2xl text-slate-900 tracking-tight">
                        {selectedSight.title}
                      </h2>

                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Адрес: {selectedSight.location}</span>
                        <span className="font-mono text-slate-400">| GPS: {selectedSight.coordinates.lat}° N, {selectedSight.coordinates.lng}° E</span>
                      </p>
                    </div>

                    {/* Image visual hero */}
                    <div className="rounded-2xl overflow-hidden shadow-md max-h-[300px]">
                      <img 
                        src={selectedSight.image} 
                        alt={selectedSight.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Rich description */}
                    <div className="markdown-body p-1 border-b border-slate-100 pb-6 text-xs md:text-sm">
                      {/* Formatted markdown-like parser */}
                      {selectedSight.description.split("\n\n").map((chunk, idx) => {
                        if (chunk.startsWith("###")) {
                          return <h3 key={idx} className="font-display font-black text-slate-800 text-sm md:text-base tracking-tight mt-4">{chunk.replace("### ", "")}</h3>;
                        }
                        if (chunk.startsWith("**")) {
                          return <p key={idx} className="text-slate-700 leading-relaxed font-semibold">{chunk.replace(/\*\*/g, "")}</p>;
                        }
                        return <p key={idx} className="text-slate-600 leading-relaxed">{chunk}</p>;
                      })}
                    </div>

                    {/* Reviews subcomponent integration */}
                    <ReviewList
                      sightId={selectedSight.id}
                      reviews={reviews}
                      currentUser={currentUser}
                      onAddReview={handleAddNewReview}
                      onDeleteReview={handleDeleteReview}
                    />

                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center text-slate-400 text-xs shadow">
                    Пожалуйста, создайте или выберите достопримечательность для отображения детального описания
                  </div>
                )}

              </div>
            )}

            {/* --- ROUTES DIRECTORY PAGE --- */}
            {(activeTab === "routes" || selectedRoute) && (
              <div className="space-y-6 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="font-display font-black text-lg md:text-xl text-slate-800">
                      Рекомендованные туристические маршруты по Адыгее
                    </h2>
                    <p className="text-xs text-slate-400">Путешествуйте уверенно по готовым планам</p>
                  </div>

                  {selectedRoute && (
                    <button
                      onClick={() => { setSelectedRoute(null); setActiveTab("routes"); }}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs rounded-xl transition"
                    >
                      ← Назад к списку
                    </button>
                  )}
                </div>

                {/* If individual route is selected, show Route Guide Doc */}
                {selectedRoute ? (
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xl space-y-6">
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-teal-600 text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg">
                          ⏳ {selectedRoute.duration}
                        </span>
                        <span className={`px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg border ${
                          selectedRoute.difficulty === "easy"
                            ? "bg-green-50 text-green-700 border-green-100"
                            : selectedRoute.difficulty === "medium"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                          Сложность: {selectedRoute.difficulty}
                        </span>
                      </div>
                      <h3 className="font-display font-black text-xl md:text-2xl text-rose-950 mt-2">
                        {selectedRoute.title}
                      </h3>
                    </div>

                    <div className="rounded-2xl overflow-hidden h-52">
                      <img 
                        src={selectedRoute.image} 
                        alt={selectedRoute.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Route markdown details */}
                    <div className="markdown-body p-1 text-slate-600 text-xs md:text-sm leading-relaxed border-b border-slate-100 pb-6">
                      {selectedRoute.description.split("\n\n").map((chunk, idx) => {
                        if (chunk.startsWith("###")) {
                          return <h3 key={idx} className="font-display font-bold text-slate-800 tracking-tight text-sm md:text-base mt-4">{chunk.replace("### ", "")}</h3>;
                        }
                        if (chunk.startsWith("####")) {
                          return <h4 key={idx} className="font-display font-medium text-teal-700 text-xs md:text-sm uppercase tracking-wide mt-3 mb-1">{chunk.replace("#### ", "")}</h4>;
                        }
                        if (chunk.match(/^\d+\./)) {
                          return (
                            <div key={idx} className="pl-4 border-l-2 border-teal-500/20 py-1 my-2 text-slate-700">
                              {chunk}
                            </div>
                          );
                        }
                        return <p key={idx}>{chunk}</p>;
                      })}
                    </div>

                    {/* Connected sights widget inside Route */}
                    <div>
                      <h4 className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
                        Охваченные достопримечательности маршрута:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sights.filter(s => selectedRoute.sightIds.includes(s.id)).map(sightItem => (
                          <div
                            key={sightItem.id}
                            onClick={() => {
                              setSelectedSight(sightItem);
                              setActiveTab("catalog");
                              setSelectedRoute(null);
                            }}
                            className="p-3 rounded-2xl border border-slate-150 hover:border-teal-400 bg-slate-50/50 hover:bg-white cursor-pointer transition flex items-center gap-3"
                          >
                            <img 
                              src={sightItem.image} 
                              alt={sightItem.title} 
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 text-xs block truncate">{sightItem.title}</span>
                              <span className="text-[10px] text-slate-400 truncate block mt-0.5">{sightItem.location}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  // Route list overview
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {routes.map((route) => (
                      <div
                        key={route.id}
                        onClick={() => setSelectedRoute(route)}
                        className="bg-white rounded-3xl border border-slate-100 overflow-hidden text-left shadow-sm hover:shadow-lg transition duration-200 cursor-pointer group"
                      >
                        <div className="h-36 overflow-hidden relative">
                          <img 
                            src={route.image} 
                            alt={route.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2.5 left-2.5 bg-teal-900 text-white px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wide">
                            ⌛ {route.duration}
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <h3 className="font-display font-black text-sm md:text-base text-slate-800 tracking-tight truncate group-hover:text-teal-600 transition">
                            {route.title}
                          </h3>
                          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                            {route.description.replace(/[#*]/g, "").slice(0, 160)}...
                          </p>
                          <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] text-slate-400 font-semibold uppercase font-mono mt-2">
                            <span>{route.sightIds.length} точек на карте</span>
                            <span className="text-teal-600 group-hover:translate-x-1 transition duration-200">Смотреть путь →</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

          </div>

          {/* --- RIGHT COLUMN: MAP & AI ASSISTANT (5 columns wide) --- */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Interactive map module */}
            <MapMock
              sights={filteredSights}
              selectedSight={selectedSight}
              onSelectSight={(sight) => {
                setSelectedSight(sight);
                // Ensure catalog tab is active
                setSelectedRoute(null);
                setActiveTab("catalog");
              }}
            />

            {/* AI Assistant Chatbot module */}
            <AiTouristGuide />

          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 shrink-0 mt-12 text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="font-display font-bold text-sm text-slate-100 tracking-wide uppercase">
            🌲 Республика Адыгея — Земля Гор и Легенд
          </p>
          <p className="text-slate-500/90 leading-relaxed max-w-xl mx-auto text-[11px]">
            Разработано в рамках дипломной работы по проектированию интеллектуальных туристско-информационных комплексов Кавказа. Интегрировано с Firebase Auth, Cloud Firestore и большими языковыми моделями ИИ.
          </p>
          <div className="text-slate-600 text-[10px] font-mono tracking-wider pt-2 border-t border-slate-800 max-w-xs mx-auto">
            © 2026 Khabemizov. Все права защищены.
          </div>
        </div>
      </footer>

      {/* REGISTER / LOGIN POPUP MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden relative" id="auth_dialog_box">
            
            {/* Close button */}
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              id="btn_close_auth_modal"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Title Banner */}
            <div className="bg-slate-900 text-white p-6 pb-8 text-center space-y-1 relative">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 mx-auto border border-teal-500/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-display font-black text-lg pt-2">
                {authIsRegister ? "Создать профиль" : "Вход в путеводитель"}
              </h3>
              <p className="text-xs text-slate-400 font-light">
                {authIsRegister 
                  ? "Публикуйте отзывы, делитесь оценками и исследуйте Адыгею" 
                  : "С возвращением! Авторизуйтесь для полноценного доступа"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleCustomAuth} className="p-6 space-y-4">
              
              {authError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-xl font-semibold">
                  ⚠️ {authError}
                </div>
              )}

              {/* Registration Fields */}
              {authIsRegister && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ваше имя / Псевдоним</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Иван Иванов"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Электронная почта (Email)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Пароль</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Registration Avatars Choice */}
              {authIsRegister && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Выберите аватар</label>
                  <div className="flex gap-2.5">
                    {AVATARS.map((av) => (
                      <button
                        type="button"
                        key={av.id}
                        onClick={() => setAuthAvatarSig(av.id)}
                        className={`w-11 h-11 rounded-full overflow-hidden border-2 transition ${
                          authAvatarSig === av.id 
                            ? "border-teal-600 scale-110 shadow-md ring-4 ring-teal-50" 
                            : "border-slate-200 hover:border-slate-350"
                        }`}
                      >
                        <img src={av.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-2.5 rounded-xl transition shadow-md inline-flex items-center justify-center gap-1.5"
                  id="btn_custom_auth_submit"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{authIsRegister ? "Зарегистрироваться" : "Войти"}</span>
                </button>
              </div>

              {/* Alternatives split */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-semibold tracking-wider uppercase font-mono">Или</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs py-2.5 rounded-xl transition inline-flex items-center justify-center gap-1.5"
                id="btn_google_auth"
              >
                <img src="https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&q=80&w=40" className="w-4 h-4 object-cover rounded-full" alt="" />
                Войти через Google
              </button>

              <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-50">
                <span>
                  {authIsRegister 
                    ? "Уже зарегистрированы?" 
                    : "Ещё нет аккаунта?"}
                </span>{" "}
                <button
                  type="button"
                  onClick={() => { setAuthError(null); setAuthIsRegister(prev => !prev); }}
                  className="text-teal-600 font-bold hover:underline"
                  id="btn_toggle_auth_modal_mode"
                >
                  {authIsRegister ? "Авторизоваться" : "Зарегистрироваться"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
