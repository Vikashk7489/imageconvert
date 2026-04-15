import { useEffect, useMemo, useRef, useState } from "react";
import {
  Coins,
  Home,
  Library,
  Lock,
  Pause,
  Play,
  Plus,
  Search,
  SkipBack,
  SkipForward,
  Star,
  Store,
  User,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type Category = "Story" | "Bhakti" | "Horror" | "Romance" | "Action";

type Episode = {
  id: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  description: string;
  audioUrl: string;
  thumbnail?: string;
  isFree: boolean;
  coinPrice: number;
  plays: number;
  totalListeningSeconds: number;
};

type Series = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: Category;
  rating: number;
  totalPlays: number;
  banner: boolean;
};

type AppUser = {
  id: string;
  name: string;
  emailOrMobile: string;
  password: string;
  coinBalance: number;
  totalListeningSeconds: number;
  plays: number;
  lastActive: string;
  coinsSpent: number;
};

type ListeningProgress = Record<string, number>;
type UnlockedEpisodes = Set<string>;

const categories: Category[] = ["Story", "Bhakti", "Horror", "Romance", "Action"];

const seedSeries: Series[] = [
  {
    id: "s1",
    title: "Midnight Whispers",
    description: "A thrilling horror anthology with cliffhangers.",
    thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
    category: "Horror",
    rating: 4.8,
    totalPlays: 38520,
    banner: true,
  },
  {
    id: "s2",
    title: "Ishq in Metro",
    description: "Modern romance stories with unexpected turns.",
    thumbnail: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800",
    category: "Romance",
    rating: 4.6,
    totalPlays: 27880,
    banner: true,
  },
  {
    id: "s3",
    title: "Krishna Leela",
    description: "Devotional bhakti series with soulful narration.",
    thumbnail: "https://images.unsplash.com/photo-1572953109213-3be62398eb95?w=800",
    category: "Bhakti",
    rating: 4.9,
    totalPlays: 43100,
    banner: false,
  },
];

const seedEpisodes: Episode[] = [
  {
    id: "e1",
    seriesId: "s1",
    episodeNumber: 1,
    title: "The Door at 3 AM",
    description: "A chilling beginning.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    isFree: true,
    coinPrice: 0,
    plays: 8500,
    totalListeningSeconds: 450000,
  },
  {
    id: "e2",
    seriesId: "s1",
    episodeNumber: 2,
    title: "Basement Breathing",
    description: "Something is alive below.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    isFree: false,
    coinPrice: 20,
    plays: 7200,
    totalListeningSeconds: 392000,
  },
  {
    id: "e3",
    seriesId: "s2",
    episodeNumber: 1,
    title: "Meet Cute",
    description: "A rainy day romance starts.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    isFree: true,
    coinPrice: 0,
    plays: 9800,
    totalListeningSeconds: 480000,
  },
  {
    id: "e4",
    seriesId: "s2",
    episodeNumber: 2,
    title: "Texting Till Sunrise",
    description: "Late-night feelings.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    isFree: false,
    coinPrice: 15,
    plays: 6400,
    totalListeningSeconds: 318000,
  },
  {
    id: "e5",
    seriesId: "s3",
    episodeNumber: 1,
    title: "Bal Krishna",
    description: "Childhood miracles.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    isFree: true,
    coinPrice: 0,
    plays: 12000,
    totalListeningSeconds: 590000,
  },
];

const seedUsers: AppUser[] = [
  {
    id: "u1",
    name: "Demo User",
    emailOrMobile: "demo@pocketaudio.app",
    password: "123456",
    coinBalance: 120,
    totalListeningSeconds: 8120,
    plays: 23,
    lastActive: new Date().toISOString(),
    coinsSpent: 35,
  },
];

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const Index = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [users, setUsers] = useState<AppUser[]>(seedUsers);
  const [series, setSeries] = useState<Series[]>(seedSeries);
  const [episodes, setEpisodes] = useState<Episode[]>(seedEpisodes);
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [emailOrMobile, setEmailOrMobile] = useState("demo@pocketaudio.app");
  const [password, setPassword] = useState("123456");
  const [name, setName] = useState("Demo User");
  const [nav, setNav] = useState<"home" | "search" | "library" | "store" | "profile">("home");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(seedSeries[0].id);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>(seedEpisodes[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [episodeSearch, setEpisodeSearch] = useState("");
  const [seriesSearch, setSeriesSearch] = useState("");
  const [autoUnlock, setAutoUnlock] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [listeningProgress, setListeningProgress] = useState<ListeningProgress>({});
  const [unlockedEpisodes, setUnlockedEpisodes] = useState<UnlockedEpisodes>(new Set(["e1", "e3", "e5"]));
  const [dailyPlays, setDailyPlays] = useState<{ day: string; plays: number; users: number }[]>([
    { day: "Mon", plays: 122, users: 48 },
    { day: "Tue", plays: 156, users: 62 },
    { day: "Wed", plays: 202, users: 71 },
    { day: "Thu", plays: 219, users: 84 },
    { day: "Fri", plays: 260, users: 91 },
    { day: "Sat", plays: 301, users: 105 },
    { day: "Sun", plays: 280, users: 98 },
  ]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeUser = users.find((u) => u.id === activeUserId) ?? null;
  const selectedSeries = series.find((s) => s.id === selectedSeriesId) ?? series[0];
  const seriesEpisodes = episodes
    .filter((ep) => ep.seriesId === selectedSeries?.id)
    .sort((a, b) => a.episodeNumber - b.episodeNumber);
  const selectedEpisode = episodes.find((e) => e.id === selectedEpisodeId) ?? seriesEpisodes[0];

  useEffect(() => {
    if (selectedSeries && !seriesEpisodes.length) {
      setSelectedEpisodeId("");
    } else if (seriesEpisodes.length && !seriesEpisodes.some((e) => e.id === selectedEpisodeId)) {
      setSelectedEpisodeId(seriesEpisodes[0].id);
    }
  }, [selectedSeries, seriesEpisodes, selectedEpisodeId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate, selectedEpisodeId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || audio.paused || !activeUserId || !selectedEpisode) return;

      setListeningProgress((prev) => ({
        ...prev,
        [selectedEpisode.id]: Math.floor(audio.currentTime),
      }));

      setEpisodes((prev) =>
        prev.map((ep) =>
          ep.id === selectedEpisode.id
            ? { ...ep, totalListeningSeconds: ep.totalListeningSeconds + 1 }
            : ep,
        ),
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.id === activeUserId
            ? {
                ...u,
                totalListeningSeconds: u.totalListeningSeconds + 1,
                lastActive: new Date().toISOString(),
              }
            : u,
        ),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeUserId, selectedEpisode]);

  const filteredSeries = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return series.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    );
  }, [series, searchTerm]);

  const filteredEpisodes = useMemo(() => {
    const q = episodeSearch.toLowerCase();
    return episodes.filter(
      (e) => e.title.toLowerCase().includes(q) || String(e.episodeNumber).includes(q),
    );
  }, [episodes, episodeSearch]);

  const signIn = () => {
    const found = users.find((u) => u.emailOrMobile === emailOrMobile && u.password === password);
    if (found) setActiveUserId(found.id);
  };

  const signUp = () => {
    const id = `u${Date.now()}`;
    const created: AppUser = {
      id,
      name,
      emailOrMobile,
      password,
      coinBalance: 60,
      totalListeningSeconds: 0,
      plays: 0,
      lastActive: new Date().toISOString(),
      coinsSpent: 0,
    };
    setUsers((prev) => [...prev, created]);
    setActiveUserId(id);
  };

  const unlockEpisode = (episode: Episode) => {
    if (!activeUser || episode.isFree || unlockedEpisodes.has(episode.id)) return true;
    if (activeUser.coinBalance < episode.coinPrice) return false;

    setUsers((prev) =>
      prev.map((u) =>
        u.id === activeUser.id
          ? {
              ...u,
              coinBalance: u.coinBalance - episode.coinPrice,
              coinsSpent: u.coinsSpent + episode.coinPrice,
            }
          : u,
      ),
    );
    setUnlockedEpisodes((prev) => new Set([...prev, episode.id]));
    return true;
  };

  const playEpisode = (episode: Episode) => {
    const canPlay = episode.isFree || unlockedEpisodes.has(episode.id) || (autoUnlock && unlockEpisode(episode));
    if (!canPlay) return;

    setSelectedSeriesId(episode.seriesId);
    setSelectedEpisodeId(episode.id);

    setEpisodes((prev) => prev.map((ep) => (ep.id === episode.id ? { ...ep, plays: ep.plays + 1 } : ep)));
    setSeries((prev) => prev.map((s) => (s.id === episode.seriesId ? { ...s, totalPlays: s.totalPlays + 1 } : s)));

    if (activeUserId) {
      setUsers((prev) => prev.map((u) => (u.id === activeUserId ? { ...u, plays: u.plays + 1 } : u)));
      setDailyPlays((prev) =>
        prev.map((p, i) => (i === prev.length - 1 ? { ...p, plays: p.plays + 1, users: p.users + 1 } : p)),
      );
    }

    setTimeout(() => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = listeningProgress[episode.id] ?? 0;
      audio.play();
    }, 100);
  };

  const adminTotals = {
    users: users.length,
    plays: episodes.reduce((acc, ep) => acc + ep.plays, 0),
    earningsCoins: users.reduce((acc, u) => acc + u.coinsSpent, 0),
    earningsINR: users.reduce((acc, u) => acc + u.coinsSpent, 0) * 1,
    audioUploaded: episodes.length,
  };

  if (!activeUserId && !isAdminMode) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 p-5 space-y-4">
          <h1 className="text-2xl font-semibold">Pocket Audio</h1>
          <p className="text-sm text-zinc-400">Login/signup with mobile/email + password</p>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <Input value={emailOrMobile} onChange={(e) => setEmailOrMobile(e.target.value)} placeholder="Email or mobile" />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
          {authView === "login" ? (
            <Button onClick={signIn} className="w-full">Login</Button>
          ) : (
            <Button onClick={signUp} className="w-full">Sign up</Button>
          )}
          <Button variant="secondary" className="w-full" onClick={() => setAuthView((v) => (v === "login" ? "signup" : "login"))}>
            Switch to {authView === "login" ? "Sign up" : "Login"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setIsAdminMode(true)}>
            Continue as Admin
          </Button>
        </Card>
      </div>
    );
  }

  if (maintenanceMode && !isAdminMode) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Maintenance Mode Enabled</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <audio ref={audioRef} src={selectedEpisode?.audioUrl} />

      <header className="sticky top-0 z-20 bg-zinc-950/95 border-b border-zinc-800 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Pocket Audio</h1>
          <p className="text-xs text-zinc-400">Mobile-first streaming platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-300">
            <Coins className="h-3 w-3 mr-1" /> {activeUser?.coinBalance ?? 0}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => setIsAdminMode((v) => !v)}>
            {isAdminMode ? "User" : "Admin"}
          </Button>
        </div>
      </header>

      {!isAdminMode ? (
        <main className="p-4 space-y-4">
          <Input placeholder="Search audio series or episodes" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <section>
            <h2 className="font-semibold mb-2">Banners</h2>
            <div className="grid grid-cols-1 gap-3">
              {series.filter((s) => s.banner).map((s) => (
                <Card key={s.id} className="bg-zinc-900 border-zinc-800 overflow-hidden" onClick={() => setSelectedSeriesId(s.id)}>
                  <img src={s.thumbnail} alt={s.title} className="h-32 w-full object-cover" />
                  <div className="p-3">
                    <p className="font-medium">{s.title}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Categories</h2>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button key={cat} size="sm" variant="secondary" onClick={() => setSearchTerm(cat)}>
                  {cat}
                </Button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Audio Series</h2>
            <div className="space-y-3">
              {filteredSeries.map((s) => (
                <Card key={s.id} className="bg-zinc-900 border-zinc-800 p-3" onClick={() => setSelectedSeriesId(s.id)}>
                  <div className="flex gap-3">
                    <img src={s.thumbnail} alt={s.title} className="h-16 w-16 rounded object-cover" />
                    <div className="flex-1">
                      <p className="font-medium">{s.title}</p>
                      <div className="text-xs text-zinc-400 flex gap-3 mt-1">
                        <span className="flex items-center"><Star className="h-3 w-3 mr-1" />{s.rating}</span>
                        <span>{s.totalPlays.toLocaleString()} plays</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-3">
            <h3 className="font-semibold">{selectedSeries?.title}</h3>
            <p className="text-sm text-zinc-400">{selectedSeries?.description}</p>
            <Button className="w-full" onClick={() => selectedEpisode && playEpisode(selectedEpisode)}>Resume</Button>
            <div className="space-y-2">
              {seriesEpisodes.map((ep) => {
                const unlocked = ep.isFree || unlockedEpisodes.has(ep.id);
                return (
                  <div key={ep.id} className="flex items-center justify-between bg-zinc-800 rounded p-2">
                    <div>
                      <p className="text-sm">Episode {ep.episodeNumber}: {ep.title}</p>
                      <p className="text-xs text-zinc-400">{formatTime(listeningProgress[ep.id] ?? 0)} listened</p>
                    </div>
                    <Button size="sm" onClick={() => playEpisode(ep)}>
                      {unlocked ? <Play className="h-4 w-4" /> : <><Lock className="h-4 w-4 mr-1" />{ep.coinPrice}</>}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>

          {selectedEpisode && (
            <Card className="bg-zinc-900 border-zinc-800 p-4 space-y-3">
              <p className="font-medium">Now Playing: {selectedEpisode.title}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => audioRef.current?.play()}><Play className="h-4 w-4 mr-1" />Play</Button>
                <Button variant="secondary" onClick={() => audioRef.current?.pause()}><Pause className="h-4 w-4 mr-1" />Pause</Button>
                <Button variant="secondary" onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }}><SkipBack className="h-4 w-4 mr-1" />10s</Button>
                <Button variant="secondary" onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10; }}><SkipForward className="h-4 w-4 mr-1" />10s</Button>
              </div>
              <div className="flex gap-2">
                {[1, 1.5, 2].map((rate) => (
                  <Button key={rate} size="sm" variant={rate === playbackRate ? "default" : "outline"} onClick={() => setPlaybackRate(rate)}>
                    {rate}x
                  </Button>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Auto unlock</span>
                <Switch checked={autoUnlock} onCheckedChange={setAutoUnlock} />
              </div>
            </Card>
          )}

          <section>
            <h2 className="font-semibold mb-2">Continue Listening</h2>
            <div className="space-y-2">
              {Object.entries(listeningProgress)
                .filter(([, secs]) => secs > 0)
                .map(([id, secs]) => {
                  const ep = episodes.find((e) => e.id === id);
                  if (!ep) return null;
                  return (
                    <Card key={id} className="bg-zinc-900 border-zinc-800 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">{ep.title}</p>
                          <p className="text-xs text-zinc-400">{formatTime(secs)} progress</p>
                        </div>
                        <Button size="sm" onClick={() => playEpisode(ep)}>Resume</Button>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </section>
        </main>
      ) : (
        <main className="p-4 space-y-4">
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-zinc-900 border-zinc-800 p-3"><Users className="h-4 w-4 mb-1" />Users: {adminTotals.users}</Card>
            <Card className="bg-zinc-900 border-zinc-800 p-3"><Play className="h-4 w-4 mb-1" />Plays: {adminTotals.plays}</Card>
            <Card className="bg-zinc-900 border-zinc-800 p-3"><Coins className="h-4 w-4 mb-1" />Coins: {adminTotals.earningsCoins}</Card>
            <Card className="bg-zinc-900 border-zinc-800 p-3">₹ {adminTotals.earningsINR}</Card>
          </div>
          <Card className="bg-zinc-900 border-zinc-800 p-3 h-56">
            <p className="text-sm mb-2">Daily plays & user activity</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyPlays}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="day" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" />
                <Tooltip />
                <Line type="monotone" dataKey="plays" stroke="#a855f7" strokeWidth={2} />
                <Line type="monotone" dataKey="users" stroke="#22d3ee" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">Maintenance mode</p>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
            <p className="text-xs text-zinc-400">Enable/disable app access</p>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-3 space-y-2">
            <p className="font-medium">User Analytics</p>
            {users.map((u) => (
              <div key={u.id} className="text-xs border border-zinc-800 rounded p-2">
                <p>{u.name} ({u.emailOrMobile})</p>
                <p>Total listening: {Math.floor(u.totalListeningSeconds / 60)} min</p>
                <p>Plays: {u.plays} | Coins spent: {u.coinsSpent}</p>
                <p>Last active: {new Date(u.lastActive).toLocaleString()}</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="secondary" onClick={() => setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, coinBalance: x.coinBalance + 20 } : x))}>+20 coins</Button>
                  <Button size="sm" variant="secondary" onClick={() => setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, coinBalance: Math.max(0, x.coinBalance - 20) } : x))}>-20 coins</Button>
                </div>
              </div>
            ))}
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-3 space-y-2">
            <p className="font-medium">Create Audio Series</p>
            <Input placeholder="Search series" value={seriesSearch} onChange={(e) => setSeriesSearch(e.target.value)} />
            <Button
              onClick={() =>
                setSeries((prev) => [
                  ...prev,
                  {
                    id: `s${Date.now()}`,
                    title: `New Series ${prev.length + 1}`,
                    description: "Newly created description",
                    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
                    category: "Story",
                    rating: 4.2,
                    totalPlays: 0,
                    banner: false,
                  },
                ])
              }
            >
              <Plus className="h-4 w-4 mr-1" />Create series
            </Button>
            <div className="space-y-1 text-sm">
              {series.filter((s) => s.title.toLowerCase().includes(seriesSearch.toLowerCase())).map((s) => (
                <div key={s.id} className="flex items-center justify-between border border-zinc-800 rounded p-2">
                  <span>{s.title}</span>
                  <Badge>{s.category}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-3 space-y-2">
            <p className="font-medium">Episode Management</p>
            <Input placeholder="Search episode by title or number" value={episodeSearch} onChange={(e) => setEpisodeSearch(e.target.value)} />
            <Button
              variant="secondary"
              onClick={() => {
                const firstSeries = series[0];
                if (!firstSeries) return;
                setEpisodes((prev) => [
                  ...prev,
                  {
                    id: `e${Date.now()}`,
                    seriesId: firstSeries.id,
                    episodeNumber: prev.length + 1,
                    title: `Episode ${prev.length + 1}`,
                    description: "Uploaded MP3 episode",
                    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
                    thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800",
                    isFree: false,
                    coinPrice: 10,
                    plays: 0,
                    totalListeningSeconds: 0,
                  },
                ]);
              }}
            >
              Add episode
            </Button>
            <div className="space-y-2">
              {filteredEpisodes.map((ep) => (
                <div key={ep.id} className="border border-zinc-800 rounded p-2 text-xs">
                  <p>Ep {ep.episodeNumber}: {ep.title}</p>
                  <p>Plays: {ep.plays} | Listen: {Math.floor(ep.totalListeningSeconds / 60)} min</p>
                  <p>{ep.isFree ? "FREE" : `LOCKED (${ep.coinPrice} coins)`}</p>
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" variant="secondary" onClick={() => setEpisodes((prev) => prev.map((e) => e.id === ep.id ? { ...e, isFree: !e.isFree } : e))}>{ep.isFree ? "Set Locked" : "Set Free"}</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEpisodes((prev) => prev.map((e) => e.id === ep.id ? { ...e, coinPrice: e.coinPrice + 5 } : e))}>+5 coins</Button>
                    <Button size="sm" variant="destructive" onClick={() => setEpisodes((prev) => prev.filter((e) => e.id !== ep.id))}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 p-3 h-56">
            <p className="text-sm mb-2">Most popular episodes</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...episodes].sort((a, b) => b.plays - a.plays).slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="title" hide />
                <YAxis stroke="#a1a1aa" />
                <Tooltip />
                <Bar dataKey="plays" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </main>
      )}

      {!isAdminMode && (
        <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 grid grid-cols-5 px-2 py-2">
          {[
            ["home", Home],
            ["search", Search],
            ["library", Library],
            ["store", Store],
            ["profile", User],
          ].map(([key, Icon]) => (
            <button key={key} className={`flex flex-col items-center text-xs ${nav === key ? "text-purple-400" : "text-zinc-400"}`} onClick={() => setNav(key as typeof nav)}>
              <Icon className="h-4 w-4" />
              {key}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default Index;
