"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Cpu, ShieldCheck, Zap } from "lucide-react";

const DEMO_USERS = [
  { email: "admin@opsatm.cl", password: "Admin2025!", role: "Administrador" },
  { email: "supervisor@opsatm.cl", password: "Super2025!", role: "Supervisor" },
  { email: "ops@opsatm.cl", password: "Ops2025!", role: "Operaciones" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800));

    const user = DEMO_USERS.find((u) => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem("opsatm_user", JSON.stringify({ email: user.email, role: user.role }));
      router.push("/dashboard");
    } else {
      setError("Credenciales incorrectas. Usa las credenciales demo abajo.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #121418 0%, #1b1e24 50%, #23272f 100%)" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[520px] p-12" style={{ background: "linear-gradient(180deg, rgba(114,176,29,0.08) 0%, rgba(45,52,63,0.05) 100%)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <img src="/Imagen1.jpg" alt="OpsATM Logo" style={{ height: "42px", width: "auto", objectFit: "contain", borderRadius: "4px" }} />
            <div>
              <div className="font-bold text-white text-lg leading-none">OpsATM</div>
              <div className="text-xs font-medium mt-1" style={{ color: "#72b01d" }}>Sistema de Operaciones</div>
            </div>
          </div>

          {/* Hero text */}
          <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: "#f1f5f9" }}>
            Gestión de operaciones
            <br />
            <span className="gradient-text">en tiempo real</span>
          </h1>
          <p style={{ color: "#64748b", fontSize: "15px", lineHeight: "1.7" }}>
            Control total de cajeros ATM, órdenes de trabajo, técnicos en campo, inventario e informes — todo en una sola plataforma.
          </p>
        </div>

        {/* Feature pills */}
        <div className="space-y-3">
          {[
            { icon: <Zap size={15} />, label: "Monitoreo en tiempo real", sub: "248 ATMs activos" },
            { icon: <ShieldCheck size={15} />, label: "Control de acceso por roles", sub: "5 niveles de permiso" },
            { icon: <Cpu size={15} />, label: "Informes automáticos PDF", sub: "Generación en un clic" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(114,176,29,0.15)", color: "#93c947" }}>
                {f.icon}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{f.label}</div>
                <div className="text-xs" style={{ color: "#475569" }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ color: "#64748b", fontSize: "12px" }}>© 2025 OpsATM. Todos los derechos reservados.</div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <img src="/Imagen1.jpg" alt="OpsATM Logo" style={{ height: "40px", width: "auto", objectFit: "contain", borderRadius: "4px" }} />
            <div className="font-bold text-white text-xl">OpsATM</div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: "#f1f5f9" }}>Iniciar sesión</h2>
            <p style={{ color: "#64748b", fontSize: "14px" }}>Accede con tus credenciales corporativas</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#94a3b8" }}>
                Correo electrónico
              </label>
              <input
                id="email-input"
                type="email"
                className="ops-input"
                placeholder="tu@empresa.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#94a3b8" }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  className="ops-input pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Autenticando…
                </>
              ) : (
                "Ingresar al sistema"
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-xl" style={{ background: "rgba(114,176,29,0.05)", border: "1px solid rgba(114,176,29,0.15)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "#72b01d" }}>ACCESOS DEMO</p>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <button
                   key={u.email}
                   type="button"
                   onClick={() => { setEmail(u.email); setPassword(u.password); }}
                   className="w-full text-left p-2 rounded-lg transition-colors"
                   style={{ background: "rgba(255,255,255,0.02)", fontSize: "12px" }}
                >
                   <span className="font-semibold" style={{ color: "#93c947" }}>{u.role}</span>
                   <span style={{ color: "#475569" }}> — {u.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-xs" style={{ color: "#334155" }}>
            ¿Olvidaste tu contraseña?{" "}
            <a href="#" style={{ color: "#72b01d" }}>Recuperar acceso</a>
          </p>
        </div>
      </div>

      {/* Background decorations */}
      <div style={{ position: "fixed", top: "-200px", right: "-200px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(114,176,29,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-200px", left: "-100px", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
    </div>
  );
}
